CREATE SCHEMA domain_rev_candidate;
CREATE TABLE domain_rev_candidate.preview(id bigint primary key,"subjectKey" text not null,"netMinor" text not null,"feeMinor" text not null,"expiresAt" bigint not null);
CREATE TABLE domain_rev_candidate.export(id bigint primary key,"subjectKey" text not null,"feeMinor" text not null);
CREATE FUNCTION domain_rev_candidate.calc(u text,q integer) RETURNS TABLE(n numeric,f numeric) LANGUAGE plpgsql AS $$
BEGIN
 IF u !~ '^(0|-?[1-9][0-9]*)$' OR u::numeric < -9223372036854775808 OR u::numeric > 9223372036854775807 OR q<1 OR q>10 THEN RAISE EXCEPTION 'invalid calculation input'; END IF;
 n:=u::numeric*q;
 IF n < -9223372036854775808 OR n > 9223372036854775807 THEN RAISE EXCEPTION 'net range'; END IF;
 f:=floor(n*0.5);
 IF f < -9223372036854775808 OR f > 9223372036854775807 THEN RAISE EXCEPTION 'fee range'; END IF;
 RETURN NEXT;
END $$;
