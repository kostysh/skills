CREATE SCHEMA preview_desk;
CREATE ROLE preview_writer LOGIN;
CREATE ROLE preview_reader LOGIN;
GRANT USAGE ON SCHEMA preview_desk TO preview_writer, preview_reader;

CREATE TABLE preview_desk.previews (
  id bigint PRIMARY KEY, subject_key text NOT NULL, net_minor bigint NOT NULL,
  fee_minor bigint NOT NULL, expires_at bigint NOT NULL
);
CREATE TABLE preview_desk.exports (
  id bigint PRIMARY KEY REFERENCES preview_desk.previews(id),
  subject_key text NOT NULL, fee_minor bigint NOT NULL
);

-- A sequence counts attempted inserts even when a transaction rolls back.
CREATE SEQUENCE preview_desk.insert_attempt;
CREATE FUNCTION preview_desk.note_attempt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM nextval('preview_desk.insert_attempt');
  RETURN NEW;
END;
$$;
CREATE TRIGGER preview_insert_attempt BEFORE INSERT ON preview_desk.previews
  FOR EACH ROW EXECUTE FUNCTION preview_desk.note_attempt();
CREATE TRIGGER export_insert_attempt BEFORE INSERT ON preview_desk.exports
  FOR EACH ROW EXECUTE FUNCTION preview_desk.note_attempt();

CREATE FUNCTION preview_desk.store(r jsonb, now_at bigint) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  lower_minor constant numeric := -9223372036854775808::numeric;
  upper_minor constant numeric := 9223372036854775807::numeric;
  unit_minor numeric;
  net numeric;
  fee numeric;
  record_id bigint;
  subject text;
  expiry bigint;
BEGIN
  IF NOT (r ?& ARRAY['id','subjectKey','unitMinor','currency','scale','quantity','expiresAt'])
    OR jsonb_typeof(r->'unitMinor') IS DISTINCT FROM 'string'
    OR (r->>'unitMinor') !~ '^(0|-?[1-9][0-9]*)$'
    OR r->>'currency' IS DISTINCT FROM 'EUR' OR r->'scale' IS DISTINCT FROM '2'::jsonb
    OR jsonb_typeof(r->'quantity') IS DISTINCT FROM 'number' OR (r->>'quantity') !~ '^([1-9]|10)$'
    OR jsonb_typeof(r->'id') IS DISTINCT FROM 'number' OR (r->>'id') !~ '^[1-9][0-9]*$'
    OR jsonb_typeof(r->'subjectKey') IS DISTINCT FROM 'string' OR (r->>'subjectKey') !~ '^synthetic-[0-9]+$'
    OR jsonb_typeof(r->'expiresAt') IS DISTINCT FROM 'number' OR (r->>'expiresAt') !~ '^(0|[1-9][0-9]*)$' THEN
    RETURN jsonb_build_object('error','input');
  END IF;
  IF (r->>'id')::numeric > 9007199254740991 OR (r->>'expiresAt')::numeric > 9007199254740991
    OR (r->>'expiresAt')::numeric <= now_at THEN
    RETURN jsonb_build_object('error','input');
  END IF;
  IF length(ltrim(r->>'unitMinor','-')) > 19 THEN RETURN jsonb_build_object('error','range'); END IF;
  unit_minor := (r->>'unitMinor')::numeric;
  net := unit_minor * (r->>'quantity')::numeric;
  -- Exact multiplication by one half preserves the half-unit at both int64 limits.
  fee := floor(net * 0.5::numeric);
  IF unit_minor NOT BETWEEN lower_minor AND upper_minor OR net NOT BETWEEN lower_minor AND upper_minor
    OR fee NOT BETWEEN lower_minor AND upper_minor THEN RETURN jsonb_build_object('error','range'); END IF;
  record_id := (r->>'id')::bigint;
  subject := r->>'subjectKey';
  expiry := (r->>'expiresAt')::bigint;
  INSERT INTO preview_desk.previews VALUES (record_id, subject, net::bigint, fee::bigint, expiry);
  INSERT INTO preview_desk.exports VALUES (record_id, subject, fee::bigint);
  RETURN jsonb_build_object('row',jsonb_build_object('id',record_id,'subjectKey',subject,
    'netMinor',net::bigint::text,'feeMinor',fee::bigint::text,'expiresAt',expiry),
    'export',jsonb_build_object('id',record_id,'subjectKey',subject,'feeMinor',fee::bigint::text));
END;
$$;
REVOKE ALL ON FUNCTION preview_desk.store(jsonb,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION preview_desk.store(jsonb,bigint) TO preview_writer;
GRANT INSERT ON preview_desk.previews, preview_desk.exports TO preview_writer;
GRANT USAGE ON SEQUENCE preview_desk.insert_attempt TO preview_writer;
GRANT SELECT ON preview_desk.previews, preview_desk.exports, preview_desk.insert_attempt TO preview_reader;
