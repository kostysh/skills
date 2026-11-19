"""Link actual package reads and trial actions to the immutable raw execution log."""
import json
from pathlib import Path
import re
from study import ROOT,sha,json_write

def inspect(ident):
    rec=ROOT/'runs'/ident
    source=rec/'events.jsonl'
    items=[json.loads(line) for line in source.read_text().splitlines() if line.strip()]
    thread=next((e['thread_id'] for e in items if e['type']=='thread.started'),None)
    reads={key:[] for key in ('root','strategy')}; commands=[];external=[]
    for n,e in enumerate(items,1):
        it=e.get('item',{})
        if e['type']!='item.completed':continue
        if 'collab' in it.get('type','') or 'agent_tool_call' in it.get('type',''):
            external.append({'line':n,'type':it.get('type')})
        if it.get('type')!='command_execution':continue
        cmd=it.get('command','');out=it.get('aggregated_output','')
        commands.append({'line':n,'command':cmd,'exit':it.get('exit_code')})
        for key,anchor in [('root','## When to use this skill'),('strategy','## Establish Readiness And Authority')]:
            if anchor in out:reads[key].append(n)
        if '## Final Review Loop' in out and n not in reads['root']:reads['root'].append(n)
        if '## Choose The Deliverable' in out and n not in reads['strategy']:reads['strategy'].append(n)
    revision=json.loads((rec/'observed/observer.json').read_text())['revision']
    browser=[json.loads(x) for x in (rec/'browser.jsonl').read_text().splitlines() if x.strip()]
    x={'thread':thread,'sha256':sha(source.read_bytes()),'rootReadLines':reads['root'],'strategyReadLines':reads['strategy'],'delegationEvents':external,'nativeCommandLines':commands,'subjectBrowserOps':len(browser),'currentRevisionOps':sum(r.get('loaded')==revision and r.get('disk')==revision for r in browser),'browserLogSha256':sha((rec/'browser.jsonl').read_bytes())}
    json_write(rec/'exposure.json',x);return x

if __name__=='__main__':
    for rec in sorted((ROOT/'runs').iterdir()):
        if (rec/'result.json').exists():
            out=inspect(rec.name);print(rec.name,out['thread'],out['rootReadLines'],out['strategyReadLines'],out['subjectBrowserOps'])
