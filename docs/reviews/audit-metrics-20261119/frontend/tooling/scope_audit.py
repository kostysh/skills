"""Record public, non-content evidence of the restricted CLI scope and allowed skill surfaces."""
import datetime
import json
from pathlib import Path
import re
import subprocess
import tempfile
from register import now
from session import flags
from study import MODEL,SECONDARY,ROOT,fixture,sha,json_write

def run():
    work=Path(tempfile.mkdtemp(prefix='form-scope-'));fixture('ordinary','none',work)
    results={}
    for model in (MODEL,SECONDARY):
        facts=subprocess.check_output(['codex',*flags(work,model,'medium'),'debug','prompt-input','Check the page'],cwd=work)
        parts=[v.get('text','') for row in json.loads(facts) for v in row.get('content',[]) if isinstance(v,dict)]
        context=next(s for s in parts if '<permission_profile' in s)
        results[model]={'type':'managed','allowsPlatformMinimum':'<special>:minimal</special>' in context,'allowsWholeFileSystem':'<special>:root</special>' in context,'systemLibrariesListed':'/etc/ld.so.cache' in context and '/usr' in context,'cliBinaryListed':'standalone/releases' in context,'onlyCurrentProjectInManifest':str(work) in context and str(ROOT) not in context,'homeSkillsInCatalog':any('custom/skills/frontend-design' in s for s in parts),'inputSha256':sha(facts)}
        assert results[model]['allowsPlatformMinimum'] and not results[model]['allowsWholeFileSystem']
    script="""import json,os,pathlib,sys,hashlib
signatures=json.loads(sys.argv[1]);matches=[];candidateNames=[];paths=0;seen=set()
for root in ['/usr','/bin','/lib','/lib64',sys.argv[2]]:
 for here,dirs,files in os.walk(root):
  for n in files:
   p=os.path.join(here,n)
   try:
    st=os.stat(p,follow_symlinks=False);tag=(st.st_dev,st.st_ino)
    if tag in seen:continue
    seen.add(tag);paths+=1
    if n=='SKILL.md' or ('frontend-design' in n.casefold()):candidateNames.append(p)
    if str(st.st_size) in signatures and os.path.isfile(p) and not os.path.islink(p):
     with open(p,'rb') as f: digest=hashlib.sha256(f.read()).hexdigest()
     if digest in signatures[str(st.st_size)]:matches.append(p)
   except OSError:pass
print(json.dumps(dict(filesVisited=paths,namedCandidates=candidateNames,matchingBytes=matches)))"""
    from study import package,EXACT
    archived=(ROOT/'../../gpt-6-2/19/retirement/records.tar.gz').resolve()
    import tarfile
    with tarfile.open(archived) as tar:
        size=tar.getmember('archives/frontend-design-0.2.6.tgz').size
    sig={str(size):[EXACT]}
    for variant in ('A','B'):
        for key,data in package(variant).items():
            if key not in ('SKILL.md','references/strategy-to-implementation.md'):continue
            sig.setdefault(str(len(data)),[]).append(sha(data))
    import shutil
    binary=Path(shutil.which('codex')).resolve().parents[1]
    out=subprocess.check_output(['codex',*flags(work,MODEL,'medium'),'sandbox','-P','window','-C',str(work),'/usr/bin/python3','-c',script,json.dumps(sig),str(binary)],cwd=work,timeout=120)
    scan=json.loads(out)
    manifests=json.loads((Path.home()/'.codex/models_cache.json').read_text())['models']
    assert not scan['namedCandidates'] and not scan['matchingBytes'],scan
    base={}
    for m in manifests:
        if m['slug'] in [MODEL,SECONDARY]:
            message=json.dumps(m.get('model_messages',{}),sort_keys=True)
            base[m['slug']]={'sha256':sha(message.encode()),'knownDirectPhrases':{p:message.lower().count(p) for p in ['keyboard','focus-visible','focus states','keyboard and focus','press tab']}}
    json_write(ROOT/'scope-audit.json',{'utc':now(),'note':'The historic windowProfile field searched for a literal profile NAME. The CLI reports a managed permission profile; its effective explicit grants are inspected here. Exact-byte search covers the allowed system programs and CLI distribution. Base instruction counts refer to the locally cached model metadata; server-internal text is not observable.','inputRegistration':sha((ROOT/'registration.json').read_bytes()),'priorSurfaceDiscovery':sha((ROOT/'scope-discovery.json').read_bytes()),'fifoPrelaunch':sha((ROOT/'prelaunch.json').read_bytes()),'runner':{f.name:sha(f.read_bytes()) for f in (ROOT/'tooling').iterdir() if f.is_file()},'startup':results,'allowedSystemFiles':scan,'localModelMetadata':base})
    print(results,scan,flush=True)
if __name__=='__main__':run()
