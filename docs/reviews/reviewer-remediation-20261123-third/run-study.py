"""Issue the preassigned third round using the unchanged R3 subjects and judges."""
from concurrent.futures import ThreadPoolExecutor
import importlib.util
import runpy
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
SECOND = HERE.parent / "reviewer-remediation-20261123-second"
FIRST = HERE.parent / "reviewer-remediation-20261123"
INITIAL = HERE.parent / "individual-trials-20261122"
SELF = Path(__file__).resolve()
SKILL = "code-reviewer"
VERSIONS = ("0.4.12", "0.4.11")
CASES = ("original", "fresh", "transfer")
spec = importlib.util.spec_from_file_location("previous_round", SECOND / "run-study.py")
prior = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prior)
study, native = prior.study, prior.native
read, write, digest = study.read, study.write, study.digest


def methods():
    paths = [SELF, SECOND / "run-study.py", FIRST / "study.py", FIRST / "prepare-packets.py"]
    paths += [INITIAL / "method" / name for name in ("session.py", "assess.py", "grading-instructions.md")]
    return {p.relative_to(REPO).as_posix(): digest(p) for p in paths}


def select(skill, version):
    assert skill == SKILL and version in VERSIONS
    src = HERE if version == VERSIONS[0] else SECOND
    native.ROOT, native.PACKAGE = src, read(src / "packages/manifest.json")["packages"]
    assert native.PACKAGE[skill]["version"] == version


def verify(work, args, prompt, skill, mounted):
    facts = prior.original_window_check(work, args, prompt, skill, mounted)
    files = [HERE / "packages" / f"{skill}-{VERSIONS[0]}.tar.gz",
             SECOND / "packages" / f"{skill}-{VERSIONS[1]}.tar.gz",
             SECOND / "registration.json", SECOND / skill / "rubric.md",
             SECOND / skill / "runs/f93a6d71fd73/answer.md", FIRST / skill / "audit/signed.json"]
    assert all(f.is_file() for f in files)
    accessible = native.sandbox(work, args, "import os,json,sys; print(json.dumps([os.access(p,os.R_OK) for p in sys.argv[1:]]))", *map(str, files))
    assert accessible == [False] * len(files)
    return {**facts, "candidateAndBaselineArchivesDenied": True, "earlierKeysAndRunsDenied": True}


prior.ROOT, prior.VERSIONS, prior.select = HERE, VERSIONS, select
study.ROOT, study.VERSIONS = HERE, {SKILL: VERSIONS}
study.selection, study.verify_window, study.numbered_scripts = select, verify, methods


def register(archive):
    frozen = read(HERE / "pre-edit.json")
    assert frozen["protocol"]["sha256"] == digest(HERE / "protocol.md")
    sealed = frozen["skills"][SKILL]
    for key in ("baseline", "R1", "R2", "R3"):
        assert digest(REPO / sealed[key]["path"]) == sealed[key]["sha256"]
    assert digest(HERE / SKILL / "rubric.md") == sealed["R3"]["sha256"]
    catalog = read(archive.parent / "catalog.json")
    current = next(entry for entry in catalog["skills"] if entry["name"] == SKILL)
    assert archive.name == f"{SKILL}-{VERSIONS[0]}.tgz" and current["version"] == VERSIONS[0]
    assert digest(archive) == current["sha256"]
    with tarfile.open(archive, "r:gz") as packed:
        files = {f.name: native.sha(packed.extractfile(f).read()) for f in packed if f.isfile()}
    assert files and all(not Path(k).is_absolute() and ".." not in Path(k).parts for k in files)
    assert all(digest(REPO / "skills" / SKILL / k) == v for k, v in files.items())
    dest = HERE / "packages" / f"{SKILL}-{VERSIONS[0]}.tar.gz"
    dest.parent.mkdir(exist_ok=True)
    assert not dest.exists()
    shutil.copyfile(archive, dest)
    write(dest.parent / "manifest.json", {"release": catalog["release"], "packages": {SKILL: {
        "version": VERSIONS[0], "sha256": digest(dest), "contentHash": current["contentHash"], "files": files}},
        "previousManifest": (SECOND / "packages/manifest.json").relative_to(REPO).as_posix()})
    previous = read(SECOND / "registration.json")["skills"][SKILL]
    cases = previous["cases"]
    for case in CASES:
        material = study.resolved_case(SKILL, case)
        assert native.tree(material) == sealed[case]["files"]
        assert cases[case]["prompt"] == digest(material / "task.md")
        assert cases[case]["project"] == native.tree(material / "project")
    reg = {k: frozen[k] for k in ("base", "models", "assignments", "executionOrder", "gradingOrder",
                                   "doubleRating", "rubric", "packet", "phase")}
    reg.update({"utc": native.now(), "method": methods(), "protocol": frozen["protocol"]["sha256"],
                "casesFrozen": digest(HERE / "pre-edit.json"),
                "skills": {SKILL: {"rubric": sealed["R3"]["sha256"], "cases": cases,
                                   "archives": {VERSIONS[0]: digest(dest), VERSIONS[1]: sealed["baseline"]["sha256"]}}},
                "cli": subprocess.check_output(["codex", "--version"], text=True, stderr=subprocess.DEVNULL).strip()})
    write(HERE / "registration.json", reg)


def packets():
    runpy.run_path(str(FIRST / "prepare-packets.py"))
    reg = study.read_registration()
    rows = reg["assignments"]
    records = {}
    for run_id, row in rows.items():
        p = HERE / SKILL / "assessments/packets" / (row["label"] + ".json")
        raw = p.read_text()
        assert all(word not in raw for word in (*VERSIONS, *rows, str(REPO), SKILL, "local-review-"))
        assert read(p)["label"] == row["label"]
        records[p.relative_to(HERE).as_posix()] = digest(p)
    write(HERE / "packet-verification.json", {"utc": native.now(),
          "method": "Нейтрализованы технические чтения пакета и адреса временной среды; проверено отсутствие ключа, версии, run ID и пути рабочего дерева.", "packets": records})


def jobs(commands):
    def execute(args):
        return subprocess.run([sys.executable, "-B", str(SELF), *args], check=False).returncode
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(execute, commands))
    assert not any(results), results


if __name__ == "__main__":
    stage, *args = sys.argv[1:]
    if stage == "register":
        register(Path(args[0]))
    elif stage == "run":
        study.dispatch(*args)
    elif stage == "run-all":
        jobs([("run", ident) for ident in study.read_registration()["executionOrder"]])
    elif stage == "packets":
        packets()
    elif stage == "judge":
        prior.judge(*args)
    elif stage == "judge-all":
        jobs([("judge","first"),("judge","second")])
    elif stage == "seal":
        study.seal()
    else:
        raise SystemExit(stage)
