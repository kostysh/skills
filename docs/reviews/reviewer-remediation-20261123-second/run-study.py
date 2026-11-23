"""Run the three-case re-audit using the preceding study's isolated runner."""
import concurrent.futures
import runpy
import secrets
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
FIRST = ROOT.parent / "reviewer-remediation-20261123"
ORIGINAL = ROOT.parent / "individual-trials-20261122"
sys.path.insert(0, str(FIRST))
import study

native, sha, digest, read, write, tree = study.native, study.sha, study.digest, study.read, study.write, study.tree
SKILL = "code-reviewer"
VERSIONS = ("0.4.11", "0.4.10")
CASES = ("original", "fresh", "transfer")
study.ROOT = ROOT
study.VERSIONS = {SKILL: VERSIONS}


def methods():
    files = [Path(__file__).resolve(), FIRST / "study.py", FIRST / "prepare-packets.py"]
    files.extend(ORIGINAL / "method" / name for name in ("session.py", "assess.py", "grading-instructions.md"))
    return {f.relative_to(REPO).as_posix(): digest(f) for f in files}


def select(skill, version):
    assert skill == SKILL and version in VERSIONS
    root = ROOT if version == VERSIONS[0] else FIRST
    native.ROOT, native.PACKAGE = root, read(root / "packages/manifest.json")["packages"]
    assert native.PACKAGE[skill]["version"] == version


study.numbered_scripts = methods
study.selection = select
original_window_check = study.verify_window


def verify_window(work,args,prompt,skill,mounted):
    observed = original_window_check(work,args,prompt,skill,mounted)
    paths = [root/"packages"/f"{skill}-{version}.tar.gz" for root,version in zip((ROOT,FIRST),VERSIONS)]
    paths.extend([ROOT/skill/"rubric.md", ROOT/"pre-edit.json", FIRST/skill/"rubric.md",
                  FIRST/skill/"runs/05cdb5d86753/answer.md", ORIGINAL/skill/"audit/signed.json"])
    assert all(p.is_file() for p in paths)
    denied = native.sandbox(work,args,"import json,os,sys; print(json.dumps([os.access(p,os.R_OK) for p in sys.argv[1:]]))",*map(str,paths))
    assert denied == [False]*len(paths)
    return {**observed,"candidateAndBaselineArchivesDenied":True,"currentAndEarlierEvidenceDenied":True}


study.verify_window = verify_window


def register(archive):
    manifest = read(archive.parent / "catalog.json")
    current = next(r for r in manifest["skills"] if r["name"] == SKILL)
    sealer = read(ROOT / "pre-edit.json")
    frozen = sealer["skills"][SKILL]
    assert VERSIONS[0] == current["version"] and digest(archive) == current["sha256"]
    assert archive.name == f"{SKILL}-{VERSIONS[0]}.tgz"
    assert digest(ROOT/"protocol.md") == sealer["protocol"]["sha256"]
    for field in ("R1", "R2", "R3", "baseline"):
        assert digest(REPO / frozen[field]["path"]) == frozen[field]["sha256"]
    previous = read(FIRST/"packages/manifest.json")["packages"][SKILL]
    assert previous["version"] == VERSIONS[1] and previous["sha256"] == frozen["baseline"]["sha256"]
    with tarfile.open(archive, "r:gz") as packed:
        files = {f.name: sha(packed.extractfile(f).read()) for f in packed if f.isfile()}
    assert all(digest(REPO/"skills"/SKILL/k) == v for k,v in files.items())
    assert all(not Path(k).is_absolute() and ".." not in Path(k).parts for k in files)
    dest = ROOT / "packages" / f"{SKILL}-{VERSIONS[0]}.tar.gz"
    dest.parent.mkdir(exist_ok=True)
    assert not dest.exists()
    shutil.copyfile(archive, dest)
    write(dest.parent/"manifest.json", {"release":manifest["release"], "packages":{SKILL:{
          "version":VERSIONS[0], "sha256":digest(dest), "contentHash":current["contentHash"], "files":files}},
          "previousManifest": (FIRST/"packages/manifest.json").relative_to(REPO).as_posix()})
    assignments, cases = {}, {}
    for case in CASES:
        material = study.resolved_case(SKILL,case)
        assert tree(material) == frozen[case]["files"]
        cases[case] = {"prompt":digest(material/"task.md"), "project":tree(material/"project"),
                       "criteria":"R3" if case == "transfer" else "R2"}
        for version in VERSIONS:
            assignments[secrets.token_hex(6)] = {"skill":SKILL, "case":case, "pair":case+"-1",
                              "variant":version, "label":secrets.token_hex(5)}
    rng = secrets.SystemRandom()
    assert len(assignments) == len({r["label"] for r in assignments.values()}) == 6
    execute, grade = list(assignments), list(assignments)
    rng.shuffle(execute)
    rng.shuffle(grade)
    reg = {"utc":native.now(), "base":sealer["base"], "method":methods(), "protocol":digest(ROOT/"protocol.md"),
           "casesFrozen":digest(ROOT/"pre-edit.json"), "rubric":"R3", "packet":"P3", "phase":"confirmation",
           "skills":{SKILL:{"rubric":frozen["R3"]["sha256"], "cases":cases,
                             "archives":{VERSIONS[0]:digest(dest),VERSIONS[1]:previous["sha256"]}}},
           "models":study.MODELS, "assignments":assignments, "doubleRating":{SKILL:rng.choice(execute)},
           "executionOrder":execute, "gradingOrder":grade,
           "cli":subprocess.check_output(["codex","--version"],text=True,stderr=subprocess.DEVNULL).strip()}
    write(ROOT/"registration.json",reg)


def copy_inputs(skill, work):
    for case in CASES:
        shutil.copytree(study.resolved_case(skill,case),work/"inputs"/case)
    frozen = read(ROOT/"pre-edit.json")["skills"][skill]
    for field, name in (("R1","origin-criteria.md"),("R2","previous-criteria.md"),("R3","criteria.md")):
        shutil.copyfile(REPO/frozen[field]["path"], work/name)


def judge(role):
    reg = study.read_registration()
    select(SKILL, VERSIONS[0])
    ids = reg["gradingOrder"] if role == "first" else [reg["doubleRating"][SKILL]]
    labels = [reg["assignments"][i]["label"] for i in ids]
    assessor = role + "-" + sha((reg["utc"]+SKILL+role).encode())[:8]
    receipt = ROOT / SKILL / "assessments" / role
    receipt.mkdir(exist_ok=False)
    guide = (ORIGINAL/"method/grading-instructions.md").read_text().replace("R1","R3").replace("P1","P3")
    prompt = (guide+"\nНазначение "+assessor+". Работы в порядке "+", ".join(labels)+
              ". В criteria.md общие условия и M-56 (transfer). Для P-84 (original) и F-31 (fresh) "
              "применяй предыдущие условия и K из previous-criteria.md. Исходная R1 в origin-criteria.md. "
              "Все три выгрузки под inputs. Требуется отдельное решение для каждой указанной метки.")
    with tempfile.TemporaryDirectory(prefix="local-review-") as tmp:
        work = native.window(tmp)
        copy_inputs(SKILL,work)
        for label in labels:
            shutil.copyfile(receipt.parent/"packets"/(label+".json"),work/(label+".json"))
        args = native.flags(work,*study.MODELS["reviewer"],native.COMMON)
        delivery = study.verify_window(work,args,prompt,SKILL,None)
        files = tree(work)
        write(receipt/"delivery.json", {"utc":native.now(), "assessor":assessor, "labels":labels, "packetFiles":files,
              "model":study.MODELS["reviewer"][0], "effort":study.MODELS["reviewer"][1], "prompt":prompt, **delivery})
        result = native.execute(work,args,prompt,receipt)
        write(receipt/"result.json",{**result,"projectChanged":tree(work)!=files})
        assert result["exit"]==0 and result["lastEvent"]=="turn.completed" and tree(work)==files
        signed = study.unwrap(receipt/"answer.md")
        assert signed["assessor"]==assessor and sorted(r["label"] for r in signed["ratings"])==sorted(labels)
        for r in signed["ratings"]:
            assert r["score"] in ("PASS","FAIL","INCONCLUSIVE") and r["behavior"] in ("done","missed","unknown")
            assert r["reason"] and r["behaviorReason"]
        write(receipt/"signed.json",{**signed,"signedUtc":result["finished"],"answerSha256":result["answerSha256"]})
        print(assessor,len(labels),result["finished"],flush=True)


def jobs(rows):
    def launch(row):
        return subprocess.run([sys.executable,"-B",__file__,*row],check=False).returncode
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        codes=list(pool.map(launch,rows))
    assert not any(codes), codes


if __name__ == "__main__":
    stage, *args = sys.argv[1:]
    if stage=="register":
        register(Path(args[0]))
    elif stage=="run":
        study.dispatch(*args)
    elif stage=="run-all":
        jobs([("run",i) for i in study.read_registration()["executionOrder"]])
    elif stage=="packets":
        runpy.run_path(str(FIRST/"prepare-packets.py"))
    elif stage=="judge-all":
        jobs([("judge","first"),("judge","second")])
    elif stage=="judge":
        judge(*args)
    elif stage=="seal":
        study.seal()
    else:
        raise SystemExit("unknown stage")
