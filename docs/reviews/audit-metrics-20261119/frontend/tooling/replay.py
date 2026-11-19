"""Verify the preserved trial without contacting a model. --render opens a fresh local Chromium."""
import argparse
import json
import io
import tarfile
from pathlib import Path
import tempfile
from grade import pack,parse_answer
from register import observe
from study import ROOT,REPO,MANIFEST,EXACT,DROP,sha,hash_tree

def read(p):return json.loads(p.read_text())
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--render',action='store_true');args=parser.parse_args()
    reg=read(ROOT/'registration.json');trans=read(ROOT/'prelaunch.json');scope=read(ROOT/'scope-audit.json')
    assert trans['registration']==sha((ROOT/'registration.json').read_bytes())==scope['inputRegistration']
    assert scope['fifoPrelaunch']==sha((ROOT/'prelaunch.json').read_bytes())
    assert scope['allowedSystemFiles']['namedCandidates']==[] and scope['allowedSystemFiles']['matchingBytes']==[]
    assert reg['rubric']==sha((ROOT/'rubric.md').read_bytes())
    # Replay the historical installable bytes even when the active skill has advanced.
    with tarfile.open(REPO/MANIFEST) as outer:
        raw=outer.extractfile('archives/frontend-design-0.2.6.tgz').read()
    assert sha(raw)==EXACT
    with tarfile.open(fileobj=io.BytesIO(raw)) as pkg:
        full={m.name:pkg.extractfile(m).read() for m in pkg.getmembers() if m.isfile()}
    removed=dict(full)
    for filename,edits in DROP.items():
        text=removed[filename].decode()
        for old,new in edits:
            assert text.count(old)==1
            text=text.replace(old,new)
        removed[filename]=text.encode()
    for v,files in [('full',full),('A',full),('B',removed),('none',{})]:
        assert {k:sha(b) for k,b in files.items()}==reg['packageFiles'][v]
    events=[json.loads(s) for s in (ROOT/'events.jsonl').read_text().splitlines()]
    assert events[0]['sha256']==trans['registration']
    release=read(ROOT/'release-to-run.json')
    assert all(e['utc']>=release['acceptedMethodUtc'] for e in events if e['event']=='started')
    subjects=0;opinions=0;rendered=0;hashes=set()
    for r in sorted((ROOT/'runs').iterdir()):
        if not (r/'result.json').exists():continue
        res=read(r/'result.json');disp=read(r/'dispatch.json');assigned=reg['assignments'][r.name]
        if assigned['variant']!='C':assert disp['input']==trans['tasks'][assigned['task']]['full' if assigned['variant']=='A' else assigned['variant']]
        assert sha((r/'events.jsonl').read_bytes())==res['eventsSha256']
        assert sha((r/'answer.md').read_bytes())==res['answerSha256']
        assert sha((r/'browser.jsonl').read_bytes())==res['browserSha256']
        assert hash_tree(r/'site')==res['site'] and res['eventsSha256'] not in hashes
        hashes.add(res['eventsSha256']);subjects+=1
        if args.render:
            temp=Path(tempfile.mkdtemp(prefix='render-proof-'));observe(r/'site',temp,assigned['task'])
            current,original=read(temp/'observer.json'),read(r/'observed/observer.json')
            if current['browser']!=original['browser']:print('Chromium changed:',original['browser'],'->',current['browser'])
            for key in ('revision','pageErrors','results'):assert current[key]==original[key],(r.name,key)
            rendered+=1
    key_path=ROOT/'score-key.json'
    if key_path.exists():
        keys=read(key_path);inverse={v:k for k,v in keys.items()}
        for signed in (ROOT/'assessments').glob('*/*/signed.json'):
            rec=signed.parent;data=read(signed);ids=list(data['answers']['scores'])
            assert parse_answer(rec/'answer.md',ids)==data['answers']
            assert sha((rec/'events.jsonl').read_bytes())==data['eventsSha256']
            assert sha((rec/'answer.md').read_bytes())==data['answerSha256']
            work=Path(tempfile.mkdtemp(prefix='grade-replay-'));pack([inverse[i] for i in ids],work,keys,reg)
            for code in ids:assert hash_tree(work/code)==read(rec/'inputs'/(code+'.json'))['files'],code
            opinions+=len(ids)
    print(json.dumps({'assignedRunsWithRecords':subjects,'independentlySignedOpinions':opinions,'browserReplays':rendered,'rubricSha256':reg['rubric'],'passed':True}))
if __name__=='__main__':main()
