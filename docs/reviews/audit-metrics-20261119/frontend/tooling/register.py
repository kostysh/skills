"""Write initial assignments and immutable inputs. Invoke once before any executor."""
import datetime
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import tempfile
from study import EXACT, MODEL, SECONDARY, ROOT, REPO, fixture, hash_tree, package, physical, sha, visible, json_write

def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def env_browser():
    env=os.environ.copy()
    if 'PLAYWRIGHT_CORE' not in env:
        for candidate in sorted((Path.home()/'.npm/_npx').glob('*/node_modules/playwright-core/package.json')):
            if json.loads(candidate.read_text())['version']=='1.59.1':
                env['PLAYWRIGHT_CORE']=str(candidate.parent);break
    return env

def observe(project,destination,task):
    destination.mkdir(parents=True,exist_ok=True)
    subprocess.run(['node',str(ROOT/'tooling/browser.cjs'),str(project),str(destination),task,'observe'],env=env_browser(),check=True,timeout=45,capture_output=True)

def main():
    target=ROOT/'registration.json'
    if target.exists(): raise SystemExit('Снимок уже записан.')
    base=Path(tempfile.mkdtemp(prefix='window-calibrate-'))
    (base/'other-work').mkdir();(base/'other-work'/'x').write_text('canary')
    dry={}
    cases={}
    for task in ['ordinary','discriminating','holdout']:
        cases[task]={}
        for variant in ['full','none','B']:
            project=base/(task+'-'+variant)
            fixture(task,variant,project)
            cases[task][variant]=hash_tree(project)
        # Only fixture calibration by the case author. No subject sees the held-out form or these outputs.
        observe(base/(task+'-none'),ROOT/'calibration'/task,task)
    for sample in ['none','full','B']:
        project=base/('ordinary-'+sample)
        dry[sample]={}
        for m in [MODEL,SECONDARY]:
            prompt=(ROOT/'inputs/ordinary.txt').read_text()
            p=visible(project,m,'medium',prompt)
            dry[sample][m]=p
        dry[sample]['fs']=physical(project)
    def slot():return secrets.token_hex(5)
    assignments={}
    def reserve(task,variant,kind,model=MODEL):
        code=slot()
        assignments[code]={'task':task,'variant':variant,'phase':kind,'model':model,'effort':'medium'}
        return code
    pairs=[]
    initial={}
    double=[]
    for t in ['ordinary','discriminating']:
        present=reserve(t,'full','primary');absent=reserve(t,'none','primary')
        a=reserve(t,'A','primary');b=reserve(t,'B','primary')
        initial[t]=(a,b)
        pairs.extend([{'id':slot(),'type':'package/none','task':t,'model':MODEL,'phase':'primary','left':present,'right':absent},
                     {'id':slot(),'type':'A/B','task':t,'model':MODEL,'phase':'primary','left':a,'right':b}])
        double.extend([present,b] if t=='ordinary' else [absent,a])
    # Fixed conditional assignments, activated only after the first signed grading and consistent B.
    for m in [MODEL,SECONDARY]:
        for t in ['ordinary','discriminating','holdout']:
            phase='holdout' if t=='holdout' else 'primary'
            c=reserve(t,'C','conditional',m)
            if m==MODEL and t in initial:
                a=reserve(t,'A','conditional',m);b=initial[t][1]
                pairs.append({'id':slot(),'type':'C/A','task':t,'model':m,'phase':'primary','left':c,'right':a,'conditional':True})
            else: b=reserve(t,'B','conditional',m)
            pairs.append({'id':slot(),'type':'C/B','task':t,'model':m,'phase':phase,'left':c,'right':b,'conditional':True})
            if t=='holdout': double.append(c)
    readiness={s:{'noHome':not any(v for k,v in q['fs'].items() if k not in ('projectReadme','projectPackage')),'rootReadable':q['fs']['projectReadme'],'packageMatches':q['fs']['projectPackage']==(s!='none')} for s,q in dry.items()}
    assert all(all(values.values()) for values in readiness.values()),readiness
    for typ,p in dry.items():
        for m in [MODEL,SECONDARY]:
            names=p[m]['skillRecords']
            assert names==([] if typ=='none' else ['frontend-design']),(typ,m,names)
    result={'registeredUtc':now(),'snapshot':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip(),'packageSha256':EXACT,'packageFiles':{v:{k:sha(b) for k,b in package(v).items()} for v in ['full','A','B','none']},'tasks':cases,'inputs':{p.name:sha(p.read_bytes()) for p in (ROOT/'inputs').glob('*.txt')},'rubric':sha((ROOT/'rubric.md').read_bytes()),'protocol':sha((ROOT/'protocol.md').read_bytes()),'tooling':{p.name:sha(p.read_bytes()) for p in (ROOT/'tooling').glob('*') if p.is_file()},'assignments':assignments,'pairs':pairs,'doubleGrade':double,'preflight':dry,'preflightDecision':readiness}
    json_write(target,result)
    with (ROOT/'events.jsonl').open('a') as f:f.write(json.dumps({'utc':now(),'event':'registration','sha256':sha(target.read_bytes()),'subjectRuns':0})+'\n')
    print(sha(target.read_bytes()),result['registeredUtc'])
if __name__=='__main__': main()
