"""Assignments and acquisition for this series. A recorded run is never overwritten."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import secrets
from session import *

def register():
    random = secrets.SystemRandom()
    assignments, cases, double = {}, {}, {}
    for skill, pkg in PACKAGE.items():
        folder = ROOT/skill
        by_task = {}
        for case in ('ordinary','boundary'):
            root=folder/'inputs'/case
            files=tree(root/'project')
            assert files and (root/'task.md').is_file()
            by_task[case]={'prompt':sha((root/'task.md').read_bytes()),'project':files}
        cases[skill]={'version':pkg['version'],'archive':pkg['sha256'],'rubric':sha((folder/'rubric.md').read_bytes()),'cases':by_task}
        ids=[]
        for case in by_task:
            for variant in (pkg['version'], 'B'):
                ident=secrets.token_hex(6)
                assignments[ident]={'skill':skill,'case':case,'pair':case+'-1','variant':variant,
                    'phase':'primary','model':MODEL,'effort':'medium','label':secrets.token_hex(5)}
                ids.append(ident)
        double[skill]=random.choice(ids)
    order=list(assignments); random.shuffle(order)
    eval_order=order.copy(); random.shuffle(eval_order)
    write(ROOT/'registration.json',{'utc':now(),'base':BASE,'branch':'codex/seven-skill-trials','worktree':str(REPO),
        'cli':subprocess.check_output(['codex','--version'],stderr=subprocess.DEVNULL,text=True).strip(),
        'study':'individual-trials-20261122','rubricVersion':'R1','packetVersion':'P1',
        'protocolSha256':sha((ROOT/'protocol.md').read_bytes()),'deliveryScripts':tree(ROOT/'method'),
        'packageManifest':sha((ROOT/'packages/manifest.json').read_bytes()),'skills':cases,
        'assignments':assignments,'executionOrder':order,'gradingOrder':eval_order,'doubleRating':double,
        'gradingModel':'gpt-6.2-astra','gradingEffort':'high','decisionModel':'gpt-6.2-astra','decisionEffort':'high'})

def scope():
    """Search the common read surface, including files with nonstandard names, from inside the control jail."""
    signatures={}
    for skill,row in PACKAGE.items():
        for name,data in payload(skill).items():
            if name=='SKILL.md' or name.startswith('references/'):
                signatures.setdefault(str(len(data)),set()).add(sha(data))
        archive=ROOT/'packages'/(skill+'-'+row['version']+'.tar.gz')
        signatures.setdefault(str(archive.stat().st_size),set()).add(row['sha256'])
    search="""import hashlib,json,os,sys
sizes,roots,targets=map(json.loads,sys.argv[1:]); named=[]; exact=[]; visited=set()
def check(p):
 try:
  st=os.lstat(p); key=(st.st_dev,st.st_ino)
  if key in visited or os.path.islink(p) or not os.path.isfile(p):return
  visited.add(key)
  if any(t in os.path.basename(p).lower() for t in targets) or os.path.basename(p)=='SKILL.md':named.append(p)
  if str(st.st_size) in sizes:
   with open(p,'rb') as s:h=hashlib.sha256(s.read()).hexdigest()
   if h in sizes[str(st.st_size)]:exact.append(p)
 except OSError:pass
for root in roots:
 if os.path.isfile(root):check(root)
 else:
  for folder,dirs,files in os.walk(root):
   for name in files:check(os.path.join(folder,name))
print(json.dumps({'visited':len(visited),'named':named,'exact':exact}))"""
    with tempfile.TemporaryDirectory(prefix='local-review-') as tmp:
        work=window(tmp)
        args=flags(work,MODEL,'medium',instructions())
        scan=sandbox(work,args,search,json.dumps({k:sorted(v) for k,v in signatures.items()}),
                     json.dumps(list(map(str,[*SYSTEM,CLI_DIR,NODE]))),json.dumps(sorted(PACKAGE)))
        assert scan['visited']>1000 and not scan['exact'] and not scan['named'],scan
        write(ROOT/'system-scope.json',{'utc':now(),'systemRoots':list(map(str,[*SYSTEM,CLI_DIR,NODE])),
              'source':'method/trial.py','checkedRootAndReferencesAndArchive':sorted(PACKAGE),**scan})

def dispatch(ident):
    reg=json.loads((ROOT/'registration.json').read_text())
    row=reg['assignments'][ident]
    skill, case=row['skill'],row['case']
    material=ROOT/skill/'inputs'/case
    prompt=(material/'task.md').read_text()
    expected=reg['skills'][skill]['cases'][case]
    assert sha(prompt.encode())==expected['prompt'] and tree(material/'project')==expected['project']
    assert reg['skills'][skill]['rubric']==sha((ROOT/skill/'rubric.md').read_bytes())
    for name in ('session.py','trial.py'):
        assert reg['deliveryScripts'][name]==sha((ROOT/'method'/name).read_bytes())
    assert sha((ROOT/'protocol.md').read_bytes())==reg['protocolSha256']
    assert (ROOT/'system-scope.json').is_file()
    receipt=ROOT/skill/'runs'/ident
    receipt.mkdir(parents=True,exist_ok=False)
    mounted=None if row['variant']=='B' else skill
    with tempfile.TemporaryDirectory(prefix='local-review-') as tmp:
        work=window(tmp)
        shutil.copytree(material/'project',work,dirs_exist_ok=True)
        (work/'.agents/skills').mkdir(parents=True)
        if mounted:
            install(work,mounted)
        before=tree(work)
        args=flags(work,row['model'],row['effort'],instructions(mounted))
        try:
            visible=visibility(work,args,prompt,mounted)
            access=isolation(work,args,skill)
            valid(visible,access,mounted)
            write(receipt/'delivery.json',{'utc':now(),'workdir':str(work),'model':row['model'],'effort':row['effort'],
                 'registration':sha((ROOT/'registration.json').read_bytes()),'projectSha256':expected['project'],
                 'installed':{} if not mounted else PACKAGE[skill]['files'],'promptSha256':expected['prompt'],'startup':visible,'access':access})
            result=execute(work,args,prompt,receipt)
            after=tree(work)
            result['changed']=sorted(k for k in before.keys()|after.keys() if before.get(k)!=after.get(k))
            write(receipt/'result.json',result)
            print(ident,skill,case,'exit',result['exit'],result['lastEvent'],flush=True)
        except Exception as e:
            why=str(e)
            if isinstance(e,subprocess.CalledProcessError):
                why=e.stderr.decode(errors='replace')[-1000:]
            write(receipt/'technical.json',{'utc':now(),'type':type(e).__name__,'reason':why[:3500]})
            print(ident,skill,case,'technical',type(e).__name__,why[:230],flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('stage', choices=['register','scope','dispatch'])
    p.add_argument('ids',nargs='*')
    opts=p.parse_args()
    if opts.stage=='register': register()
    if opts.stage=='scope': scope()
    if opts.stage=='dispatch':
        reg=json.loads((ROOT/'registration.json').read_text())
        with ThreadPoolExecutor(max_workers=3) as pool:
            jobs=[pool.submit(dispatch,i) for i in (opts.ids or reg['executionOrder'])]
            for job in as_completed(jobs):job.result()
