"""A no-model connectivity and isolation probe before the first live assignment."""
import json
from pathlib import Path
import subprocess
import tempfile
import time
from register import env_browser, now
from session import flags, visibility
from study import MODEL,SECONDARY,ROOT,REPO, fixture, physical, json_write, sha, hash_tree, package

def main():
    root=Path(tempfile.mkdtemp(prefix='scope-check-'))
    (root/'other-work').mkdir();(root/'other-work'/'x').write_text('probe')
    work=root/'project';fixture('ordinary','none',work)
    receipt=root/'receipt';receipt.mkdir()
    host=subprocess.Popen(['node',str(ROOT/'tooling/browser.cjs'),str(work),str(receipt),'ordinary','window'],env=env_browser(),stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for _ in range(100):
            if (work/'.window-ready').exists(): break
            if host.poll() is not None: raise RuntimeError(host.stderr.read().decode()[-350:])
            time.sleep(.1)
        argv=['codex',*flags(work,MODEL,'medium'),'sandbox','-P','window','-C',str(work),'/usr/bin/python3','browser.py']
        probe=subprocess.run([*argv,'view'],cwd=work,capture_output=True,timeout=30)
        if probe.returncode:raise RuntimeError(probe.stderr.decode()[-500:]+probe.stdout.decode()[-150:])
        reply=json.loads(probe.stdout)
    finally:
        host.terminate()
        try:host.wait(timeout=4)
        except subprocess.TimeoutExpired:host.kill();host.wait()
    post={}
    for v in ['none','full','B']:
        q=root/v;fixture('ordinary',v,q)
        post[v]={'physical':physical(q)}
        for m in [MODEL,SECONDARY]:
            post[v][m]=visibility(q,m,'medium',(ROOT/'inputs/ordinary.txt').read_text())
            assert post[v][m]['skills']==(['frontend-design'] if v!='none' else []),post[v][m]
    files={p.name:sha(p.read_bytes()) for p in (ROOT/'tooling').iterdir() if p.is_file()}
    frozen=json.loads((ROOT/'registration.json').read_text())
    updated={}
    for task,variants in frozen['tasks'].items():
        updated[task]={}
        for v,old in variants.items():
            pk=root/('replay-'+task+'-'+v);fixture(task,v,pk)
            current=hash_tree(pk)
            assert list(k for k in old.keys()|current.keys() if old.get(k)!=current.get(k))==['browser.py']
            updated[task][v]=current
    import re
    cue=re.compile(r'keyboard|key[ -]?press|tabb(?:ing|able)|tab[ -](?:key|order|through)|focus(?:ed|[- /]visible| states?| behavior)|keystroke',re.I)
    counts={v:[{'file':k,'line':i,'match':m.group(0)} for k,val in package(v).items() for i,line in enumerate(val.decode().splitlines(),1) for m in [cue.search(line)] if m] for v in ('A','B')}
    assert len(counts['A'])==3 and not counts['B'],counts
    assert all(not any(val for k,val in pp['physical'].items() if k not in ('projectReadme','projectPackage')) for pp in post.values())
    result={'utc':now(),'registration':sha((ROOT/'registration.json').read_bytes()),'supplement':sha((ROOT/'supplement.md').read_bytes()),'scripts':files,'browserProfileCommandExit':probe.returncode,'observedPage':reply['result']['text'].splitlines()[:3],'registrationExists':(ROOT/'registration.json').is_file(),'foreignSiblingExists':(root/'other-work'/'x').is_file(),'profiles':post,'modelsContacted':0,'tasks':updated,'equivalentCueScan':counts,'priorTransportFailure':'AF_UNIX connect denied with network disabled; replaced symmetrically by two local FIFOs before the first execution.'}
    json_write(ROOT/'prelaunch.json',result);print(sha((ROOT/'prelaunch.json').read_bytes()),reply['result']['controls'])
if __name__=='__main__':main()
