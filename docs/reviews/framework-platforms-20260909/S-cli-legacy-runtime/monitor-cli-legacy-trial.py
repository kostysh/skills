import subprocess,json,time,datetime
from pathlib import Path
end=time.monotonic()+180
out=Path('/tmp/framework-platforms-20260909/cli-legacy-trial-resource-observations.jsonl')
bindings=json.loads(Path('/tmp/framework-platforms-20260909/infrastructure/docker-proxy/private/legacy/image-bindings.json').read_text())
allowed={x['id'] for x in bindings['images']};migra=bindings['images'][1]['id']
previous=None;peak=0
while time.monotonic()<end:
 ids=subprocess.check_output(['docker','ps','-aq','--filter','label=local.study.run=fp-cli-legacy-20260909'],text=True).split()
 if not ids:time.sleep(.5);continue
 p=subprocess.run(['docker','inspect',*ids],capture_output=True,text=True)
 if p.returncode:time.sleep(.5);continue
 rows=[]
 for c in json.loads(p.stdout):
  h=c['HostConfig'];limits={k:h[k] for k in ['NanoCpus','Memory','MemorySwap','CpusetCpus']}
  assert 0<h['NanoCpus']<=750000000 and 0<h['Memory']<=3221225472 and 0<h['MemorySwap']<=3221225472 and h['CpusetCpus']=='28-31'
  assert c['Image'] in allowed
  if h['NetworkMode']=='host':assert c['Image']==migra
  rows.append({'id':c['Id'],'name':c['Name'],'running':c['State']['Running'],'imageId':c['Image'],'networkMode':h['NetworkMode'],'limits':limits})
 assert len(rows)<=3;peak=max(peak,len(rows));rows.sort(key=lambda x:x['id'])
 if rows!=previous:
  with out.open('a') as f:f.write(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'containers':rows})+'\n')
  previous=rows
 time.sleep(.5)
print(json.dumps({'peakObserved':peak,'durationSeconds':180,'allObservedChildBoundsVerified':True}))
