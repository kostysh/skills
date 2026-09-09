import subprocess, json, time, pathlib, hashlib
out=pathlib.Path('/tmp/design-tools-rev-20260909/keyboard-diagnostic')
app=pathlib.Path('/tmp/design-tools-rev-20260909/live-c1')
manifest={str(p.relative_to(app)):hashlib.sha256(p.read_bytes()).hexdigest() for root in ['src','evidence'] for p in (app/root).rglob('*') if p.is_file()}
(out/'original-hashes.json').write_text(json.dumps(manifest,indent=2))
base=['agent-browser','--session','dtr-keydiag']
log=[]
def run(*args):
 cmd=base+list(args); started=time.monotonic()
 r=subprocess.run(cmd,text=True,capture_output=True,timeout=30)
 log.append({'args':cmd,'returncode':r.returncode,'stdout':r.stdout,'stderr':r.stderr,'elapsed':time.monotonic()-started})
 (out/'commands.json').write_text(json.dumps(log,indent=2))
 if r.returncode: raise RuntimeError(str(args)+r.stderr)
 return r.stdout.strip()
def observe(label):
 raw=run('eval','JSON.stringify({focus:document.activeElement.id,radios:[...document.querySelectorAll("[role=radio]")].map(e=>({id:e.id,checked:e.getAttribute("aria-checked")})),events:window.__keydiag})')
 value=json.loads(raw)
 if isinstance(value,str): value=json.loads(value)
 (out/(label+'.json')).write_text(json.dumps(value,indent=2));return value
run('--executable-path','/usr/bin/google-chrome','open','--init-script',str(out/'trace-init.js'),'http://127.0.0.1:43863')
for arm in ['fast','held']:
 if arm=='held': run('reload')
 run('snapshot','-i')
 run('fill','#email','reviewer@example.com')
 run('press','Tab')
 run('press','Space')
 run('press','Tab')
 run('press','Enter')
 run('wait','--fn','document.activeElement.textContent === "Cancel"')
 run('press','Shift+Tab');run('press','Tab');run('press','Escape')
 run('wait','--fn','!document.querySelector("[role=dialog]")')
 run('press','Shift+Tab');run('press','Space');run('press','Tab')
 before=observe(arm+'-before-arrow')
 if before['focus']!='daily': raise RuntimeError('Original arrow path did not focus daily: '+str(before['focus']))
 if arm=='fast': run('press','ArrowRight')
 else:
  run('keydown','ArrowRight')
  time.sleep(0.1)
  run('keyup','ArrowRight')
 # Read after the task queue has processed focus; no repeated key attempts.
 run('wait','--fn','document.activeElement.id === "weekly"')
 observe(arm+'-after-arrow')
 run('snapshot','-i')
for p,digest in manifest.items():
 if hashlib.sha256((app/p).read_bytes()).hexdigest()!=digest: raise RuntimeError('Original file changed: '+p)
(out/'preservation.txt').write_text('All source and original C1 evidence files retain their pre-diagnostic SHA256 hashes.\n')
print('Completed two bounded arms; source and original evidence unchanged.')
