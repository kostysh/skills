from pathlib import Path
import json,urllib.request,re,hashlib,datetime
from concurrent.futures import ThreadPoolExecutor
E=Path(__file__).parent;ns={'__file__':str(E/'collect-official-next-electron-docs.py')};src=(E/'collect-official-next-electron-docs.py').read_text();exec(src[:src.index('urls=[]')],ns)
urls='''https://docusaurus.io/docs/cli
https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs
https://docusaurus.io/docs/api/themes/@docusaurus/theme-search-algolia
https://docusaurus.io/docs/api/themes/@docusaurus/theme-live-codeblock
https://docusaurus.io/docs/api/themes/@docusaurus/theme-mermaid
https://docusaurus.io/blog/releases/3.10
https://docusaurus.io/docs/3.9.2/installation
https://raw.githubusercontent.com/facebook/docusaurus/v3.10.2/packages/docusaurus/src/commands/cli.ts
https://raw.githubusercontent.com/facebook/docusaurus/v3.10.2/packages/docusaurus/src/commands/serve.ts
https://raw.githubusercontent.com/facebook/docusaurus/v3.10.2/CHANGELOG.md
https://raw.githubusercontent.com/DavidAnson/markdownlint-cli2/v0.23.2/package.json
https://raw.githubusercontent.com/DavidAnson/markdownlint-cli2/main/markdownlint-cli2-config-schema.json
https://raw.githubusercontent.com/DavidAnson/vscode-markdownlint/main/markdownlint-cli2-config-schema.json
https://raw.githubusercontent.com/cmfcmf/docusaurus-search-local/master/packages/docusaurus-search-local/package.json
https://raw.githubusercontent.com/typesense/docusaurus-theme-search-typesense/master/README.md
https://www.electronforge.io/core-concepts/build-lifecycle
https://www.electronforge.io/config/makers
https://www.electronforge.io/advanced/auto-update
https://www.electronforge.io/config/plugins/auto-unpack-natives
https://releases.electronjs.org/releases/stable
https://www.electronjs.org/docs/latest/tutorial/electron-timelines
https://raw.githubusercontent.com/electron/electron/main/releases/lite.json
https://electron-vite.org/guide/dev
https://raw.githubusercontent.com/alex8088/electron-vite/v5.0.0/package.json
https://raw.githubusercontent.com/electron/forge/main/packages/api/core/package.json
https://raw.githubusercontent.com/actions/checkout/v4/README.md
https://raw.githubusercontent.com/actions/setup-node/v4/README.md
https://raw.githubusercontent.com/pnpm/action-setup/v4/README.md
https://opennext.js.org/
https://opennext.js.org/aws
https://opennext.js.org/cloudflare
https://opennext.js.org/aws/get_started
https://tailwindcss.com/docs/font-family
https://nextjs.org/docs/app/guides/tailwind-v3
https://raw.githubusercontent.com/vercel/next.js/v16.3.4/packages/next/src/build/analysis/get-page-static-info.ts
https://raw.githubusercontent.com/vercel/next.js/v16.3.4/packages/next/src/cli/next-build.ts
https://raw.githubusercontent.com/vercel/next.js/v16.3.4/packages/next/src/build/webpack-config-rules/resolve.ts
https://nextjs.org/docs/app/api-reference/functions/forbidden
https://nextjs.org/docs/app/api-reference/config/next-config-js/authInterrupts
https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
https://nextjs.org/docs/messages/no-async-client-component
https://nextjs.org/docs/messages/react-hydration-error
https://nextjs.org/blog/next-16-3
https://nextjs.org/blog/next-16-1
https://nextjs.org/support-policy
https://registry.npmjs.org/next/latest
https://registry.npmjs.org/electron/latest
https://registry.npmjs.org/electron-vite/latest
https://registry.npmjs.org/@electron-forge%2fcli/latest
https://registry.npmjs.org/@docusaurus%2fcore/latest
https://registry.npmjs.org/markdownlint-cli2/latest
https://registry.npmjs.org/@cmfcmf%2fdocusaurus-search-local/latest
https://registry.npmjs.org/docusaurus-plugin-openapi-docs/latest
https://registry.npmjs.org/docusaurus-theme-search-typesense/latest
https://registry.npmjs.org/pnpm/latest
https://registry.npmjs.org/prettier/latest
https://raw.githubusercontent.com/nodejs/Release/main/schedule.json
https://developers.openai.com/api/docs/guides/latest-model/gpt-6-astra.md'''.split()
a=json.loads((E/'official-next-electron-docusaurus-sources.json').read_text()); urls=[u for u in urls if not any(x['url']==u and x['status']=='downloaded' for x in a)]
def f(pair):
 i,u=pair;fn=f'{i:03d}-'+re.sub('[^a-zA-Z0-9.-]+','-',u.split('://')[1])[-150:]+'.txt'
 try:
  r=urllib.request.urlopen(urllib.request.Request(u,headers={'Accept':'text/markdown','User-Agent':'Mozilla/5.0'}),timeout=30);b=r.read();raw=b.decode('utf-8','replace');s=raw
  if 'text/html' in r.headers.get('Content-Type',''):
   m=re.search(r'<main\b[^>]*>(.*?)</main>',raw,re.S|re.I) or re.search(r'<article\b[^>]*>(.*?)</article>',raw,re.S|re.I);x=ns['Extract']();x.feed(m.group(1) if m else raw);s=''.join(x.out)
  p=E/'official-next-electron-docusaurus'/fn;p.write_text(s)
  return {'url':u,'final_url':r.url,'file':str(p.relative_to(E)),'bytes':len(b),'content_sha256':hashlib.sha256(b).hexdigest(),'text_sha256':hashlib.sha256(s.encode()).hexdigest(),'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'downloaded'}
 except Exception as ex:return {'url':u,'status':'unavailable','error':str(ex)}
with ThreadPoolExecutor(max_workers=4) as pool:b=list(pool.map(f,enumerate(urls,300)))
a+=b;(E/'official-next-electron-docusaurus-sources.json').write_text(json.dumps(a,indent=2)+'\n');print(json.dumps([x for x in b if x['status']!='downloaded'],indent=2))
