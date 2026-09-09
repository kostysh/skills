CREATE SCHEMA domain_rev_base;
SET search_path=domain_rev_base;
CREATE TABLE previews(id bigint PRIMARY KEY, "subjectKey" text NOT NULL, "netMinor" bigint NOT NULL, "feeMinor" bigint NOT NULL, "expiresAt" bigint NOT NULL);
CREATE TABLE exports(id bigint PRIMARY KEY REFERENCES previews(id), "subjectKey" text NOT NULL, "feeMinor" bigint NOT NULL);
CREATE FUNCTION calculate(r jsonb, now_at bigint) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE u numeric; n numeric; f numeric; k text; v numeric;
BEGIN
 IF r IS NULL OR jsonb_typeof(r) <> 'object' OR now_at IS NULL OR abs(now_at::numeric)>9007199254740991 THEN RAISE EXCEPTION 'invalid input'; END IF;
 FOREACH k IN ARRAY ARRAY['id','scale','quantity','expiresAt'] LOOP
  IF jsonb_typeof(r->k) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'invalid input'; END IF;
  v := (r->>k)::numeric;
  IF v<>trunc(v) OR abs(v)>9007199254740991 THEN RAISE EXCEPTION 'invalid input'; END IF;
 END LOOP;
 IF (r->>'id')::numeric<=0 OR (r->>'scale')::numeric<>2 OR (r->>'quantity')::numeric NOT BETWEEN 1 AND 10 OR (r->>'expiresAt')::numeric<=now_at THEN RAISE EXCEPTION 'invalid input'; END IF;
 IF jsonb_typeof(r->'subjectKey') IS DISTINCT FROM 'string' OR (r->>'subjectKey') !~ '^synthetic-[0-9]+$' OR r->>'subjectKey' ~ E'\\n' OR r->'currency' IS DISTINCT FROM '"EUR"'::jsonb THEN RAISE EXCEPTION 'invalid input'; END IF;
 IF jsonb_typeof(r->'unitMinor') IS DISTINCT FROM 'string' OR (r->>'unitMinor') !~ '^(0|-?[1-9][0-9]*)$' OR r->>'unitMinor' ~ E'\\n' THEN RAISE EXCEPTION 'invalid input'; END IF;
 u:=(r->>'unitMinor')::numeric;
 IF u NOT BETWEEN -9223372036854775808 AND 9223372036854775807 THEN RAISE EXCEPTION 'invalid input'; END IF;
 n:=u*(r->>'quantity')::numeric;
 IF n NOT BETWEEN -9223372036854775808 AND 9223372036854775807 THEN RAISE EXCEPTION 'net overflow'; END IF;
 f:=floor(n*0.5);
 IF f NOT BETWEEN -9223372036854775808 AND 9223372036854775807 THEN RAISE EXCEPTION 'fee overflow'; END IF;
 RETURN jsonb_build_object('id',(r->>'id')::bigint,'subjectKey',r->>'subjectKey','netMinor',n::bigint::text,'feeMinor',f::bigint::text,'expiresAt',(r->>'expiresAt')::bigint);
END $$;
CREATE FUNCTION sql_preview(r jsonb, now_at bigint) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE row_data jsonb;
BEGIN
 row_data:=calculate(r,now_at);
 INSERT INTO previews SELECT (row_data->>'id')::bigint,row_data->>'subjectKey',(row_data->>'netMinor')::bigint,(row_data->>'feeMinor')::bigint,(row_data->>'expiresAt')::bigint;
 RETURN row_data;
END $$;
