from pathlib import Path
from tempfile import TemporaryDirectory
import json, shutil, subprocess, hashlib, sys
def run(source, kind, folder):
    def fill(v):return {'op':'fill','target':'#email','value':v}
    def click(s):return {'op':'click','target':s}
    review=click('text=Review changes');confirm=click('text=Confirm');cancel=click('text=Cancel')
    pause={'op':'wait','ms':2100}
    old='first@example.test';new='edited@example.test'
    setup=[fill(old),review,confirm] if kind=='ordinary' else []
    user=[click('#weekly'),fill('misspelled'),review,fill(new),review]
    end=([cancel,review,confirm] if kind=='ordinary' else [confirm,cancel,pause] if kind=='boundary' else [confirm,{'op':'key','key':'Escape'},pause,review,confirm,pause])
    sequence=setup+user+end
    with TemporaryDirectory(prefix='screen-sample-') as tmp:
        target=Path(tmp)
        for f in source.iterdir():
            if f.name in ['dist','visit.mjs','BROWSER.md']:
                if f.is_dir():shutil.copytree(f,target/f.name)
                else:shutil.copy2(f,target/f.name)
        command=subprocess.run(['node','visit.mjs',json.dumps(sequence)],cwd=target,capture_output=True,text=True,timeout=45)
        if command.returncode:raise RuntimeError(command.stderr+' '+command.stdout[-1600:])
        trace=json.loads(next((target/'visits').glob('*.json')).read_text())
        digest=lambda b:hashlib.sha256(b).hexdigest()
        screen=next((target/'visits').glob('*.png'))
        assert digest(screen.read_bytes())==trace['screenSha256'] and trace['actions']==sequence
        def state(i):return trace['timeline'][i]['state']
        def value(s,identifier,key):return next(f[key] for f in s['fields'] if f['id']==identifier)
        off=len(setup)
        wrong=state(off+3)
        assert value(wrong,'email','value')=='misspelled' and value(wrong,'email','invalid')=='true' and wrong['focus']['id']=='email' and not wrong['dialog'] and value(wrong,'weekly','checked')=='true'
        assert 'valid email' in wrong['page'] and new in state(off+5)['dialog'][0]
        last=state(-1)
        assert new in ' '.join(last['status']) and 'Weekly' in ' '.join(last['status']) and value(last,'email','value')==new and not last['dialog']
        if kind=='ordinary':
            middle=state(off+6)
            assert not middle['dialog'] and old in ' '.join(middle['status']) and new not in ' '.join(middle['status']) and value(middle,'email','value')==new
        else:
            pending=state(off+6);middle=state(off+7)
            assert 'Applying…' in pending['dialog'][0] and not middle['dialog'] and value(middle,'email','value')==new
            if kind=='boundary':
                assert 'Applying changes' in ' '.join(middle['status']) and new not in ' '.join(middle['status'])
            else:
                settled=state(off+8)
                assert 'Request cancelled' in ' '.join(settled['status']) and new not in ' '.join(settled['status']) and value(settled,'weekly','checked')=='true'
        folder.mkdir(parents=True,exist_ok=True)
        shutil.copy2(screen,folder/'screen.png')
        (folder/'trace.json').write_text(json.dumps(trace,ensure_ascii=False,indent=2)+'\n')
        print(kind,len(trace['timeline']),trace['screenSha256'],flush=True)
if __name__=='__main__':run(Path(sys.argv[1]),sys.argv[2],Path(sys.argv[3]))
