"""Use the existing native runner for the four preassigned R4 pairs."""
import importlib.util
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

SELF = Path(__file__).resolve()
HERE = SELF.parent
THIRD = HERE.parent / "reviewer-remediation-20261123-third"
spec = importlib.util.spec_from_file_location("round_three", THIRD / "run-study.py")
third = importlib.util.module_from_spec(spec)
spec.loader.exec_module(third)
REPO, SECOND, FIRST, INITIAL = third.REPO, third.SECOND, third.FIRST, third.INITIAL
study, native = third.study, third.native
read, write, digest = study.read, study.write, study.digest
SKILL = "code-reviewer"
CASES = ("original", "fresh", "transfer", "schedule")
VERSIONS = ("0.4.13", "0.4.12")
CRITERIA = {"R1": "origin-criteria.md", "R2": "previous-criteria.md",
            "R3": "transfer-criteria.md", "R4": "criteria.md"}
previous_methods = third.methods()


def methods():
    return {**previous_methods, SELF.relative_to(REPO).as_posix(): digest(SELF)}


def select(skill, version):
    assert skill == SKILL and version in VERSIONS
    parent = HERE if version == VERSIONS[0] else THIRD
    native.ROOT, native.PACKAGE = parent, read(parent / "packages/manifest.json")["packages"]
    assert native.PACKAGE[skill]["version"] == version


def verify(work, args, prompt, skill, mounted):
    facts = third.prior.original_window_check(work, args, prompt, skill, mounted)
    paths = [HERE / "packages" / f"{skill}-{VERSIONS[0]}.tar.gz",
             THIRD / "packages" / f"{skill}-{VERSIONS[1]}.tar.gz",
             THIRD / "registration.json", THIRD / skill / "runs/bcbd25d84b5e/answer.md",
             SECOND / skill / "rubric.md", FIRST / skill / "audit/signed.json"]
    assert all(p.is_file() for p in paths)
    reads = native.sandbox(work, args, "import os,json,sys; print(json.dumps([os.access(p,os.R_OK) for p in sys.argv[1:]]))", *map(str, paths))
    assert reads == [False] * len(paths)
    return {**facts, "candidateAndBaselineArchivesDenied": True, "earlierKeysAndRunsDenied": True}


def configure():
    study.ROOT, study.VERSIONS = HERE, {SKILL: VERSIONS}
    study.selection, study.verify_window, study.numbered_scripts = select, verify, methods
    third.HERE, third.SELF, third.VERSIONS = HERE, SELF, VERSIONS


configure()


def register(archive):
    frozen = read(HERE / "pre-edit.json")
    sealed = frozen["skills"][SKILL]
    assert frozen["protocol"]["sha256"] == digest(HERE / "protocol.md")
    for key in (*CRITERIA, "baseline"):
        assert digest(REPO / sealed[key]["path"]) == sealed[key]["sha256"]
    catalog = read(archive.parent / "catalog.json")
    candidate, baseline = VERSIONS
    entry = next(s for s in catalog["skills"] if s["name"] == SKILL)
    assert archive.name == f"{SKILL}-{candidate}.tgz" and entry["version"] == candidate
    assert digest(archive) == entry["sha256"]
    with tarfile.open(archive, "r:gz") as opened:
        files = {f.name: native.sha(opened.extractfile(f).read()) for f in opened if f.isfile()}
    assert files and all(not Path(k).is_absolute() and ".." not in Path(k).parts for k in files)
    assert all(digest(REPO / "skills" / SKILL / k) == val for k, val in files.items())
    old = read(THIRD / "packages/manifest.json")["packages"][SKILL]
    assert old["version"] == baseline and old["sha256"] == sealed["baseline"]["sha256"]
    cases = {}
    old_cases = read(THIRD / "registration.json")["skills"][SKILL]["cases"]
    for case in CASES:
        material = study.resolved_case(SKILL, case)
        assert native.tree(material) == sealed[case]["files"]
        row = {"prompt": digest(material / "task.md"), "project": native.tree(material / "project")}
        if case in old_cases:
            assert all(old_cases[case][k] == v for k, v in row.items())
        cases[case] = {**row, "criteria": {"original": "R2", "fresh": "R2", "transfer": "R3", "schedule": "R4"}[case]}
    dest = HERE / "packages" / f"{SKILL}-{candidate}.tar.gz"
    dest.parent.mkdir(exist_ok=True)
    assert not dest.exists()
    shutil.copyfile(archive, dest)
    write(dest.parent / "manifest.json", {"release": catalog["release"], "packages": {SKILL: {
        "version": candidate, "sha256": digest(dest), "contentHash": entry["contentHash"], "files": files}},
        "previousManifest": (THIRD / "packages/manifest.json").relative_to(REPO).as_posix()})
    reg = {k: frozen[k] for k in ("base", "models", "assignments", "executionOrder", "gradingOrder",
                                   "doubleRating", "rubric", "packet", "phase")}
    assert reg["models"] == study.MODELS and len(reg["assignments"]) == 8
    write(HERE / "registration.json", {**reg, "utc": native.now(), "method": methods(),
          "protocol": frozen["protocol"]["sha256"], "casesFrozen": digest(HERE / "pre-edit.json"),
          "skills": {SKILL: {"rubric": sealed["R4"]["sha256"], "cases": cases,
                            "archives": {candidate: digest(dest), baseline: old["sha256"]}}},
          "cli": subprocess.check_output(["codex", "--version"], text=True, stderr=subprocess.DEVNULL).strip()})


def copy_inputs(skill, work):
    frozen = read(HERE / "pre-edit.json")["skills"][skill]
    for case in CASES:
        shutil.copytree(study.resolved_case(skill, case), work / "inputs" / case)
    for key, name in CRITERIA.items():
        shutil.copyfile(REPO / frozen[key]["path"], work / name)


def judge(role):
    assert role in ("first", "second", "adjudicator")
    reg = study.read_registration()
    select(SKILL, VERSIONS[0])
    ids = reg["gradingOrder"] if role == "first" else [reg["doubleRating"][SKILL]]
    labels = [reg["assignments"][i]["label"] for i in ids]
    assessor = role + "-" + native.sha((reg["utc"] + SKILL + role).encode())[:8]
    guide = (INITIAL / "method/grading-instructions.md").read_text().replace("R1","R4").replace("P1","P4")
    prompt = (guide + "\nНазначение " + assessor + ". Порядок работ " + ", ".join(labels) +
              ". Условия R4 в criteria.md, ссылки на три прежних критерия с названиями локальных файлов в первом абзаце. Проекты в inputs. Дай отдельное решение для каждой указанной метки.")
    receipt = HERE / SKILL / "assessments" / role
    receipt.mkdir(exist_ok=False)
    with tempfile.TemporaryDirectory(prefix="local-review-") as tmp:
        work = native.window(tmp)
        copy_inputs(SKILL, work)
        for label in labels:
            shutil.copyfile(receipt.parent / "packets" / (label + ".json"), work / (label + ".json"))
        args = native.flags(work, *study.MODELS["reviewer"], native.COMMON)
        checks = verify(work, args, prompt, SKILL, None)
        before = native.tree(work)
        write(receipt / "delivery.json", {"utc": native.now(), "assessor": assessor, "labels": labels,
              "packetFiles": before, "model": study.MODELS["reviewer"][0], "effort": study.MODELS["reviewer"][1],
              "prompt": prompt, **checks})
        result = native.execute(work, args, prompt, receipt)
        changed = native.tree(work) != before
        write(receipt / "result.json", {**result, "projectChanged": changed})
        assert result["exit"] == 0 and result["lastEvent"] == "turn.completed" and not changed
        scores = study.unwrap(receipt / "answer.md")
        assert scores["assessor"] == assessor and sorted(r["label"] for r in scores["ratings"]) == sorted(labels)
        for r in scores["ratings"]:
            assert r["score"] in ("PASS", "FAIL", "INCONCLUSIVE") and r["behavior"] in ("done", "missed", "unknown")
            assert r["reason"] and r["behaviorReason"]
        write(receipt / "signed.json", {**scores, "signedUtc": result["finished"], "answerSha256": result["answerSha256"]})
        print(assessor, len(labels), result["finished"], flush=True)


if __name__ == "__main__":
    stage, *args = sys.argv[1:]
    if stage == "register":
        register(Path(args[0]))
    elif stage == "run":
        study.dispatch(*args)
    elif stage == "run-all":
        third.jobs([("run", ident) for ident in study.read_registration()["executionOrder"]])
    elif stage == "packets":
        third.packets()
    elif stage == "judge":
        judge(*args)
    elif stage == "judge-all":
        third.jobs([("judge", "first"), ("judge", "second")])
    elif stage == "seal":
        study.seal()
    else:
        raise SystemExit(stage)
