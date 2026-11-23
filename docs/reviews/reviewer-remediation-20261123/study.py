"""Run this evidence series from its frozen inputs using the November 22 isolation primitives."""
import concurrent.futures
import gzip
import json
import re
import secrets
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
PRIOR = ROOT.parent / "individual-trials-20261122"
sys.path.insert(0, str(PRIOR / "method"))
import session as native
from session import now, sha, tree, write

VERSIONS = {"code-reviewer": ("0.4.10", "0.4.9"), "spec-conformance-reviewer": ("0.1.12", "0.1.11")}
MODELS = {"executor": ["gpt-6.2-sol", "medium"], "reviewer": ["gpt-6.2-astra", "high"]}


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return sha(path.read_bytes())


def numbered_scripts():
    return {p.relative_to(REPO).as_posix(): digest(p) for p in
            [ROOT / "study.py", PRIOR / "method/session.py", PRIOR / "method/assess.py", PRIOR / "method/grading-instructions.md"]}


def resolved_case(skill, case):
    return REPO / read(ROOT / "pre-edit.json")["skills"][skill][case]["path"]


def register(package_directory):
    frozen = read(ROOT / "pre-edit.json")
    catalog = read(package_directory / "catalog.json")
    latest = {row["name"]: row for row in catalog["skills"]}
    baseline = read(PRIOR / "packages/manifest.json")["packages"]
    packages = {}
    tasks = {}
    assignments = {}
    doubles = {}
    rng = secrets.SystemRandom()
    for skill, (candidate, previous) in VERSIONS.items():
        sealed = frozen["skills"][skill]
        assert candidate == latest[skill]["version"] and previous == baseline[skill]["version"]
        for field in ("baseline", "R1", "R2"):
            assert digest(REPO / sealed[field]["path"]) == sealed[field]["sha256"]
        archive = package_directory / f"{skill}-{candidate}.tgz"
        archive_sha = digest(archive)
        assert archive_sha == latest[skill]["sha256"]
        with tarfile.open(archive, "r:gz") as opened:
            files = {m.name: sha(opened.extractfile(m).read()) for m in opened if m.isfile()}
        for name, file_sha in files.items():
            assert digest(REPO / "skills" / skill / name) == file_sha
        kept = ROOT / "packages" / f"{skill}-{candidate}.tar.gz"
        kept.parent.mkdir(exist_ok=True)
        assert not kept.exists()
        shutil.copyfile(archive, kept)
        packages[skill] = {"version": candidate, "sha256": archive_sha,
                          "contentHash": latest[skill]["contentHash"], "files": files}
        cases = {}
        ids = []
        for case in ("original", "fresh"):
            material = resolved_case(skill, case)
            assert tree(material) == sealed[case]["files"]
            cases[case] = {"prompt": digest(material / "task.md"), "project": tree(material / "project")}
            for version in (candidate, previous):
                ident = secrets.token_hex(6)
                ids.append(ident)
                assignments[ident] = {"skill": skill, "case": case, "pair": f"{case}-1",
                                      "variant": version, "label": secrets.token_hex(5)}
        tasks[skill] = {"rubric": sealed["R2"]["sha256"], "cases": cases,
                        "archives": {candidate: archive_sha, previous: baseline[skill]["sha256"]}}
        doubles[skill] = rng.choice(ids)
    write(ROOT / "packages/manifest.json", {"release": catalog["release"], "packages": packages})
    order = list(assignments)
    rng.shuffle(order)
    score_order = order.copy()
    rng.shuffle(score_order)
    write(ROOT / "registration.json",
          {"utc": now(), "base": frozen["base"], "method": numbered_scripts(), "protocol": digest(ROOT/"protocol.md"),
           "casesFrozen": digest(ROOT/"pre-edit.json"), "rubric": "R2", "packet": "P2", "skills": tasks,
           "models": MODELS, "assignments": assignments, "doubleRating": doubles,
           "executionOrder": order, "gradingOrder": score_order,
           "cli": subprocess.check_output(["codex", "--version"], text=True, stderr=subprocess.DEVNULL).strip()})


def read_registration():
    reg = read(ROOT / "registration.json")
    assert numbered_scripts() == reg["method"] and digest(ROOT/"protocol.md") == reg["protocol"]
    assert digest(ROOT/"pre-edit.json") == reg["casesFrozen"]
    return reg


def selection(skill, version):
    source = ROOT if version == VERSIONS[skill][0] else PRIOR
    native.ROOT = source
    native.PACKAGE = read(source / "packages/manifest.json")["packages"]


def verify_window(work, args, prompt, skill, mounted):
    startup = native.visibility(work, args, prompt, mounted)
    physical = native.isolation(work, args, skill)
    native.valid(startup, physical, mounted)
    paths = [ROOT / "registration.json", ROOT / skill / "rubric.md", ROOT / "pre-edit.json",
             PRIOR / skill / "audit/signed.json"]
    assert all(p.is_file() for p in paths)
    denied = native.sandbox(work, args, "import json,os,sys; print(json.dumps([os.access(p,os.R_OK) for p in sys.argv[1:]]))", *map(str, paths))
    assert denied == [False] * len(paths)
    return {"startup": startup, "access": physical, "privateSourcesDenied": True}


def dispatch(ident):
    reg = read_registration()
    row = reg["assignments"][ident]
    skill, case, version = row["skill"], row["case"], row["variant"]
    material = resolved_case(skill, case)
    expected = reg["skills"][skill]["cases"][case]
    assert tree(material / "project") == expected["project"] and digest(material / "task.md") == expected["prompt"]
    selection(skill, version)
    assert native.PACKAGE[skill]["sha256"] == reg["skills"][skill]["archives"][version]
    receipt = ROOT / skill / "runs" / ident
    receipt.mkdir(parents=True, exist_ok=False)
    prompt = (material / "task.md").read_text()
    with tempfile.TemporaryDirectory(prefix="local-review-") as tmp:
        work = native.window(tmp)
        shutil.copytree(material / "project", work, dirs_exist_ok=True)
        native.install(work, skill)
        before = tree(work)
        args = native.flags(work, *MODELS["executor"], native.instructions(skill))
        delivery = verify_window(work, args, prompt, skill, skill)
        write(receipt / "delivery.json", {"utc": now(), "workdir": str(work), "registration": digest(ROOT/"registration.json"),
              "model": MODELS["executor"][0], "effort": MODELS["executor"][1], "projectSha256": expected["project"],
              "promptSha256": expected["prompt"], "installed": native.PACKAGE[skill]["files"], **delivery})
        result = native.execute(work, args, prompt, receipt)
        after = tree(work)
        result["changed"] = sorted(k for k in before.keys() | after.keys() if before.get(k) != after.get(k))
        write(receipt / "result.json", result)
        print(ident, skill, case, result["exit"], result["lastEvent"], flush=True)


def packets():
    import assess
    reg = read_registration()
    assess.ROOT, assess.REG = ROOT, reg
    for ident in reg["gradingOrder"]:
        assess.make_packet(ident)
        row = reg["assignments"][ident]
        packet = ROOT / row["skill"] / "assessments/packets" / (row["label"] + ".json")
        content = packet.read_text()
        assert all(version not in content for version in VERSIONS[row["skill"]]), row["label"]


def copy_inputs(skill, work):
    for case in ("original", "fresh"):
        shutil.copytree(resolved_case(skill, case), work / "inputs" / case)
    shutil.copyfile(ROOT / skill / "rubric.md", work / "criteria.md")
    shutil.copyfile(PRIOR / skill / "rubric.md", work / "previous-criteria.md")


def unwrap(path):
    value = path.read_text().strip()
    match = re.fullmatch(r"\x60\x60\x60(?:json)?\s*\n(.*)\n\x60\x60\x60", value, re.S)
    return json.loads(match[1] if match else value)


def judge(skill, role):
    reg = read_registration()
    selection(skill, VERSIONS[skill][0])
    rows = [reg["assignments"][i] for i in reg["gradingOrder"] if reg["assignments"][i]["skill"] == skill]
    labels = [r["label"] for r in rows] if role == "first" else [reg["assignments"][reg["doubleRating"][skill]]["label"]]
    ident = role + "-" + sha((reg["utc"] + skill + role).encode())[:8]
    receipt = ROOT / skill / "assessments" / role
    receipt.mkdir(exist_ok=False)
    with tempfile.TemporaryDirectory(prefix="local-review-") as tmp:
        work = native.window(tmp)
        copy_inputs(skill, work)
        for label in labels:
            path = receipt.parent / "packets" / (label + ".json")
            shutil.copyfile(path, work / path.name)
        guide = (PRIOR / "method/grading-instructions.md").read_text().replace("R1","R2").replace("P1","P2")
        prompt = (guide + "\nНазначение " + ident + ". Работы в порядке " + ", ".join(labels) +
                  ". Критерии в criteria.md, исходная R1 в previous-criteria.md. "
                  "В inputs/original находится прежнее задание, в inputs/fresh — новое. Нужен вывод для каждого указанного псевдонима.")
        args = native.flags(work, *MODELS["reviewer"], native.COMMON)
        delivery = verify_window(work, args, prompt, skill, None)
        files = tree(work)
        write(receipt / "delivery.json", {"utc": now(), "assessor": ident, "labels": labels, "packetFiles": files,
              "model": MODELS["reviewer"][0], "effort": MODELS["reviewer"][1], "prompt": prompt, **delivery})
        result = native.execute(work, args, prompt, receipt)
        write(receipt / "result.json", {**result, "projectChanged": tree(work) != files})
        assert result["exit"] == 0 and result["lastEvent"] == "turn.completed" and tree(work) == files
        signed = unwrap(receipt / "answer.md")
        assert signed["assessor"] == ident and sorted(r["label"] for r in signed["ratings"]) == sorted(labels)
        for r in signed["ratings"]:
            assert r["score"] in ("PASS", "FAIL", "INCONCLUSIVE") and r["behavior"] in ("done", "missed", "unknown")
            assert r["reason"] and r["behaviorReason"]
        write(receipt / "signed.json", {**signed, "signedUtc": result["finished"], "answerSha256": result["answerSha256"]})
        print(skill, role, len(labels), result["finished"], flush=True)


def seal():
    reg = read_registration()
    proofs = {}
    for skill in VERSIONS:
        subset = reg["assignments"][reg["doubleRating"][skill]]["label"]
        ratings = {}
        expected = {r["label"] for r in reg["assignments"].values() if r["skill"] == skill}
        for role in ("first", "second", "adjudicator"):
            base = ROOT / skill / "assessments" / role
            if role == "adjudicator" and not base.exists():
                continue
            signed, delivery, result = [read(base / f) for f in ("signed.json", "delivery.json", "result.json")]
            assert digest(base / "answer.md") == result["answerSha256"] == signed["answerSha256"]
            assert sha(gzip.decompress((base / "events.jsonl.gz").read_bytes())) == result["eventsSha256"]
            assert digest(ROOT / skill / "rubric.md") == delivery["packetFiles"]["criteria.md"]
            assert result["exit"] == 0 and not result["projectChanged"] and delivery["privateSourcesDenied"]
            assert unwrap(base / "answer.md")["ratings"] == signed["ratings"]
            ratings[role] = {r["label"]: r for r in signed["ratings"]}
            assert set(ratings[role]) == (expected if role == "first" else {subset})
            for label in ratings[role]:
                assert digest(base.parent / "packets" / (label+".json")) == delivery["packetFiles"][label+".json"]
            proofs[skill+"/"+role] = {"signedUtc": signed["signedUtc"], "sha256": digest(base/"signed.json"), "thread": result["thread"]}
        differs = any(ratings["first"][subset][key] != ratings["second"][subset][key] for key in ("score", "behavior"))
        assert differs == ("adjudicator" in ratings), (skill, "adjudication", differs)
    assert len({s["thread"] for s in proofs.values()}) == len(proofs)
    write(ROOT/"sealed-scores.json", {"utc": now(), "registration": digest(ROOT/"registration.json"), "signed": proofs})
    write(ROOT/"reveal.json", {"utc": now(), "seal": digest(ROOT/"sealed-scores.json"),
          "labels": {r["label"]: {"run": i, "case": r["case"], "skill":r["skill"], "variant":r["variant"]} for i,r in reg["assignments"].items()}})


if __name__ == "__main__":
    stage, *args = sys.argv[1:]
    if stage == "register":
        register(Path(args[0]))
    elif stage == "run":
        dispatch(*args)
    elif stage == "packets":
        packets()
    elif stage == "judge":
        judge(*args)
    elif stage == "seal":
        seal()
    elif stage in ("run-all", "judge-all"):
        reg = read_registration()
        jobs = ([["run", i] for i in reg["executionOrder"]] if stage == "run-all" else
                [["judge", skill, role] for skill in VERSIONS for role in ("first", "second")])
        def launch(job):
            return subprocess.run([sys.executable, "-B", __file__, *job]).returncode
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            codes = list(pool.map(launch, jobs))
        assert not any(codes), codes
    else:
        raise SystemExit("unknown stage")
