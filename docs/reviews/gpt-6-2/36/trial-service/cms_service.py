from pathlib import Path
import hashlib,json,subprocess,threading
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
root=Path(__file__).resolve().parent;tool=root/'toolchains/cms-sqlite-3.94.0';node=root/'toolchains/node-24.22.3/node';cases={'elm':'Elm','birch':'Birch','ash':'Ash'}
gate=threading.Semaphore(2)
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  p=urlsplit(self.path)
  key=p.path.strip('/').split('/')
  if len(key)!=2 or key[0] not in cases or key[1]!='desk' or p.query: self.send_error(404);return
  with gate:
   r=subprocess.run([str(node),str(tool/'reader.mjs'),cases[key[0]]],cwd=tool,capture_output=True,text=True,timeout=29)
  body=next((line[10:] for line in r.stdout.splitlines() if line.startswith('DESK_READ ')),None)
  if r.returncode or body is None:self.send_error(503,'Desk unavailable');return
  data=(body+'\n').encode();self.send_response(200);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def log_message(self,fmt,*values):pass
if __name__=='__main__':
 s=ThreadingHTTPServer(('127.0.0.1',0),Handler);(tool/'service.json').write_text(json.dumps({'port':s.server_port,'driverSha':hashlib.sha256((tool/'reader.mjs').read_bytes()).hexdigest()},indent=2)+'\n');print(s.server_port,flush=True);s.serve_forever()
