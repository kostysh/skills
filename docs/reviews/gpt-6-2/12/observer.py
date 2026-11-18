from pathlib import Path
import hashlib, json, sys

def sha(path):
    return hashlib.file_digest(path.open('rb'),'sha256').hexdigest()

directory=Path(__file__).resolve().parent
mapping=json.loads(Path(sys.argv[1]).read_text())
for item in mapping:
    rec=Path(item['receipt'])
    if not rec.is_absolute():rec=directory/rec
    dispatch=json.loads((rec/'dispatch.json').read_text())
    result=json.loads((rec/'result.json').read_text())
    root=Path(dispatch['project'])
    report=root/'handoff.md'
    changed_originals=[]
    for name,before in dispatch['input_files'].items():
        if result['output_files'].get(name)!=before or result.get('output_modes',{}).get(name)!=dispatch.get('input_modes',{}).get(name):
            changed_originals.append(name)
    status={'exit':result['exit'],'added':sorted(set(result['output_files'])-set(dispatch['input_files'])),'changedInputs':changed_originals,'handoff':{'exists':report.is_file(),'bytes':report.stat().st_size if report.is_file() else 0,'sha256':sha(report) if report.is_file() else None}}
    (rec/'observer.json').write_text(json.dumps(status,indent=2)+'\n')
    print(item['label'],status)
