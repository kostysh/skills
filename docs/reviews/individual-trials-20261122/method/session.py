"""Native read-only Codex sessions used for the November 22 study."""
import gzip
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import tomllib
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[2]
MODEL = 'gpt-6.2-sol'
BASE = 'e74e9ea6c465328dfe4f234494a0dab0e6926855'
PACKAGE = json.loads((ROOT / 'packages/manifest.json').read_text())['packages']
CLI_DIR = Path(shutil.which('codex')).resolve().parents[1]
NODE = Path(shutil.which('node')).resolve()
SYSTEM = [Path(p) for p in ['/usr/bin', '/usr/lib', '/usr/lib64', '/usr/share/locale', '/usr/share/zoneinfo', '/bin', '/lib', '/lib64', '/etc/ld.so.cache'] if Path(p).exists()]
COMMON = ('Выполните запрос в пределах выданного проекта. Примените предоставленные рабочие инструкции, когда они относятся к запросу. '
          'Ссылки на файлы проекта в ответе указывайте относительно его корня. Опишите наблюдения и решение на языке запроса.')
def now():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')

def sha(data):
    return hashlib.sha256(data).hexdigest()

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as out:
        out.write(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def tree(folder):
    return {p.relative_to(folder).as_posix(): sha(p.read_bytes()) for p in sorted(folder.rglob('*')) if p.is_file() and not p.is_symlink()}

def payload(skill):
    p = PACKAGE[skill]
    archive = ROOT / 'packages' / (skill + '-' + p['version'] + '.tar.gz')
    assert sha(archive.read_bytes()) == p['sha256']
    with tarfile.open(archive, 'r:gz') as f:
        data = {m.name: f.extractfile(m).read() for m in f if m.isfile()}
    assert {k: sha(v) for k, v in data.items()} == p['files']
    return data

def install(work, skill):
    dest = work / '.agents/skills' / skill
    for name, data in payload(skill).items():
        target = dest / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    assert tree(dest) == PACKAGE[skill]['files']

def instructions(installed=None):
    text = COMMON
    if installed:
        for path, data in sorted(payload(installed).items(), key=lambda p: (p[0] != 'SKILL.md', p[0])):
            if path == 'SKILL.md' or (path.startswith('references/') and path.endswith('.md')):
                text += '\n\n' + path + '\n' + data.decode()
    return text

def flags(work, model, effort, guide):
    permissions = {':minimal': 'read', ':project_roots': 'read', str(work): 'read',
                   str(CLI_DIR): 'read', str(NODE): 'read', **{str(p): 'read' for p in SYSTEM}}
    for p in ['/usr/lib/chatgpt', '/lib/chatgpt', '/usr/lib/code', '/usr/lib/code-insiders']:
        if Path(p).exists():
            permissions[p] = 'none'
    disabled = []
    for base in [Path.home()/'.codex/skills', Path.home()/'.agents/skills']:
        for folder, dirs, names in os.walk(base, followlinks=False):
            dirs[:] = [d for d in dirs if d not in ('.git', '.worktrees', 'node_modules')]
            if 'SKILL.md' in names:
                disabled.append(str(Path(folder)/'SKILL.md'))
    quote = lambda x: json.dumps(x, ensure_ascii=False)
    mapping = lambda d: '{' + ','.join(quote(k)+'='+quote(v) for k,v in d.items()) + '}'
    options = [
        'model_reasoning_effort='+quote(effort), 'project_doc_max_bytes=0',
        'web_search="disabled"', 'default_permissions="study"',
        'permissions.study.filesystem='+mapping(permissions), 'permissions.study.network.enabled=false',
        'agents.max_threads=1', 'agents.max_depth=0', 'shell_environment_policy.inherit="none"',
        'shell_environment_policy.set='+mapping({'PATH': '/usr/bin:/bin:'+str(NODE.parent), 'LANG': 'C.UTF-8',
           'TZ': 'UTC', 'GIT_OPTIONAL_LOCKS': '0', 'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_CONFIG_NOSYSTEM':'1',
           'PYTHONDONTWRITEBYTECODE': '1'}),
        'developer_instructions='+quote(guide),
        'skills.config=['+','.join('{path='+quote(path)+',enabled=false}' for path in sorted(set(disabled)))+']'
    ]
    user_config = Path.home()/'.codex/config.toml'
    if user_config.exists():
        for server in tomllib.loads(user_config.read_text()).get('mcp_servers', {}):
            options.append('mcp_servers.'+server+'.enabled=false')
    args = ['codex', '--no-daemon', '-a', 'never', '-m', model]
    for feature in ['memories','apps','plugins','multi_agent','multi_agent_v2','shell_snapshot','browser_use',
                    'browser_use_external','in_app_browser','in_app_chat','skill_search','hooks']:
        args += ['--disable', feature]
    for opt in options:
        args += ['-c', opt]
    return args

def visibility(work, args, prompt, mounted):
    p = subprocess.run([*args, 'debug', 'prompt-input', prompt], cwd=work, capture_output=True, check=True, timeout=90)
    rows = json.loads(p.stdout)
    texts = [v.get('text','') for row in rows for v in row.get('content',[]) if isinstance(v,dict)]
    body = '\n'.join(texts)
    catalog = [line[2:].split(': ',1)[0] for l in texts for line in l.splitlines() if line.startswith('- ') and '(file: ' in line]
    docs = {name: sha(data) for name,data in (payload(mounted) if mounted else {}).items()
            if (name=='SKILL.md' or (name.startswith('references/') and name.endswith('.md'))) and data.decode() in body}
    should = [n for n in (payload(mounted) if mounted else {}) if n=='SKILL.md' or n.startswith('references/') and n.endswith('.md')]
    effective = next((t for t in texts if '<permission_profile' in t), '')
    return {'promptInputSha256':sha(p.stdout),'catalog':catalog,'activeTextDelivered':docs,'allExpectedTexts':set(docs)==set(should),
            'namedTargetInControl':[] if mounted else [s for s in PACKAGE if s in body],
            'historyOrKeyInContext':any(s in body for s in ['individual-trials-20261122','registration.json','rubric.md','score-key.json','<MEMORY_SUMMARY>']),
            'toolNames':[s.get('name',s.get('type')) for row in rows for s in row.get('tools',[])],
            'restrictedProfile':'<special>:minimal</special>' in effective and '<special>:root</special>' not in effective,
            'userPromptPresent':prompt in texts or prompt in body, 'model':args[args.index('-m')+1]}

def sandbox(work, args, program, *values):
    p = subprocess.run([*args,'sandbox','-P','study','-C',str(work),'/usr/bin/python3','-c',program,*values],
                       cwd=work, capture_output=True, timeout=120)
    if p.returncode:
        raise RuntimeError('sandbox '+str(p.returncode)+': '+p.stderr.decode()[-1500:])
    return json.loads(p.stdout)

def isolation(work, args, target):
    registry = ROOT/'registration.json'
    if not registry.exists():
        registry = ROOT/'packages/manifest.json'
    checks = {'ownProject':work, 'ownTarget':work/'.agents/skills'/target/'SKILL.md',
              'mainCheckoutTarget':Path.home()/'.codex/skills/custom/skills'/target/'SKILL.md',
              'worktreeTarget':REPO/'skills'/target/'SKILL.md', 'archive':ROOT/'packages'/f"{target}-{PACKAGE[target]['version']}.tar.gz",
              'registration':registry,'rubric':ROOT/target/'rubric.md' if (ROOT/target/'rubric.md').is_file() else ROOT/'method/session.py',
              'otherWindow':work.parent/'peer'/'marker','hostSkillDirectory':Path.home()/'.codex/skills',
              'hostHistory':Path.home()/'.codex/sessions','hostConfig':Path.home()/'.codex/config.toml',
              'procRootSource':'/proc/self/root'+str(REPO/'skills'/target/'SKILL.md')}
    assert all(Path(v).exists() for k,v in checks.items() if k not in ('ownTarget','procRootSource'))
    probe = """import json,os,sys,socket
paths=json.loads(sys.argv[1])
def read(path):
 try:
  if os.path.isdir(path): os.listdir(path)
  else:
   with open(path,'rb') as f: f.read(1)
  return True
 except OSError: return False
try:
 s=socket.socket(socket.AF_INET,socket.SOCK_STREAM); s.close(); net=True
except OSError: net=False
print(json.dumps({'readable':{k:read(v) for k,v in paths.items()},'projectWritable':os.access(os.getcwd(),os.W_OK),'inetSocket':net}))"""
    return sandbox(work, args, probe, json.dumps({k:str(v) for k,v in checks.items()}))

def valid(delivery, physical, mounted):
    assert delivery['catalog'] == ([mounted] if mounted else []), delivery
    assert delivery['allExpectedTexts'] and delivery['restrictedProfile'] and delivery['userPromptPresent'],delivery
    assert not delivery['namedTargetInControl'] and not delivery['historyOrKeyInContext'], delivery
    reads = physical['readable'].copy()
    assert reads.pop('ownProject') and reads.pop('ownTarget') == bool(mounted), physical
    assert not any(reads.values()) and not physical['projectWritable'] and not physical['inetSocket'],physical

def window(parent):
    work = Path(parent)/'project'
    work.mkdir()
    peer = work.parent/'peer'
    peer.mkdir()
    (peer/'marker').write_text('private')
    return work

def execute(work, args, prompt, receipt, timeout=480):
    answer = receipt/'answer.md'
    handed = now()
    with tempfile.TemporaryFile() as logs, tempfile.TemporaryFile() as err:
        try:
            proc=subprocess.run([*args,'exec','--ephemeral','--skip-git-repo-check','-C',str(work),'--json',
                                 '--output-last-message',str(answer),'-'],cwd=work,input=prompt.encode(),stdout=logs,stderr=err,timeout=timeout)
            status=proc.returncode
        except subprocess.TimeoutExpired:
            status=124
        ended=now()
        logs.seek(0); raw=logs.read()
        err.seek(0); stderr=err.read()
    (receipt/'events.jsonl.gz').write_bytes(gzip.compress(raw,mtime=0))
    events=[json.loads(line) for line in raw.splitlines() if line.strip()]
    return {'handed':handed,'finished':ended,'exit':status,'thread':next((e.get('thread_id') for e in events if e.get('type')=='thread.started'),None),
            'eventsSha256':sha(raw),'events':len(events),'stderrSha256':sha(stderr),'stderrLines':len(stderr.splitlines()),
            'lastEvent':events[-1]['type'] if events else None,'answerSha256':sha(answer.read_bytes()) if answer.exists() else None}
