"""Find unresolved opinions; conditionally request wording from a holdout-blind editor."""
import argparse
import json
from pathlib import Path
import shutil
import tempfile
from grade import packet_map
from judge_session import execute
from register import now
from run_case import log
from study import DROP,MODEL,ROOT,json_write,sha

def read(p):return json.loads(p.read_text())
def resolved(stage):
    register=read(ROOT/'registration.json')
    keys=read(ROOT/'score-key.json')
    by_role={}
    for role in ['first','second','third']:
        p=ROOT/'assessments'/stage/role/'signed.json'
        if p.is_file():by_role[role]=read(p)['answers']['scores']
    if 'first' not in by_role:return {},[]
    complete={};open_items=[]
    for i,a in register['assignments'].items():
        if a['phase']!=stage or keys[i] not in by_role['first']:continue
        alias=keys[i]; score=by_role['first'][alias].copy()
        if alias in by_role.get('second',{}):
            for axis in ('P','K','I'):
                if score[axis]!=by_role['second'][alias][axis]:
                    if alias in by_role.get('third',{}):score[axis]=by_role['third'][alias][axis]
                    elif i not in open_items:open_items.append(i)
        complete[i]=score
    return complete,open_items

def main():
    ap=argparse.ArgumentParser();ap.add_argument('stage',choices=['primary','conditional']);ap.add_argument('--choose',action='store_true');a=ap.parse_args()
    scores,pending=resolved(a.stage)
    print('Needs third:',*pending,flush=True)
    if not a.choose or pending:return
    register=read(ROOT/'registration.json');initial=[(i,x) for i,x in register['assignments'].items() if x['phase']=='primary' and x['variant']=='B']
    signatures=[]
    for (i,x) in initial:
        r=ROOT/'runs'/i
        if i not in scores or scores[i]['I']!='PASS' or not (r/'exposure.json').is_file(): print('Conditional branch closed.');return
        exposure=read(r/'exposure.json')
        if not exposure['rootReadLines'] or not exposure['strategyReadLines'] or exposure['delegationEvents']:print('Conditional branch closed.');return
        signatures.append({'task':x['task'],'score':scores[i]})
    if (ROOT/'candidate.json').exists():raise SystemExit('C already fixed.')
    work=Path(tempfile.mkdtemp(prefix='instruction-edit-'));rec=ROOT/'selector';rec.mkdir(exist_ok=False)
    json_write(work/'observations.json',signatures)
    wording=[old for edits in DROP.values() for old,new in edits]
    (work/'original.txt').write_text('\n'.join(wording)+'\n')
    task='As an independent editor, read original.txt and the first two signed primary observations. Give the shortest positive instruction, in English, that still binds the executor to check keyboard navigation and visible focus in the relevant rendered states. Retain existing unrelated requirements. You have no access to new project inputs. Return only JSON {"wording":"...","reason":"..."}; do not edit files.'
    status=execute(work,MODEL,'high',task,rec,timeout=240)
    if status: raise SystemExit(status)
    body=(rec/'answer.md').read_text().strip()
    if body.startswith('```'):body=body.split('\n',1)[1].rsplit('```',1)[0]
    candidate=json.loads(body);assert isinstance(candidate['wording'],str) and candidate['wording'].strip()
    candidate.update({'selectedUtc':now(),'selectorSource':sha((rec/'events.jsonl').read_bytes()),'primaryInputs':signatures,'holdoutShown':False})
    json_write(ROOT/'candidate.json',candidate)
    from study import package
    candidate['files']={k:sha(v) for k,v in package('C').items()};json_write(ROOT/'candidate.json',candidate)
    log('candidate-frozen',digest=sha((ROOT/'candidate.json').read_bytes()));print(candidate['wording'])
if __name__=='__main__':main()
