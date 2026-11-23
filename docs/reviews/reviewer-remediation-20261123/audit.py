"""Independent, read-only re-audit after scores were sealed and version assignments revealed."""
import gzip
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
import study

ROOT, REPO, PRIOR = study.ROOT, study.REPO, study.PRIOR
native, read, write, now = study.native, study.read, study.write, study.now
PROMPT = """Проведи независимый ограниченный re-audit версии из basis.json по поручению владельца исправить наблюдавшийся дефект и оценить смежные решения. Ты не участвовал в авторстве, испытаниях или оценке работ. Прочитай method/SKILL.md целиком, затем methodology.md, forward-testing.md и применимый стандарт из method. Прежнее решение и исходные сырые события лежат в prior. Прочитай в basis.json область и идентификаторы. В package находятся точные поставляемые файлы кандидата, в source его исходники, в active.diff точная дельта к предыдущей редакции. Обе версии архивов приложены. В inputs находятся исходные задания, в runs — фактические ответы и gz-события, в assessments — подписанные оценки и обезличенные выдачи. Ключ уже раскрыт. Сопоставь исходный P2, источник, изменение и решающие наблюдения в журнале, критерии, способ установки, суммы и результаты технических проверок. Используй подписанные баллы как зафиксированные наблюдения; если обнаружишь конкретный изъян в доказательствах, объясни его. Роль ограничена проверяемой правкой и прямым смежным поведением. Оцени границы вывода при равном успехе обеих редакций. Укажи неизученное. Ответь по-русски. Новых испытаний не запускай, рабочие файлы только для чтения.

Верни один JSON-объект: skill, version, verdict (PASS, FAIL, BLOCKED или PROVISIONAL), assurance, rationale (кратко), cases (объект original и fresh с конкретными наблюдениями и результатами обеих версий), findings (массив строк, тяжесть и P1-скрининг при материальной проблеме), limits (строка), next (строка)."""


def audit(skill):
    reg = study.read_registration()
    candidate, old = study.VERSIONS[skill]
    study.selection(skill, candidate)
    local, older = ROOT / skill, PRIOR / skill
    signed = read(ROOT / "sealed-scores.json")
    reveal = read(ROOT / "reveal.json")
    assert reveal["seal"] == study.digest(ROOT / "sealed-scores.json")
    receipt = local / "audit"
    receipt.mkdir(exist_ok=False)
    with tempfile.TemporaryDirectory(prefix="local-review-") as tmp:
        work = native.window(tmp)
        study.copy_inputs(skill, work)
        for directory in ("runs", "assessments"):
            shutil.copytree(local / directory, work / directory)
        for name, data in native.payload(skill).items():
            dest = work / "package" / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
        source = REPO / "skills" / skill
        (work / "source").mkdir()
        shutil.copyfile(source / "skill.yaml", work / "source/skill.yaml")
        shutil.copyfile(source / "AGENTS.md", work / "source/AGENTS.md")
        for family in ("fragments", "references"):
            if (source / family).exists():
                shutil.copytree(source / family, work / "source" / family)
        auditor = REPO / "skills/skill-reviewer"
        (work / "method").mkdir()
        for path in ("SKILL.md", "references/methodology.md", "references/forward-testing.md"):
            shutil.copyfile(auditor / path, work / "method" / Path(path).name)
        shutil.copyfile(REPO / "docs/skill-standard.md", work / "method/standard.md")
        (work / "prior").mkdir()
        for filename in ("audit/signed.json", "results.md"):
            shutil.copyfile(older / filename, work / "prior" / Path(filename).name)
        old_id = {"code-reviewer":"46722400d865", "spec-conformance-reviewer":"40cb27975101"}[skill]
        shutil.copytree(older / "runs" / old_id, work / "prior/run")
        for root, version in ((ROOT,candidate),(PRIOR,old)):
            archive = root / "packages" / f"{skill}-{version}.tar.gz"
            shutil.copyfile(archive, work / f"{version}.tar.gz")
        relevant = ["skill.yaml", "references", "SKILL.md", "fragments", "agents", "assets"]
        delta = subprocess.check_output(["git","diff",reg["base"],"--",*[str(source / p) for p in relevant]],cwd=REPO)
        (work / "active.diff").write_bytes(delta)
        shutil.copyfile(source / "docs/logs/implementation-log-20261123-1.md", work / "author.md")
        for name in ("registration.json", "protocol.md", "pre-edit.json", "reveal.json", "sealed-scores.json", "checks.json"):
            shutil.copyfile(ROOT / name, work / name)
        selected = {i:r for i,r in reg["assignments"].items() if r["skill"] == skill}
        ratings = {}
        for role in ("first", "second", "adjudicator"):
            item = local / "assessments" / role / "signed.json"
            if item.exists():
                assert study.digest(item) == signed["signed"][skill+"/"+role]["sha256"]
                for r in read(item)["ratings"]:
                    if role != "second":
                        ratings[r["label"]] = r
        candidate_passed = True
        for ident, row in selected.items():
            entry = local/"runs"/ident
            result = read(entry/"result.json")
            assert result["exit"] == 0 and not result["changed"] and result["lastEvent"] == "turn.completed"
            assert study.digest(entry/"answer.md") == result["answerSha256"]
            assert native.sha(gzip.decompress((entry/"events.jsonl.gz").read_bytes())) == result["eventsSha256"]
            if row["variant"] == candidate:
                rating = ratings[row["label"]]
                candidate_passed &= rating["score"] == "PASS" and rating["behavior"] == "done"
        basis = {"skill":skill,"version":candidate, "previous":old,"base":reg["base"],"priorExecution":old_id,
                 "scope":"Исходный P2, исправление, исходная задача и свежая соседняя. Выбор из каталога, другие области и внешнее оборудование исключены.",
                 "archives":reg["skills"][skill]["archives"],"sourceDiffSha256":native.sha(delta),
                 "workingHypothesis":"Уточнение применено в обязательном справочнике. Причинность исходного дефекта не предполагалась.",
                 "caseScores":{i:{**row,"assessment":ratings[row["label"]]} for i,row in selected.items()},
                 "authorStatus": ("verified на предъявленных заданиях, ожидает независимой приёмки."
                                  if candidate_passed else "Проверка поведения выявила повторный сбой. Передано для независимого разбора неудачной попытки. Закрытие не заявлено.")}
        write(work / "basis.json", basis)
        before = native.tree(work)
        args = native.flags(work, *study.MODELS["reviewer"], native.COMMON)
        delivery = study.verify_window(work, args, PROMPT, skill, None)
        write(receipt / "handoff.json", {"utc":now(),"basis":basis,"files":before,"prompt":PROMPT,
              "model":study.MODELS["reviewer"][0],"effort":study.MODELS["reviewer"][1],**delivery})
        stdout = bytearray()
        times = {"handed":now()}
        thread = None
        command = [*args,"exec","--ephemeral","--skip-git-repo-check","-C",str(work),"--json",
                   "--output-last-message",str(receipt/"answer.md"),"-"]
        with tempfile.TemporaryFile() as error, subprocess.Popen(command, cwd=work, stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE, stderr=error) as proc:
            proc.stdin.write(PROMPT.encode())
            proc.stdin.close()
            for line in proc.stdout:
                stdout.extend(line)
                event = json.loads(line)
                if event["type"] == "thread.started":
                    thread = event.get("thread_id")
                if event["type"] == "turn.started":
                    times.setdefault("started", now())
                if event["type"] == "turn.completed":
                    times["decided"] = now()
            code = proc.wait()
            error.seek(0)
            stderr_sha = native.sha(error.read())
        (receipt/"events.jsonl.gz").write_bytes(gzip.compress(bytes(stdout),mtime=0))
        result = {**times,"thread":thread,"exit":code,"eventsSha256":native.sha(stdout),"stderrSha256":stderr_sha,
                  "answerSha256":study.digest(receipt/"answer.md"),"changed":native.tree(work) != before}
        write(receipt/"result.json",result)
        assert thread and code == 0 and not result["changed"] and "started" in times and "decided" in times
        signed_audit = study.unwrap(receipt/"answer.md")
        assert signed_audit["skill"] == skill and signed_audit["version"] == candidate
        assert signed_audit["verdict"] in ("PASS","FAIL","BLOCKED","PROVISIONAL")
        assert signed_audit["assurance"] and set(signed_audit["cases"]) == {"original","fresh"}
        write(receipt/"signed.json", signed_audit)
        print(skill,signed_audit["verdict"],times["decided"],flush=True)


if __name__ == "__main__":
    audit(sys.argv[1])
