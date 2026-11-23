"""Freeze blinded P1 packets, dispatch independent judges and retain their original responses."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import re
from session import *

REG=json.loads((ROOT/'registration.json').read_text())
TARGET_NAMES=re.compile('|'.join(re.escape(s) for s in PACKAGE),re.I)
PACKAGE_PATH=re.compile(r'\.agents(?:/skills)?|SKILL\.md|references/[\w.-]+\.md')
AMBIENT='Failed to create stream fd: Operation not permitted'

def anonymous(text, work):
    text=text.replace(work+'/', '').replace(work, '.')
    return TARGET_NAMES.sub('методика',text)

def make_packet(ident):
    row=REG['assignments'][ident]
    skill,case,label=row['skill'],row['case'],row['label']
    receipt=ROOT/skill/'runs'/ident
    result=json.loads((receipt/'result.json').read_text())
    delivery=json.loads((receipt/'delivery.json').read_text())
    work=delivery['workdir']
    raw=gzip.decompress((receipt/'events.jsonl.gz').read_bytes())
    assert sha(raw)==result['eventsSha256']
    answer=(receipt/'answer.md').read_bytes()
    assert sha(answer)==result['answerSha256']
    actions=[]
    files=list(REG['skills'][skill]['cases'][case]['project'])
    for line in raw.splitlines():
        e=json.loads(line)
        if e['type']!='item.completed': continue
        item=e['item']; typ=item['type']
        if typ=='command_execution':
            cmd=item['command']
            output=item['aggregated_output']
            without_exclusions=re.sub(r'-g\s+[^\s]*!\.agents[^\s]*','',cmd)
            if PACKAGE_PATH.search(without_exclusions):
                # If a command reads both sources, keep the separately identifiable project part.
                mixed=[f for f in files if re.search(r'(?<![\w/.-])'+re.escape(f)+r'(?![\w/.-])',cmd)]
                if mixed:
                    raise ValueError(f'Mixed read requires an evidence-preserving extract: {ident} {mixed}')
                continue
            cmd=re.sub(r'-g\s+[^\s]*\.agents[^\s]*','',cmd)
            lines=[l for l in output.splitlines() if l.strip()!=AMBIENT and not PACKAGE_PATH.search(l) and not TARGET_NAMES.search(l)]
            if PACKAGE_PATH.search(cmd):
                cmd='Перечень доступных файлов проекта'
            actions.append({'command':anonymous(cmd,work),'exit':item.get('exit_code'),'output':anonymous('\n'.join(lines),work)})
        elif typ not in ('agent_message','reasoning','todo_list'):
            actions.append({'type':typ,'record':anonymous(json.dumps(item,ensure_ascii=False),work)})
    packet={'label':label,'case':case,'answer':anonymous(answer.decode(),work),'actions':actions,
            'changedProjectFiles':result['changed'],'exit':result['exit'],'lastEvent':result['lastEvent']}
    text=json.dumps(packet,ensure_ascii=False)
    assert not TARGET_NAMES.search(text) and '.agents/skills/' not in text and 'local-review-' not in text,ident
    dest=ROOT/skill/'assessments/packets'/(label+'.json')
    if dest.exists():
        if json.loads(dest.read_text())==packet:return
        assert not any((dest.parents[1]/r/'delivery.json').exists() for r in ('first','second','adjudicator'))
        dest.write_text(json.dumps(packet,ensure_ascii=False,indent=2)+'\n')
    else:
        write(dest,packet)

def judge(skill,role,labels=None):
    rows=[(i,REG['assignments'][i]) for i in REG['gradingOrder'] if REG['assignments'][i]['skill']==skill]
    if role=='second':
        rows=[(i,r) for i,r in rows if i==REG['doubleRating'][skill]]
    if role=='adjudicator':
        rows=[(i,r) for i,r in rows if r['label'] in labels]
    folder=ROOT/skill
    receipt=folder/'assessments'/role
    receipt.mkdir(exist_ok=False)
    ident=role+'-'+secrets_id(skill,role)
    with tempfile.TemporaryDirectory(prefix='local-review-') as tmp:
        work=window(tmp)
        shutil.copytree(folder/'inputs',work/'inputs')
        shutil.copyfile(folder/'rubric.md',work/'criteria.md')
        labels=[r['label'] for _,r in rows]
        for label in labels:
            path=folder/'assessments/packets'/(label+'.json')
            shutil.copyfile(path,work/path.name)
        guide=(ROOT/'method/grading-instructions.md').read_text()
        assert sha(guide.encode())==REG['deliveryScripts']['grading-instructions.md']
        prompt=guide+'\n\nНазначение '+ident+'. Порядок работ '+', '.join(labels)+'. Критерии в criteria.md, исходные проекты в inputs, пакеты свидетельств в JSON с псевдонимом работы.'
        args=flags(work,REG['gradingModel'],REG['gradingEffort'],COMMON)
        startup=visibility(work,args,prompt,None); physical=isolation(work,args,skill)
        valid(startup,physical,None)
        files=tree(work)
        write(receipt/'delivery.json',{'utc':now(),'assessor':ident,'labels':labels,'packetFiles':files,'startup':startup,
              'access':physical,'model':REG['gradingModel'],'effort':REG['gradingEffort'],'prompt':prompt})
        result=execute(work,args,prompt,receipt)
        write(receipt/'result.json',{**result,'projectChanged':tree(work)!=files})
        print(skill,role,result['exit'],result['lastEvent'],flush=True)
        if result['exit']!=0:return
        msg=(receipt/'answer.md').read_text().strip()
        match=re.fullmatch(r'```(?:json)?\s*\n(.*)\n```',msg,re.S)
        score=json.loads(match[1] if match else msg)
        assert score['assessor']==ident and sorted(v['label'] for v in score['ratings'])==sorted(labels),(ident,labels)
        for v in score['ratings']:
            assert v['score'] in ('PASS','FAIL','INCONCLUSIVE') and v['behavior'] in ('done','missed','unknown') and v['reason'] and v['behaviorReason']
        write(receipt/'signed.json',{'assessor':ident,'signedUtc':result['finished'],'answerSha256':result['answerSha256'],
              'ratings':score['ratings']})

def secrets_id(skill,role):
    # Stable blinded signature for this particular fresh judging context.
    return sha((REG['utc']+skill+role).encode())[:8]

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('stage',choices=['prepare','score','resolve'])
    p.add_argument('values',nargs='*')
    opts=p.parse_args()
    if opts.stage=='prepare':
        for ident in (opts.values or REG['gradingOrder']):make_packet(ident)
    if opts.stage=='score':
        order=opts.values or list(PACKAGE)
        with ThreadPoolExecutor(max_workers=3) as pool:
            jobs=[pool.submit(judge,s,r) for s in order for r in ('first','second')]
            for j in as_completed(jobs):j.result()
    if opts.stage=='resolve':
        judge(opts.values[0],'adjudicator',opts.values[1:])
