"""Use the same closed skill and network scope with a read-only score packet."""
import json
from pathlib import Path
import subprocess
from session import flags
from study import fs_list, sha

def arguments(work,model,effort):
    fs=fs_list(work)
    for k in (':project_roots',str(work)): fs[k]='read'
    for path in ['/usr/share/code','/usr/share/code-insiders','/usr/lib/chatgpt','/lib/chatgpt']:
        if Path(path).is_dir():fs[path]='none'
    return [*flags(work,model,effort),'-c','permissions.window.filesystem={'+','.join(json.dumps(k)+'='+json.dumps(v) for k,v in fs.items())+'}']

def visibility(work,model,effort,prompt):
    out=subprocess.run(['codex',*arguments(work,model,effort),'debug','prompt-input',prompt],cwd=work,capture_output=True,timeout=60,check=True)
    rows=json.loads(out.stdout)
    text='\n'.join(v.get('text','') for r in rows for v in r.get('content',[]) if isinstance(v,dict))
    return {'sha256':sha(out.stdout),'skills':[s.split(': ',1)[0][2:] for s in text.splitlines() if s.startswith('- ') and '(file: ' in s]}

def execute(work,model,effort,prompt,receipt,timeout):
    c=['codex',*arguments(work,model,effort),'exec','--ephemeral','--skip-git-repo-check','-m',model,'-C',str(work),'--json','--output-last-message',str(receipt/'answer.md'),'-']
    with (receipt/'events.jsonl').open('wb') as out,(receipt/'stderr.txt').open('wb') as err:
        return subprocess.run(c,input=prompt.encode(),cwd=work,stdout=out,stderr=err,timeout=timeout).returncode
