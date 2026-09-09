from urllib.request import Request,urlopen
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,datetime
E=Path(__file__).parent
O=E/'official-next-electron-docusaurus'; O.mkdir(exist_ok=True)
class Extract(HTMLParser):
 def __init__(self): super().__init__(); self.out=[];self.skip=0
 def handle_starttag(self,t,a):
  if t in ['script','style','nav','footer']: self.skip+=1
  if t in ['p','li','h1','h2','h3','h4','tr','pre','br']: self.out.append('\n')
 def handle_endtag(self,t):
  if t in ['script','style','nav','footer'] and self.skip: self.skip-=1
  if t in ['p','li','h1','h2','h3','h4','tr','pre']: self.out.append('\n')
 def handle_data(self,d):
  if not self.skip:self.out.append(d)
urls=[]
def add(prefix,paths):
 for p in paths.split(): urls.append(prefix+p)
add('https://nextjs.org/docs/', '''app/guides/upgrading/version-16 app/guides/upgrading/version-15 app/getting-started/installation app/getting-started/project-structure app/getting-started/layouts-and-pages app/getting-started/server-and-client-components app/getting-started/fetching-data app/getting-started/updating-data app/getting-started/caching-and-revalidating app/getting-started/error-handling app/getting-started/css app/getting-started/route-handlers app/guides/lazy-loading app/guides/package-bundling app/guides/mcp app/guides/ai-agents app/guides/server-actions app/guides/data-security app/guides/self-hosting app/guides/environment-variables app/guides/json-ld app/guides/scripts app/guides/third-party-libraries app/guides/static-exports app/guides/caching app/api-reference/directives/use-cache app/api-reference/file-conventions/proxy app/api-reference/file-conventions/parallel-routes app/api-reference/file-conventions/intercepting-routes app/api-reference/file-conventions/route app/api-reference/file-conventions/template app/api-reference/file-conventions/error app/api-reference/file-conventions/metadata/opengraph-image app/api-reference/file-conventions/metadata/sitemap app/api-reference/functions/redirect app/api-reference/functions/permanentRedirect app/api-reference/functions/not-found app/api-reference/functions/unauthorized app/api-reference/functions/forbidden app/api-reference/functions/unstable_rethrow app/api-reference/functions/use-pathname app/api-reference/functions/use-search-params app/api-reference/functions/use-router app/api-reference/functions/use-link-status app/api-reference/functions/use-params app/api-reference/functions/use-selected-layout-segment app/api-reference/functions/use-selected-layout-segments app/api-reference/functions/use-report-web-vitals app/api-reference/functions/cookies app/api-reference/functions/headers app/api-reference/functions/draft-mode app/api-reference/functions/after app/api-reference/functions/connection app/api-reference/functions/userAgent app/api-reference/functions/generate-static-params app/api-reference/functions/generate-metadata app/api-reference/functions/generate-viewport app/api-reference/functions/generate-sitemaps app/api-reference/functions/generate-image-metadata app/api-reference/functions/next-request app/api-reference/functions/next-response app/api-reference/functions/image-response app/api-reference/functions/revalidateTag app/api-reference/functions/revalidatePath app/api-reference/functions/updateTag app/api-reference/config/next-config-js/cacheHandler app/api-reference/config/next-config-js/cacheHandlers app/api-reference/config/next-config-js/cacheComponents app/api-reference/config/next-config-js/serverExternalPackages app/api-reference/config/next-config-js/transpilePackages app/api-reference/config/next-config-js/output app/api-reference/cli/next app/api-reference/components/image app/api-reference/components/font app/api-reference/components/script app/api-reference/edge architecture/supported-browsers''')
add('https://react.dev/reference/', 'rsc/use-client rsc/use-server react/cache react/use react/useId')
add('https://www.electronjs.org/docs/latest/', '''tutorial/process-model tutorial/security tutorial/sandbox tutorial/context-isolation tutorial/ipc tutorial/esm tutorial/using-native-node-modules tutorial/asar-archives tutorial/asar-integrity tutorial/fuses tutorial/code-signing tutorial/updates tutorial/electron-timelines tutorial/electron-versioning tutorial/electron-releases breaking-changes tutorial/performance tutorial/automated-testing tutorial/debugging-main-process tutorial/application-distribution api/app api/browser-window api/web-contents api/web-contents-view api/context-bridge api/ipc-main api/ipc-renderer api/protocol api/session api/safe-storage api/utility-process api/auto-updater api/menu api/tray api/global-shortcut api/dialog api/clipboard api/download-item api/notification api/desktop-capturer api/screen api/power-monitor api/power-save-blocker api/native-theme api/crash-reporter api/net-log api/content-tracing''')
add('https://electron-vite.org/', 'guide/ guide/cli guide/development guide/typescript guide/env-and-mode guide/dependency-handling guide/isolated-build guide/source-code-protection guide/distribution guide/migration guide/build guide/assets config/')
add('https://www.electronforge.io/', 'cli config/configuration config/plugins/vite build-lifecycle guides/code-signing/code-signing-macos guides/code-signing/code-signing-windows guides/framework-integration guides/auto-update makers')
add('https://docusaurus.io/', '''docs/installation docs/api/misc/cli docs/configuration docs/api/docusaurus-config docs/creating-pages docs/docs-introduction docs/docs-multi-instance docs/sidebar docs/sidebar/autogenerated docs/markdown-features docs/markdown-features/react docs/markdown-features/diagrams docs/markdown-features/code-blocks docs/markdown-features/tabs docs/markdown-features/admonitions docs/api/themes/configuration docs/swizzling docs/styling-layout docs/deployment docs/versioning docs/i18n/introduction docs/i18n/tutorial docs/search docs/api/themes/theme-search-algolia docs/api/plugins/plugin-content-docs docs/api/themes/theme-live-codeblock docs/api/themes/theme-mermaid blog/releases/3.9''')
add('https://raw.githubusercontent.com/', '''DavidAnson/markdownlint-cli2/main/README.md DavidAnson/markdownlint-cli2/main/package.json DavidAnson/markdownlint-cli2/main/schema/.markdownlint-cli2.jsonc github/docs/main/content/actions/reference/runners/github-hosted-runners.md actions/setup-node/main/README.md actions/checkout/main/README.md pnpm/action-setup/master/README.md cmfcmf/docusaurus-search-local/master/README.md cmfcmf/docusaurus-search-local/master/package.json PaloAltoNetworks/docusaurus-openapi-docs/main/README.md typesense/docusaurus-theme-search-typesense/main/README.md''')
add('https://', 'nodejs.org/en/about/previous-releases pnpm.io/cli/run pnpm.io/installation prettier.io/docs/cli prettier.io/docs/ignore prettier.io/docs/options open-next.js.org/ open-next.js.org/aws/get_started open-next.js.org/cloudflare/get-started pm2.keymetrics.io/docs/usage/application-declaration/ playwright.dev/docs/api/class-electron webdriver.io/docs/desktop-testing/electron/ developers.openai.com/api/docs/guides/latest-model')
# Include all authored external links, retaining explicit snapshot map.
for sk in ['nextjs','electron-engineer','docusaurus-repo']:
 for p in (E/'baseline-packages'/sk).rglob('*.md'):
  if 'docs' in p.relative_to(E/'baseline-packages'/sk).parts: continue
  for u in re.findall(r'https?://[^\s)<>"\]\x27]+',p.read_text()):
   if any(h in u for h in ['nextjs.org/docs','react.dev/','electronjs.org/docs','electron-vite.org','docusaurus.io/docs']): urls.append(u.split('#')[0])
urls=list(dict.fromkeys(urls))
def fetch(pair):
 i,u=pair; fn=f'{i:03d}-'+re.sub('[^a-zA-Z0-9.-]+','-',u.split('://')[1])[-150:]+'.txt'
 try:
  r=urlopen(Request(u,headers={'Accept':'text/markdown','User-Agent':'Mozilla/5.0'}),timeout=35); b=r.read(); raw=b.decode('utf-8','replace'); ct=r.headers.get('Content-Type',''); final=r.url
  if 'text/html' in ct:
   # Preserve complete article if available; main otherwise.
   m=re.search(r'<article\b[^>]*>(.*?)</article>',raw,re.S|re.I) or re.search(r'<main\b[^>]*>(.*?)</main>',raw,re.S|re.I)
   x=Extract();x.feed(m.group(1) if m else raw);s=''.join(x.out);s=re.sub(r'\n[ \t]*\n+', '\n\n',s)
  else: s=raw
  (O/fn).write_text(s)
  return {'url':u,'final_url':final,'file':str((O/fn).relative_to(E)),'bytes':len(b),'content_sha256':hashlib.sha256(b).hexdigest(),'text_sha256':hashlib.sha256(s.encode()).hexdigest(),'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'downloaded'}
 except Exception as ex:return {'url':u,'status':'unavailable','error':str(ex)}
with ThreadPoolExecutor(max_workers=4) as pool: rows=list(pool.map(fetch,enumerate(urls)))
(E/'official-next-electron-docusaurus-sources.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'total':len(rows),'downloaded':sum(r['status']=='downloaded' for r in rows),'failures':[r for r in rows if r['status']!='downloaded']},indent=2))
