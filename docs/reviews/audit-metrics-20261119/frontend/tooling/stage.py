"""Dispatch the registered stage, or two independent scorers after evidence collection."""
from concurrent.futures import ThreadPoolExecutor,as_completed
import argparse
import json
from pathlib import Path
import subprocess
import sys
from grade import packet_map
from study import ROOT
from run_case import run,log

def main():
    p=argparse.ArgumentParser()
    p.add_argument('stage',choices=['primary','conditional'])
    p.add_argument('action',choices=['run','score'])
    p.add_argument('--jobs',type=int,default=2)
    args=p.parse_args()
    data=json.loads((ROOT/'registration.json').read_text())
    ids=sorted(k for k,v in data['assignments'].items() if v['phase']==args.stage)
    if args.action=='run':
        if not (ROOT/'release-to-run.json').exists(): raise SystemExit('Coordinator gate not open.')
        with ThreadPoolExecutor(max_workers=args.jobs) as pool:
            tasks={pool.submit(run,i):i for i in ids}
            failed=[]
            for job in as_completed(tasks):
                try: job.result()
                except Exception as err:
                    ident=tasks[job];failed.append(ident);log('execution-problem',run=ident,reason=str(err))
                    print(ident,type(err).__name__,str(err),flush=True)
            if failed: raise SystemExit('Unfinished registered assignments: '+','.join(failed))
    else:
        packet_map(list(data['assignments']))
        usable=[i for i in ids if (ROOT/'runs'/i/'result.json').exists() and json.loads((ROOT/'runs'/i/'result.json').read_text())['complete']]
        roles={'first':usable,'second':[i for i in usable if i in data['doubleGrade']]}
        with ThreadPoolExecutor(max_workers=2) as pool:
            calls={role:pool.submit(subprocess.run,[sys.executable,'-B',str(ROOT/'tooling/grade.py'),args.stage,role,*codes],cwd=ROOT) for role,codes in roles.items() if codes}
            if any(f.result().returncode for f in calls.values()):raise SystemExit(1)
if __name__=='__main__':main()
