"""Verify the executor's own evidence and separately exercise the returned screen in a fresh browser."""
import hashlib,json,sys,shutil,tempfile,subprocess
from pathlib import Path
from reference import run as reference_run

def sha(data):return hashlib.sha256(data).hexdigest()

def snapshot(state):
    return {
        'heading':state['heading'],'width':state['width'],
        'email':next((x['value'] for x in state['fields'] if x['id']=='email'),None),
        'email_invalid':next((x['invalid'] for x in state['fields'] if x['id']=='email'),None),
        'frequency':next((x['id'] for x in state['fields'] if x['role']=='radio' and x['checked']=='true'),None),
        'notifications':next((x['checked'] for x in state['fields'] if x['role']=='switch'),None),
        'dialog':state['dialog'],'status':state['status'],'focus':state['focus']
    }
def observe(directory,fixtures):
    result=json.loads((directory/'result.json').read_bytes()); dispatch=json.loads((directory/'dispatch.json').read_bytes())
    project=Path(dispatch['project'])
    assert result['exit']==0 and (directory/'answer.md').read_text().strip()
    events=(directory/'events.jsonl').read_bytes().splitlines()
    actions=[]
    for ln in events:
        e=json.loads(ln);item=e.get('item',{})
        if e.get('type')=='item.completed' and item.get('type')=='command_execution':
            actions.append((item,sha(ln)))
    hashes={f.relative_to(project).as_posix():sha(f.read_bytes()) for f in project.rglob('*') if f.is_file() and '.git' not in f.parts}
    protected={n for n in dispatch['input_files'] if n not in hashes or dispatch['input_files'][n]!=hashes[n] or dispatch.get('input_modes',{}).get(n)!=result.get('output_modes',{}).get(n)}
    build={n:h for n,h in hashes.items() if n.startswith('dist/')}
    match=[f for f in fixtures.iterdir() if {n.relative_to(f).as_posix():sha(n.read_bytes()) for n in (f/'dist').rglob('*') if n.is_file()}==build]
    assert len(match)==1
    kind=match[0].name
    trials=[]
    for p in sorted((project/'visits').glob('*.json')):
        tr=json.loads(p.read_bytes()); screen=p.with_suffix('.png'); screen_hash=sha(screen.read_bytes())
        assert screen_hash==tr['screenSha256'] and sha((directory/'files/visits'/p.name).read_bytes())==hashes['visits/'+p.name]
        assert tr['actions']==[x['action'] for x in tr['timeline'][1:]]
        found=[e for q,e in actions if p.name in q.get('aggregated_output','')]
        trials.append({'file':'visits/'+p.name,'trace_sha256':sha(p.read_bytes()),'chrome_screen_sha256':screen_hash,'observed_raw_event_sha256':found,'driver_error':tr['error'],'timeline':[{'action':a['action'],'screen':snapshot(a['state'])} for a in tr['timeline']]})
    assert trials
    with tempfile.TemporaryDirectory(prefix='screen-readback-') as tmp:
        output=Path(tmp)/'readback'
        reference_run(project,kind,output)
        baseline=json.loads((output/'trace.json').read_bytes())
        ref={'source':'A separate Chrome profile, normal form controls, unchanged copied work product. This reference is not evidence that an executor took the same actions.',
             'timeline':[{'action':a['action'],'screen':snapshot(a['state'])} for a in baseline['timeline']]}
    obs={'executor_evidence':trials,'independent_screen_readback':ref,'protected_input_changes':sorted(protected),'other_output_files':[p for p in result['changed'] if not p.startswith('visits/')],'raw_events_sha256':sha((directory/'events.jsonl').read_bytes())}
    (directory/'observer.json').write_text(json.dumps(obs,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':observe(Path(sys.argv[1]),Path(sys.argv[2]))
