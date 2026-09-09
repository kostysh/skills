CREATE TABLE "public"."posts" (
  "id"    bigint NOT NULL,
  "title" text   NOT NULL,
  CONSTRAINT "posts_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "anon", "authenticated", "postgres", "service_role";
