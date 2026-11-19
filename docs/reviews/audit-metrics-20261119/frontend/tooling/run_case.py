"""Execute exactly one registered run once the coordinator opens its gate."""
import argparse
from difflib import unified_diff
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from register import env_browser, now, observe
from session import execute, visibility
from study import ROOT, fixture, hash_tree, json_write, physical, sha

def log(event,**facts):
    with (ROOT/'events.jsonl').open('a') as f:f.write(json.dumps({'utc':now(),'event':event,**facts},ensure_ascii=False)+'\n')

def run(ident):
    register=json.loads((ROOT/'registration.json').read_text())
    assigned=register['assignments'][ident]
    task,variant=assigned['task'],assigned['variant']
    if not (ROOT/'release-to-run.json').exists():raise SystemExit('Coordinator gate not open.')
    if assigned['phase']=='conditional' and not (ROOT/'candidate.json').exists(): raise SystemExit('Conditional series not active.')
    receipt=ROOT/'runs'/ident
    receipt.mkdir(parents=True,exist_ok=False)
    work=Path(tempfile.mkdtemp(prefix='local-form-'))
    fixture(task,variant,work)
    before=hash_tree(work)
    files_before={f.name:f.read_text() for f in work.iterdir() if f.suffix in ('.html','.css','.js')}
    prompt=(ROOT/'inputs'/(task+'.txt')).read_text()
    expected=json.loads((ROOT/'prelaunch.json').read_text())['tasks'][task]['full' if variant=='A' else variant] if variant!='C' else None
    assert not expected or before==expected
    visible=visibility(work,assigned['model'],assigned['effort'],prompt)
    access=physical(work)
    assert visible['skills']==([] if variant=='none' else ['frontend-design']),visible
    assert not any(v for k,v in access.items() if k not in ('projectReadme','projectPackage')),access
    assert access['projectReadme'] and access['projectPackage']==(variant!='none')
    json_write(receipt/'dispatch.json',{'run':ident,'model':assigned['model'],'effort':assigned['effort'],'workdir':str(work),'input':before,'promptSha256':sha(prompt.encode()),'startup':visible,'physical':access})
    log('handed',run=ident)
    browser_log=(receipt/'browser-stderr.txt').open('wb')
    host=subprocess.Popen(['node',str(ROOT/'tooling/browser.cjs'),str(work),str(receipt),task,'window'],env=env_browser(),stderr=browser_log,stdout=browser_log)
    try:
        for _ in range(200):
            if (work/'.window-ready').exists():break
            if host.poll() is not None:raise RuntimeError('Browser host failed')
            time.sleep(0.05)
        else: raise RuntimeError('Browser socket not ready')
        # Touch the real socket from the same native profile the executor's commands use.
        from study import config
        probe=subprocess.run(['codex',*config(work,assigned['model'],assigned['effort']),'sandbox','-P','window','-C',str(work),'/usr/bin/python3','browser.py','view'],cwd=work,capture_output=True,timeout=30)
        if probe.returncode: raise RuntimeError('Browser unavailable within native sandbox: '+probe.stderr.decode()[-220:])
        (receipt/'browser-smoke.json').write_bytes(probe.stdout)
        # Save the coordinator's instrumentation probe outside the subject action journal.
        (receipt/'browser.jsonl').rename(receipt/'browser-smoke.jsonl')
        log('started',run=ident)
        status=execute(work,assigned['model'],assigned['effort'],prompt,receipt)
    finally:
        host.terminate()
        try: host.wait(timeout=12)
        except subprocess.TimeoutExpired: host.kill();host.wait()
        browser_log.close()
    log('executor-finished',run=ident,exit=status)
    if not (receipt/'browser.jsonl').exists(): (receipt/'browser.jsonl').touch()
    if not (receipt/'answer.md').exists(): (receipt/'answer.md').touch()
    artifact=receipt/'site'; artifact.mkdir()
    diff=[]
    for f in sorted(work.glob('*')):
        if f.is_symlink() or not f.is_file() or f.suffix not in ('.html','.js','.css'):continue
        shutil.copyfile(f,artifact/f.name)
        diff.extend(unified_diff(files_before.get(f.name,'').splitlines(True),f.read_text().splitlines(True),fromfile='before/'+f.name,tofile='after/'+f.name))
    (receipt/'change.diff').write_text(''.join(diff))
    observe(artifact,receipt/'observed',task)
    # JSONL kept byte-for-byte for provenance. Neither debug prompt nor CLI credentials are stored.
    raw=(receipt/'events.jsonl').read_bytes()
    exempt=('browser.py','README.md')
    after=hash_tree(work)
    changed=[k for k in before.keys()|after.keys() if before.get(k)!=after.get(k)]
    json_write(receipt/'result.json',{'exit':status,'complete':status==0 and bool((receipt/'answer.md').stat().st_size),'recordedUtc':now(),'eventsSha256':sha(raw),'browserSha256':sha((receipt/'browser.jsonl').read_bytes()),'answerSha256':sha((receipt/'answer.md').read_bytes()),'changed':sorted(changed),'unexpectedInputEdits':[k for k in changed if k in exempt or k.startswith('.agents/')],'site':hash_tree(artifact)})
    print(ident,status,len(raw),sha(raw),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('run');run(p.parse_args().run)
