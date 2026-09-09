import urllib.request,json,pathlib,hashlib,concurrent.futures,datetime
E=pathlib.Path(__file__).parent
D=E/'official-hono-supabase';D.mkdir(exist_ok=True)
items=[]
def add(id,url):items.append((id,url))
for repo,id in [('honojs/hono','hono-release'),('honojs/node-server','hono-node-release'),('supabase/supabase-js','supabase-js-release'),('supabase/ssr','ssr-release'),('supabase/cli','cli-release')]:add(id,'https://api.github.com/repos/'+repo+'/releases/latest')
for p in ['guides/rpc','guides/validation','guides/middleware','guides/testing','guides/best-practices','api/hono','api/context','api/routing','api/exception','helpers/factory','helpers/streaming','helpers/testing','concepts/routers','getting-started/nodejs','getting-started/bun','getting-started/deno','getting-started/fastly','getting-started/cloudflare-workers','getting-started/supabase-functions','middleware/builtin/bearer-auth','middleware/builtin/jwt','middleware/builtin/jwk','middleware/builtin/csrf','middleware/builtin/combine','middleware/builtin/timeout','middleware/builtin/body-limit','middleware/builtin/compress','middleware/builtin/cors','middleware/builtin/secure-headers','middleware/builtin/cache','middleware/builtin/etag','middleware/builtin/logger']:
 add('hono-'+p.replace('/','-'),'https://raw.githubusercontent.com/honojs/website/main/docs/'+p+'.md')
add('hono-migration','https://raw.githubusercontent.com/honojs/hono/v4.13.7/docs/MIGRATION.md')
for p in ['platform','api','auth','database','storage','realtime','functions'] :pass
for p in ['api/api-keys','database/postgres/row-level-security','database/postgres/roles','database/postgres/database-functions','database/postgres/triggers','database/hardening-data-api','auth/server-side/creating-a-client','auth/server-side/advanced-guide','auth/server-side/migrating-to-ssr-from-auth-helpers','auth/jwts','auth/sessions','auth/managing-user-data','auth/auth-hooks','auth/auth-hooks/send-email-hook','database/webhooks','database/extensions/pg_net','database/vault','local-development/overview','local-development/declarative-database-schemas','local-development/local-development-with-cli','functions/auth','functions/dependencies','functions/background-tasks','functions/ephemeral-storage','functions/limits','realtime/subscribing-to-database-changes','realtime/authorization','realtime/postgres-changes','realtime/presence','storage/security/access-control','storage/serving/downloads','storage/uploads/standard-uploads','ai/vector-columns','ai/vector-indexes','ai/semantic-search','database/connecting-to-postgres','getting-started/mcp']:
 add('supabase-'+p.replace('/','-'),'https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/'+p+'.mdx')
for p in ['runtime-apis/context','runtime-apis/cache','runtime-apis/nodejs','platform/limits','wrangler/configuration','wrangler/environments','languages/typescript','testing/vitest-integration/migration-guides/migrate-from-unstable-dev','runtime-apis/bindings/rate-limit']:
 add('cf-'+p.replace('/','-'),'https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/workers/'+p+'.mdx')
for id,url in [('pgvector','https://raw.githubusercontent.com/pgvector/pgvector/master/README.md'),('hono-bearer-source','https://raw.githubusercontent.com/honojs/hono/v4.13.7/src/middleware/bearer-auth/index.ts'),('ssr-changelog','https://raw.githubusercontent.com/supabase/ssr/v0.12.7/CHANGELOG.md'),('ssr-cookies','https://raw.githubusercontent.com/supabase/ssr/v0.12.7/src/cookies.ts'),('ssr-types','https://raw.githubusercontent.com/supabase/ssr/v0.12.7/src/types.ts')]:add(id,url)
def fetch(item):
 id,url=item
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'technical-source-audit'})
  with urllib.request.urlopen(req,timeout=25) as r:b=r.read();final=r.url
  name=id+'.txt';(D/name).write_bytes(b)
  return {'id':id,'url':url,'finalURL':final,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'file':name}
 except Exception as e:return {'id':id,'url':url,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:out=list(ex.map(fetch,items))
(D/'manifest.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(json.dumps({'ok':sum('error' not in x for x in out),'errors':[x for x in out if 'error'in x]},indent=2))
