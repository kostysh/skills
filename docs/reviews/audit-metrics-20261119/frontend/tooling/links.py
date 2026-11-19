"""Resolve the temporary workspace links in signed comments to their preserved evidence."""
import re
from pathlib import Path
from study import ROOT,REPO

def durable(reason,alias,ident):
    links=[]
    pattern=r'\[([^\]]+)\]\(/tmp/page-review-[^/]+/([\da-f]+)/([^:)]+):(\d+)\)'
    def convert(m):
        label,code,file,n=m.groups()
        assert code==alias,(code,alias)
        fn={'operator-actions.jsonl':'browser.jsonl','replay/observer.json':'observed/observer.json'}[file]
        p=ROOT/'runs'/ident/fn
        assert p.is_file() and len(p.read_text().splitlines())>=int(n)
        links.append({'label':label,'file':str(p.relative_to(REPO)),'line':int(n)})
        return ''
    summary=re.sub(pattern,convert,reason).strip(' ·')
    assert '/tmp/' not in summary,summary
    return summary,links
