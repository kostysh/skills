"""Read Git internals in an already copied neutral project using optional-lock-free Git."""
from pathlib import Path
import json, hashlib, os, subprocess, sys

def snapshot(root):
    root=Path(root).resolve()
    mirror=(root/'mirror/.git').resolve()
    assert mirror.is_relative_to(root) and mirror.is_dir()
    env=dict(os.environ,GIT_OPTIONAL_LOCKS='0',GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL='/dev/null')
    def g(repo,*args):
        return subprocess.check_output(['git','-C',str(repo),*args],env=env).decode().rstrip('\n')
    def path(repo,*args):
        return Path(g(repo,*args)).resolve().relative_to(root).as_posix()
    def refs(repo):
        return dict(n.split(' ',1) for n in g(repo,'for-each-ref','--format=%(refname) %(objectname)').splitlines())
    trees={}
    for name in ['desk','annex']:
        repo=root/name
        common=path(repo,'rev-parse','--path-format=absolute','--git-common-dir')
        gd=path(repo,'rev-parse','--absolute-git-dir')
        top=path(repo,'rev-parse','--show-toplevel')
        assert common=='desk/.git' and top==name
        assert gd==('desk/.git' if name=='desk' else 'desk/.git/worktrees/annex')
        assert not (root/common/'objects/info/alternates').exists()
        origin=g(repo,'remote','get-url','origin')
        assert (repo/origin).resolve()==mirror and (repo/g(repo,'remote','get-url','--push','origin')).resolve()==mirror
        assert set(g(repo,'remote').splitlines())=={'origin'}
        assert set(x[9:] for x in g(repo,'worktree','list','--porcelain','-z').split('\0') if x.startswith('worktree '))=={str(root/'desk'),str(root/'annex')}
        tree={}; index={}
        for entry in g(repo,'ls-tree','-r','HEAD').splitlines():
            info,rel=entry.split('\t',1); mode,kind,oid=info.split();tree[rel]={'mode':mode,'oid':oid}
        for entry in g(repo,'ls-files','--stage').splitlines():
            info,rel=entry.split('\t',1); mode,oid,stage=info.split();index[rel]={'mode':mode,'oid':oid,'stage':stage}
        working={}
        for f in sorted(repo.rglob('*')):
            rel=f.relative_to(repo)
            if '.git' not in rel.parts and f.is_file():
                data=f.read_bytes()
                blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\x00'+data).hexdigest()
                working[rel.as_posix()]={'mode':format(f.stat().st_mode & 0o7777,'04o'),'oid':blob,'sha256':hashlib.sha256(data).hexdigest()}
        trees[name]={'branch':g(repo,'symbolic-ref','HEAD'),'head':g(repo,'rev-parse','HEAD'),'parents':g(repo,'show','-s','--format=%P','HEAD').split(),'head_tree':tree,'index':index,'files':working,'status':g(repo,'status','--porcelain=v1','--untracked-files=all').splitlines(),'git_dir':gd,'git_common_dir':common,'origin':origin,'worktrees':sorted([str('desk'),str('annex')])}
    assert not (mirror/'objects/info/alternates').exists() and g(mirror,'rev-parse','--is-bare-repository')=='true'
    return {'git':g(root/'desk','--version'),'remote_refs':refs(mirror),'local_refs':refs(root/'desk'),'checkout':trees}

if __name__=='__main__':
    if sys.argv[1]=='pre':
        actual=snapshot(sys.argv[2]); baseline=snapshot(sys.argv[3])
        assert actual==baseline,'transferred repository differs from its source'
        out=Path(sys.argv[4]);out.write_text(json.dumps(actual,indent=2,ensure_ascii=False)+'\n')
    elif sys.argv[1]=='post':
        receipt=Path(sys.argv[2])
        project=Path(json.loads((receipt/'dispatch.json').read_text())['project'])
        before=json.loads((receipt/'git-before.json').read_text());after=snapshot(project)
        (receipt/'observer.json').write_text(json.dumps({'method':'GIT_OPTIONAL_LOCKS=0; freshly read both worktrees, branch refs and local bare remote. Before equals independent original. Physical paths are reported relative to the new project. The file contents and actor names are synthetic.','before':before,'after':after},indent=2,ensure_ascii=False)+'\n')
