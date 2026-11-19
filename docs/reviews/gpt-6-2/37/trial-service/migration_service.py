from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
from pathlib import Path
import json,secrets,subprocess,tempfile,threading
root=Path(__file__).resolve().parent;tool=root/'toolchains/cms-sqlite-3.94.0';folder=tool/'migration';node=root/'toolchains/node-24.22.3/node';editions={'copper':'Copper','silver':'Silver','amber':'Amber'};gate=threading.Semaphore(2)
def operate(path,edition,action):
 with gate:c=subprocess.run([str(node),str(folder/'worker.mjs'),str(path),edition,action],cwd=folder,capture_output=True,text=True,timeout=35)
 msg=next((line[13:] for line in c.stdout.splitlines() if line.startswith('PAYLOAD_DESK ')),None)
 if c.returncode or msg is None:raise RuntimeError('Local rehearsal unavailable')
 return json.loads(msg)
class Service(BaseHTTPRequestHandler):
 def answer(self,data,status):
  b=(json.dumps(data,ensure_ascii=False)+'\n').encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
 def handle_action(self,method):
  url=urlsplit(self.path);k=url.path.strip('/').split('/');key=None
  if url.query or len(k) not in (2,3) or k[0] not in editions:self.send_error(404);return
  ed=editions[k[0]]
  if len(k)==2 and method=='POST' and k[1]=='sessions':
   key=secrets.token_hex(16);p=self.server.stage/key;p.mkdir();l=threading.Lock()
   with self.server.guard:self.server.sessions[(ed,key)]=(p,l)
   act='prepare'
  elif len(k)==3 and (method,k[2]) in [('POST','interrupt'),('POST','resume'),('GET','inspect'),('GET','read')]:
   key=k[1];act=k[2]
   with self.server.guard:res=self.server.sessions.get((ed,key))
   if res is None:self.send_error(404);return
   p,l=res
  else:self.send_error(404);return
  try:
   with l:data=operate(p,ed,act)
  except (RuntimeError,subprocess.SubprocessError):self.send_error(503);return
  self.answer({'session':key} if act=='prepare' else data,201 if act=='prepare' else 200)
 def do_GET(self):self.handle_action('GET')
 def do_POST(self):self.handle_action('POST')
 def log_message(self,*v):pass
if __name__=='__main__':
 with tempfile.TemporaryDirectory(prefix='skills62-payload-workspaces-') as temp:
  server=ThreadingHTTPServer(('127.0.0.1',0),Service);server.stage=Path(temp);server.sessions={};server.guard=threading.Lock()
  (folder/'interface.json').write_text(json.dumps({'port':server.server_port,'workspaceDirectory':temp},indent=2)+'\n');print(server.server_port,flush=True);server.serve_forever()
