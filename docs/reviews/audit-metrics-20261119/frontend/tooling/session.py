"""Bound the native ephemeral model process and collect sanitized startup facts."""
import json
from pathlib import Path
import subprocess
from study import config, fs_list, sha

def flags(work,model,effort):
    locked=[*config(work,model,effort),'-c','agents.max_threads=1','-c','agents.max_depth=0','--disable','multi_agent_v2']
    # Other installed desktop applications also ship private skill catalogs, outside Codex discovery.
    fs=fs_list(work)
    for path in ['/usr/share/code','/usr/share/code-insiders','/usr/lib/chatgpt','/lib/chatgpt']:
        if Path(path).is_dir():fs[path]='none'
    locked.extend(['-c','permissions.window.filesystem={'+','.join(json.dumps(k)+'='+json.dumps(v) for k,v in fs.items())+'}'])
    return locked

def visibility(work,model,effort,prompt):
    command=['codex',*flags(work,model,effort),'debug','prompt-input',prompt]
    proc=subprocess.run(command,cwd=work,capture_output=True,timeout=60)
    if proc.returncode:raise RuntimeError(proc.stderr.decode()[-500:])
    data=json.loads(proc.stdout)
    s='\n'.join(j.get('text','') for message in data for j in message.get('content',[]) if isinstance(j,dict))
    names=[]
    for line in s.splitlines():
        if line.startswith('- ') and '(file: ' in line:
            names.append(line.split(': ',1)[0].removeprefix('- '))
    return {'rawSha256':sha(proc.stdout),'skills':names,'namedTargetMentions':s.count('frontend-design'),
            'targetFromHome':s.count('custom/skills/frontend-design'),'runtimeSensitiveMarkers':{v:s.lower().count(v.lower()) for v in ['keyboard','focus-visible','focus behavior','audit-metrics-20261119','grader packet','trial key','rubric.md','Hawthorn Works','North Quay']},
            'namespaces':[t.get('name') for t in data[0].get('tools',[])],
            'browserMcp':s.count('mcp__browser'),'nodeReplMcp':s.count('mcp__node_repl'),'windowProfile':any('window' in row for row in s.splitlines() if 'permission' in row.lower())}

def execute(work,model,effort,prompt,receipt,timeout=480):
    command=['codex',*flags(work,model,effort),'exec','--ephemeral','--skip-git-repo-check','--model',model,'-C',str(work),'--json','--output-last-message',str(receipt/'answer.md'),'-']
    with (receipt/'events.jsonl').open('wb') as events, (receipt/'stderr.txt').open('wb') as err:
        return subprocess.run(command,cwd=work,input=prompt.encode(),stdout=events,stderr=err,timeout=timeout).returncode
