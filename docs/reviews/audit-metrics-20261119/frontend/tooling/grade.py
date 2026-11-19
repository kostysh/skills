"""Prepare an anonymized observation packet and collect one independent signed score."""
import argparse
import datetime
import json
from pathlib import Path
import re
import secrets
import shutil
import tempfile
from judge_session import execute, visibility
from study import MODEL, ROOT, json_write, sha
from register import now
from run_case import log

def packet_map(ids):
    path=ROOT/'score-key.json'
    keys=json.loads(path.read_text()) if path.exists() else {}
    missing=[i for i in ids if i not in keys]
    if missing:
        for i in missing:keys[i]=secrets.token_hex(4)
        json_write(path,keys)
    return keys

def pack(ids,work,keys,register):
    shutil.copyfile(ROOT/'rubric.md',work/'criteria.md')
    redactions={}
    for i in ids:
        case=register['assignments'][i]['task']
        src=ROOT/'runs'/i
        sub=work/keys[i];sub.mkdir()
        shutil.copyfile(ROOT/'inputs'/(case+'.txt'),sub/'brief.txt')
        shutil.copyfile(src/'change.diff',sub/'change.diff')
        shutil.copyfile(src/'browser.jsonl',sub/'operator-actions.jsonl')
        shutil.copytree(src/'observed',sub/'replay')
        # Remove explicit names and locations of the instruction package. Keep substantive claims about the work.
        answer=(src/'answer.md').read_text()
        answer,hits=re.subn(r'(?i)(?:\$?frontend-design|\.agents/skills/[^\s)]+|/tmp/local-form-[a-z0-9_]+/?)','',answer)
        (sub/'response.md').write_text(answer);redactions[keys[i]]=hits
        summary=json.loads((src/'result.json').read_text())
        json_write(sub/'integrity.json',{'complete':summary['complete'],'app_revision':json.loads((sub/'replay/observer.json').read_text())['revision'],'technicalProblem':summary['unexpectedInputEdits']!=[]})
    return redactions

def parse_answer(answer,expected):
    text=answer.read_text().strip()
    if text.startswith('```'):
        text=text.split('\n',1)[1].rsplit('```',1)[0].strip()
    data=json.loads(text)
    assert set(data)=={'signature','scores'} and data['signature'] and set(data['scores'])==set(expected)
    for s in data['scores'].values():
        assert all(s.get(axis) in ('PASS','FAIL','INCONCLUSIVE') for axis in ('P','K','I')),s
        assert isinstance(s.get('reason'),str) and s['reason'].strip()
        x=s['P'],s['K'];expected_i='FAIL' if 'FAIL' in x else ('PASS' if x==('PASS','PASS') else 'INCONCLUSIVE')
        assert s['I']==expected_i,s
    return data

def main():
    pr=argparse.ArgumentParser()
    pr.add_argument('stage');pr.add_argument('role',choices=['first','second','third'])
    pr.add_argument('ids',nargs='+')
    a=pr.parse_args()
    register=json.loads((ROOT/'registration.json').read_text())
    keys=packet_map(a.ids)
    receipt=ROOT/'assessments'/a.stage/a.role;receipt.mkdir(parents=True,exist_ok=False)
    work=Path(tempfile.mkdtemp(prefix='page-review-'))
    redactions=pack(a.ids,work,keys,register)
    ids=sorted([keys[i] for i in a.ids])
    prompt="""Независимо оцени изменения локальных форм в каталоге по criteria.md. Каждая подпапка имеет случайный код. Прочти запрос, фактические действия исполнителя, diff, проверку конечной формы и при необходимости снимки. В журнале действий loaded — хеш реально открытой версии, disk — хеш файлов в момент действия; сравни с app_revision. Для North Quay с упоминанием пустой отправки и Hawthorn Works используй состояние после ошибки; для обычной North Quay достаточно исходного состояния. Судить следует только по выданным фактам. Для каждого кода дай первоначальные P,K,I по рубрике, ссылку на конкретное наблюдение в reason и подпись. Верни только JSON вида {"signature":"independent assessor","scores":{"КОД":{"P":"PASS","K":"FAIL","I":"FAIL","reason":"…"}}}. Все оценки PASS, FAIL или INCONCLUSIVE. Не меняй файлы."""
    facts=visibility(work,MODEL,'high',prompt)
    assert facts['skills']==[]
    first='metadata.json'
    for code in ids:
        source=work/code
        json_write(receipt/'inputs'/(code+'.json'),{'files':{str(f.relative_to(source)):sha(f.read_bytes()) for f in sorted(source.rglob('*')) if f.is_file()}})
    json_write(receipt/first,{'handed':now(),'requestedModel':MODEL,'requestedEffort':'high','role':a.role,'aliases':ids,'prompt':prompt,'rubric':sha((work/'criteria.md').read_bytes()),'startup':facts,'redactions':redactions})
    log('assessment-handoff',role=a.role,stage=a.stage)
    log('assessment-start',role=a.role,stage=a.stage)
    status=execute(work,MODEL,'high',prompt,receipt,timeout=600)
    log('assessment-answer',role=a.role,stage=a.stage,exit=status)
    if status:raise SystemExit(status)
    parsed=parse_answer(receipt/'answer.md',ids)
    json_write(receipt/'signed.json',{'utc':now(),'answers':parsed,'answerSha256':sha((receipt/'answer.md').read_bytes()),'eventsSha256':sha((receipt/'events.jsonl').read_bytes())})
    log('assessment-signed',role=a.role,stage=a.stage)
    print(a.stage,a.role,len(ids),sha((receipt/'signed.json').read_bytes()),flush=True)
if __name__=='__main__':main()
