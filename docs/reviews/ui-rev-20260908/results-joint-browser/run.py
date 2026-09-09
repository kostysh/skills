import subprocess,sys,json,time
args=sys.argv[1:]
cmd=['agent-browser','--session','ui-rev-joint-evidence']+args
p=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
with open('/tmp/ui-rev-20260908/results-joint-browser/raw.jsonl','a') as f:f.write(json.dumps({'time':time.time(),'command':cmd,'exit':p.returncode,'output':p.stdout})+'\n')
print(p.stdout)
sys.exit(p.returncode)
