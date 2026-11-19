"""Shared materialization and configuration for this specific field trial."""
import hashlib
import io
import json
from pathlib import Path
import shutil
import subprocess
import tarfile
import tomllib

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[3]
EXACT = '15ff2849d06f277aede6a988029443deef0b0ba1be2fda0b9b67282cd4649a33'
MANIFEST = 'docs/reviews/gpt-6-2/19/retirement/records.tar.gz'
MODEL = 'gpt-6.2-sol'
SECONDARY = 'gpt-6.1-sol'
DROP = {
    'SKILL.md': [
        ('contrast, tap targets, focus states, and reduced-motion behavior','contrast, tap targets, and reduced-motion behavior'),
        ('relevant states and interactions, keyboard and focus behavior, reduced-motion behavior','relevant states and interactions, reduced-motion behavior'),
    ],
    'references/strategy-to-implementation.md': [
        ('relevant states and interactions, keyboard/focus behavior, reduced-motion behavior','relevant states and interactions, reduced-motion behavior'),
    ],
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def json_write(p, value):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def hash_tree(project):
    return {str(f.relative_to(project)):sha(f.read_bytes()) for f in sorted(project.rglob('*')) if f.is_file() and not f.is_symlink()}

def package(variant):
    if variant == 'none': return {}
    with tarfile.open(REPO/MANIFEST) as outer:
        payload=outer.extractfile('archives/frontend-design-0.2.6.tgz').read()
    assert sha(payload)==EXACT
    with tarfile.open(fileobj=io.BytesIO(payload)) as archive:
        files={m.name:archive.extractfile(m).read() for m in archive.getmembers() if m.isfile()}
    assert len(files)==7 and all((REPO/'skills/frontend-design'/name).read_bytes()==data for name,data in files.items())
    if variant in ('B','C'):
        for filename, edits in DROP.items():
            value=files[filename].decode()
            for original,new in edits:
                assert value.count(original)==1
                value=value.replace(original,new)
            files[filename]=value.encode()
    if variant=='C':
        candidate=json.loads((ROOT/'candidate.json').read_text())
        marker=b'## Final Review Loop\n'
        files['SKILL.md']=files['SKILL.md'].replace(marker,marker+b'\n'+candidate['wording'].encode()+b'\n')
    return files

def fixture(task, variant, destination):
    destination.mkdir(parents=True,exist_ok=True)
    project='workshop' if task=='holdout' else 'quay'
    source=ROOT/'inputs'/project
    for path in source.iterdir():
        if path.name!='correction.css': shutil.copy2(path,destination/path.name)
    if task=='discriminating':
        with (destination/'screen.css').open('ab') as css: css.write((source/'correction.css').read_bytes())
    for from_name,to_name in [('README-project.md','README.md'),('browser.py','browser.py')]:
        shutil.copy2(ROOT/'inputs'/from_name,destination/to_name)
    for name,data in package(variant).items():
        file=destination/'.agents/skills/frontend-design'/name
        file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(data)

def fs_list(project):
    binary=Path(shutil.which('codex')).resolve().parent.parent
    return {':minimal':'read',':project_roots':'write',str(binary):'read','/usr':'read','/bin':'read','/lib':'read','/lib64':'read','/etc/ld.so.cache':'read',str(project):'write'}

def config(project,model,effort):
    flags=['--no-daemon','-m',model,'-a','never']
    for feature in ['memories','apps','plugins','multi_agent','shell_snapshot','js_repl','in_app_browser','in_app_chat']:
        flags.extend(['--disable',feature])
    options=['project_doc_max_bytes=0','model_reasoning_effort='+json.dumps(effort),'web_search="disabled"','default_permissions="window"']
    fs=fs_list(project)
    options.append('permissions.window.filesystem={'+','.join(json.dumps(k)+'='+json.dumps(v) for k,v in fs.items())+'}')
    options.append('permissions.window.network.enabled=false')
    home=Path.home()
    entries=set()
    for root in [home/'.codex/skills',home/'.agents/skills']:
        for path in root.glob('**/SKILL.md'):
            if '.worktrees' not in path.parts: entries.add(str(path))
    options.append('skills.config=['+','.join('{path='+json.dumps(p)+',enabled=false}' for p in sorted(entries))+']')
    # Disable every registered home MCP, including general-purpose file-reading tools.
    user_config=home/'.codex/config.toml'
    for name in tomllib.loads(user_config.read_text()).get('mcp_servers',{}):
        options.append('mcp_servers.'+name+'.enabled=false')
    for option in options: flags.extend(['-c',option])
    return flags

def visible(project,model,effort,prompt):
    result=subprocess.run(['codex',*config(project,model,effort),'debug','prompt-input',prompt],cwd=project,capture_output=True,timeout=60)
    if result.returncode: raise RuntimeError(result.stderr.decode()[-600:])
    rows=json.loads(result.stdout)
    narrative='\n'.join(str(part.get('text','')) for row in rows for part in row.get('content',[]) if isinstance(part,dict))
    tools=rows[0].get('tools',[])
    catalogs=[]
    for s in narrative.splitlines():
        if 'frontend-design' in s or (' (file: ' in s and s.startswith('- ')):
            catalogs.append(s.split(': ',1)[0].removeprefix('- '))
    signs=['Inventory peer views before visual direction','press Tab','keyboard and focus behavior','keyboard/focus behavior','focus states','Имена вариантов','audit-metrics-20261119','North Quay', 'Hawthorn Works']
    permissions=[line for line in narrative.splitlines() if ('<permission_profile' in line or 'named permissions profile' in line)]
    return {'rawSha256':sha(result.stdout),'skillRecords':catalogs, 'hostFrontendCount':sum('custom/skills/frontend-design' in s for s in narrative.splitlines()),'skillContexts':narrative.count('<skills_instructions>'),'markers':{k:narrative.lower().count(k.lower()) for k in signs},'toolNamespaces':[item.get('name',item.get('type')) for item in tools] if isinstance(tools,list) else list(tools),'windowPermissionInContext':any('window' in x for x in permissions),'promptBytes':len(result.stdout)}

def physical(project):
    copy=Path.home()/'.codex/skills/custom/skills/frontend-design/SKILL.md'
    check=[str(copy),str(REPO/'skills/frontend-design/SKILL.md'),str(REPO/MANIFEST),str(ROOT/'registration.json'),str(ROOT/'rubric.md'),str(Path.home()/'.codex/auth.json'),str(Path.home()/'.codex/AGENTS.md'),str(Path.home()/'.codex/config.toml'),str(project.parent/'other-work'/'x'),'/proc/self/root'+str(copy),str(project/'README.md'),str(project/'.agents/skills/frontend-design/SKILL.md')]
    script='import json,os,sys;print(json.dumps([os.access(k,os.R_OK) for k in sys.argv[1:]]))'
    cmd=['codex',*config(project,MODEL,'medium'),'sandbox','-P','window','-C',str(project),'/usr/bin/python3','-c',script,*check]
    result=subprocess.run(cmd,cwd=project,capture_output=True,timeout=30)
    if result.returncode: raise RuntimeError(result.stderr.decode()[-600:])
    values=json.loads(result.stdout); return dict(zip(['homePackage','sourceWorktree','archiveWithKey','assignments','rubric','auth','homeRules','homeConfig','sibling','procRootHomePackage','projectReadme','projectPackage'],values,strict=True))
