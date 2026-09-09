import subprocess,json,sys,time
from pathlib import Path
D=Path('/tmp/ui-rev-20260908/results-joint-fix')
def ab(*args):
 r=subprocess.run(['agent-browser','--session','ui-rev-joint-fix',*args],capture_output=True,text=True)
 with (D/'raw.jsonl').open('a') as f:f.write(json.dumps({'time':time.time(),'args':args,'returncode':r.returncode,'stdout':r.stdout,'stderr':r.stderr})+'\n')
 print(r.stdout,r.stderr,flush=True)
 if r.returncode: raise RuntimeError(args)
 return r.stdout
if __name__=='__main__':ab(*sys.argv[1:])
