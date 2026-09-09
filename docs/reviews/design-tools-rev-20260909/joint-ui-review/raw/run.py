import subprocess,sys,json,datetime,pathlib
p=pathlib.Path(__file__).parent
cmd=['agent-browser','--session','dtr-joint-review']+sys.argv[1:]
r=subprocess.run(cmd,text=True,capture_output=True)
with (p/'browser-transcript.jsonl').open('a') as f:f.write(json.dumps({'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':cmd,'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr})+'\n')
print(r.stdout,end=''); print(r.stderr,end='',file=sys.stderr);sys.exit(r.returncode)
