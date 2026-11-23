"""Give an independent reviewer the two exact packages and the three sealed pairs."""
import difflib
import gzip
import json
import runpy
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
run = runpy.run_path(str(HERE/"run-study.py"))
study, native = run["study"], run["native"]
SKILL, CASES, VERSIONS = (run[k] for k in ("SKILL","CASES","VERSIONS"))
REPO, FIRST, INITIAL = run["REPO"], run["FIRST"], run["ORIGINAL"]
import audit as earlier_audit

PROMPT = earlier_audit.PROMPT.split("Верни один JSON-объект:")[0] + """
Это второй возврат. В prior/first — подписанное решение по непосредственно предшествующему кандидату и работа, в которой повторилось нарушение. В prior/initial — исходный возврат. В author.md разбор повторного дефекта и авторская самопроверка. В active.diff сравниваются байты файлов, реально поставленных в двух архивах. В checks приложены сырые журналы заявленных технических проверок. Раздели утверждения о выполненных действиях по их источнику, конкретному исполнению и результату. Проверь критерии для каждого из трёх заданий. Существенный дефект оценивай по его фактическому влиянию. Не подменяй подписанные баллы своей переоценкой без конкретного изъяна в исходном основании.

Верни один JSON-объект с полями skill, version, verdict (PASS, FAIL, BLOCKED или PROVISIONAL), assurance, rationale (кратко), cases (объект с тремя строками original, fresh, transfer; в каждой приведи результаты обеих версий и конкретные факты), findings (массив строк, тяжесть и P1-скрининг для материального дефекта), limits, next. Для возврата также укажи returned с полями primary (skill, rubric, fixture или evidence) и finding. Ответь по-русски."""


def load_packages(work):
    packages = {}
    for version,root in zip(VERSIONS,(HERE,FIRST)):
        study.selection(SKILL,version)
        data = native.payload(SKILL)
        packages[version] = data
        shutil.copyfile(root/"packages"/f"{SKILL}-{version}.tar.gz", work/(version+".tar.gz"))
    new,old = (packages[version] for version in VERSIONS)
    lines = []
    for name in sorted(set(new)|set(old)):
        if name in new:
            path = work/"package"/name
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes(new[name])
            assert study.digest(REPO/"skills"/SKILL/name)==native.sha(new[name])
        lines.extend(difflib.unified_diff(old.get(name,b"").decode().splitlines(True),
                    new.get(name,b"").decode().splitlines(True),"/".join((VERSIONS[1],name)),"/".join((VERSIONS[0],name))))
    (work/"active.diff").write_text("".join(lines))
    return [name for name in sorted(set(new)|set(old)) if old.get(name)!=new.get(name)]


def collect(work):
    reg = study.read_registration()
    run["copy_inputs"](SKILL,work)
    for directory in ("runs","assessments"):
        shutil.copytree(HERE/SKILL/directory,work/directory)
    for source,sub,ident in ((FIRST,"first","05cdb5d86753"),(INITIAL,"initial","46722400d865")):
        p=work/"prior"/sub
        p.mkdir(parents=True)
        shutil.copyfile(source/SKILL/"audit/signed.json",p/"signed.json")
        shutil.copyfile(source/SKILL/"results.md",p/"results.md")
        shutil.copytree(source/SKILL/"runs"/ident,p/"run")
    (work/"prior/first/assessments").mkdir()
    for name in ("first","second","adjudicator"):
        p=FIRST/SKILL/"assessments"/name/"signed.json"
        if p.is_file():
            shutil.copyfile(p,work/"prior/first/assessments"/(name+".json"))
    for name in ("registration.json","protocol.md","pre-edit.json","reveal.json","sealed-scores.json","packet-verification.json","checks.json"):
        shutil.copyfile(HERE/name,work/name)
    shutil.copytree(HERE/"checks",work/"checks")
    for recorded in study.read(work/"checks.json")["commands"].values():
        assert recorded["exit"]==0 and native.sha(gzip.decompress((work/recorded["raw"]).read_bytes()))==recorded["sha256"]
    source = REPO/"skills"/SKILL
    (work/"source").mkdir()
    for name in ("skill.yaml","AGENTS.md"):
        shutil.copyfile(source/name,work/"source"/name)
    for name in ("references","fragments"):
        shutil.copytree(source/name,work/"source"/name)
    shutil.copyfile(source/"docs/logs/implementation-log-20261123-2.md",work/"author.md")
    (work/"method").mkdir()
    for name in ("SKILL.md","references/methodology.md","references/forward-testing.md"):
        shutil.copyfile(REPO/"skills/skill-reviewer"/name,work/"method"/Path(name).name)
    shutil.copyfile(REPO/"docs/skill-standard.md",work/"method/standard.md")
    changed = load_packages(work)
    study.selection(SKILL,VERSIONS[0])
    seal = study.read(HERE/"sealed-scores.json")
    assert study.read(HERE/"reveal.json")["seal"] == study.digest(HERE/"sealed-scores.json")
    ratings = {}
    roles = ["first","second","adjudicator"]
    for role in roles:
        f=work/"assessments"/role/"signed.json"
        if not f.exists():
            assert role=="adjudicator"
            continue
        assert study.digest(f) == seal["signed"][SKILL+"/"+role]["sha256"]
        if role!="second":
            ratings.update({r["label"]:r for r in study.read(f)["ratings"]})
    for ident,row in reg["assignments"].items():
        path=work/"runs"/ident
        observed=study.read(path/"result.json")
        assert observed["lastEvent"]=="turn.completed" and observed["exit"]==0 and not observed["changed"]
        assert native.sha(gzip.decompress((path/"events.jsonl.gz").read_bytes()))==observed["eventsSha256"]
        assert study.digest(path/"answer.md")==observed["answerSha256"]
    basis={"skill":SKILL,"version":VERSIONS[0],"previous":VERSIONS[1],"base":reg["base"],
           "scope":"Повторный P2 P-84, проверка применимости предписанного метода F-31, перенос на M-56 и достоверность заявления о проверке объекта.",
           "archives":reg["skills"][SKILL]["archives"],"changedPackageFiles":changed,
           "sourceDiffSha256":study.digest(work/"active.diff"),
           "caseScores":{i:{**r,"assessment":ratings[r["label"]]} for i,r in reg["assignments"].items()}}
    native.write(work/"basis.json",basis)
    return basis


def record_decision(work,receipt,args):
    output=bytearray()
    times={"handed":native.now()}
    thread=None
    command=["timeout","900",*args,"exec","--ephemeral","--skip-git-repo-check","-C",str(work),"--json",
             "--output-last-message",str(receipt/"answer.md"),"-"]
    with tempfile.TemporaryFile() as err, subprocess.Popen(command,cwd=work,stdin=subprocess.PIPE,
          stdout=subprocess.PIPE,stderr=err) as proc:
        proc.stdin.write(PROMPT.encode())
        proc.stdin.close()
        for line in proc.stdout:
            output.extend(line)
            event=json.loads(line)
            if event["type"]=="thread.started":
                thread=event["thread_id"]
            if event["type"]=="turn.started":
                times.setdefault("started",native.now())
            if event["type"]=="turn.completed":
                times["decided"]=native.now()
        code=proc.wait()
        err.seek(0)
        stderr_sha=native.sha(err.read())
    (receipt/"events.jsonl.gz").write_bytes(gzip.compress(bytes(output),mtime=0))
    answer=receipt/"answer.md"
    return {**times,"thread":thread,"exit":code,"eventsSha256":native.sha(output),
            "stderrSha256":stderr_sha,"answerSha256":study.digest(answer) if answer.is_file() else None}


def main():
    receipt=HERE/SKILL/"audit"
    with tempfile.TemporaryDirectory(prefix="local-review-") as tmp:
        work=native.window(tmp)
        basis=collect(work)
        before=native.tree(work)
        args=native.flags(work,*study.MODELS["reviewer"],native.COMMON)
        checks=study.verify_window(work,args,PROMPT,SKILL,None)
        receipt.mkdir(exist_ok=False)
        native.write(receipt/"handoff.json",{"utc":native.now(),"basis":basis,"files":before,"prompt":PROMPT,
                     "model":study.MODELS["reviewer"][0],"effort":study.MODELS["reviewer"][1],**checks})
        result=record_decision(work,receipt,args)
        result["changed"]=native.tree(work)!=before
        native.write(receipt/"result.json",result)
        assert result["exit"]==0 and result["thread"] and "started" in result and "decided" in result and not result["changed"]
        signed=study.unwrap(receipt/"answer.md")
        assert signed["skill"]==SKILL and signed["version"]==VERSIONS[0] and set(signed["cases"])==set(CASES)
        assert signed["verdict"] in {"PASS","FAIL","PROVISIONAL","BLOCKED"} and signed["assurance"]=="independent"
        native.write(receipt/"signed.json",signed)
        print(signed["verdict"],result["decided"],flush=True)


if __name__=="__main__":
    main()
