"""Add the immediately preceding return to the existing R3 auditor's evidence window."""
import importlib.util
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


HERE = Path(__file__).resolve().parent
round3 = load("third_round", HERE / "run-study.py")
old = load("second_audit", round3.SECOND / "re-audit.py")
study, native = round3.study, round3.native
SKILL, VERSIONS = round3.SKILL, round3.VERSIONS
SOURCE_SHA = "e3834f833edeeb4309e63b8eb2b6d94673d4855b"
# Importing the previous standalone auditor sets the shared study's root to its own series.
study.ROOT, study.VERSIONS = HERE, {SKILL: VERSIONS}
study.selection, study.verify_window, study.numbered_scripts = round3.select, round3.verify, round3.methods
old.HERE, old.VERSIONS = HERE, VERSIONS
old.run["copy_inputs"] = round3.prior.copy_inputs
original_load = old.load_packages


def load_third_archives(work):
    # The existing collector uses FIRST to locate the .10 failure path. Only the archive
    # comparison needs the .11 package from the immediately preceding round.
    old.FIRST = round3.SECOND
    try:
        return original_load(work)
    finally:
        old.FIRST = round3.FIRST


old.load_packages = load_third_archives
old.PROMPT = old.earlier_audit.PROMPT.split("Верни один JSON-объект:")[0] + """
Это третий раунд. В prior/second находятся непосредственно предыдущий вердикт по 0.4.11, исходное исполнение M-56 и оценки. В prior/first и prior/initial находятся старшие возвраты P-84. В author.md разбор последнего случая по объектам и операциям, авторская проверка и точная правка. В active.diff сравниваются файлы двух устанавливаемых архивов. В checks приложены сырые журналы технических проверок именно текущего кандидата. Сверяй реальные команды, времена, объекты и результаты по сырым записям. Сверь метки и обезличенные предъявления с источниками. Определи, закрылся ли прежний сбой отчётности и сохранились ли решения о выпуске на P-84 и F-31. Отрази ограничения одинаковых результатов и причинности. Соблюдай порядок вердиктов методики. Новые испытания не запускай.

Верни один JSON-объект. Поля skill, version, verdict (PASS, FAIL, BLOCKED или PROVISIONAL), assurance, rationale (кратко), cases (объект из трёх строк original, fresh, transfer; в каждой результаты обеих версий и конкретное наблюдение), findings (массив строк, тяжесть и P1-скрининг по материальной находке), limits, next. Для возврата также укажи returned с полями primary (skill, rubric, fixture или evidence) и finding. Ответь по-русски."""


def collect(work, author_log):
    basis = old.collect(work)
    current_checks = study.read(work / "checks.json")
    assert current_checks["changedArchives"][SKILL]["sha256"] == basis["archives"][VERSIONS[0]]
    previous = round3.SECOND / SKILL
    target = work / "prior/second"
    target.mkdir()
    for name in ("signed.json", "result.json"):
        shutil.copyfile(previous / "audit" / name, target / name)
    verdict = study.read(target / "signed.json")
    assert verdict["skill"] == SKILL and verdict["version"] == VERSIONS[1]
    if (previous / "results.md").exists():
        shutil.copyfile(previous / "results.md", target / "results.md")
    shutil.copyfile(round3.SECOND / "registration.json", target / "registration.json")
    shutil.copytree(previous / "runs/f93a6d71fd73", target / "run")
    for item in (previous / "assessments").glob("*/signed.json"):
        (target / "assessments").mkdir(exist_ok=True)
        shutil.copyfile(item, target / "assessments" / (item.parent.name + ".json"))
    shutil.copyfile(work / "author.md", target / "author.md")
    shutil.copyfile(author_log, work / "author.md")
    for group in ("source", "package"):
        for item, digest in native.tree(work / group).items():
            saved = subprocess.check_output(
                ["git", "show", f"{SOURCE_SHA}:skills/{SKILL}/{item}"], cwd=round3.REPO)
            assert native.sha(saved) == digest, (group, item)
    basis.update({"scope": "Повторный отказ M-56 на .11: заявление об идентификаторах и его проверка. "
                           "Сохранение решений о методе на P-84 и F-31. Один запуск каждой версии на задание.",
                  "sourceCommit": SOURCE_SHA,
                  "previousAuditSha256": study.digest(target / "signed.json"),
                  "currentAuthorLogSha256": study.digest(work / "author.md"),
                  "technicalChecksSha256": study.digest(work / "checks.json")})
    import json
    (work / "basis.json").write_text(json.dumps(basis, ensure_ascii=False, indent=2) + "\n")
    return basis


def main():
    receipt = HERE / SKILL / "audit"
    author_log = Path(sys.argv[1]) if len(sys.argv) > 1 else (
        round3.REPO / "skills" / SKILL / "docs/logs/implementation-log-20261123-3.md")
    assert author_log.is_file()
    with tempfile.TemporaryDirectory(prefix="local-review-") as tmp:
        work = native.window(tmp)
        basis = collect(work, author_log)
        before = native.tree(work)
        args = native.flags(work, *study.MODELS["reviewer"], native.COMMON)
        checks = study.verify_window(work, args, old.PROMPT, SKILL, None)
        receipt.mkdir(exist_ok=False)
        native.write(receipt / "handoff.json", {"utc": native.now(), "basis": basis, "files": before,
             "prompt": old.PROMPT, "model": study.MODELS["reviewer"][0], "effort": study.MODELS["reviewer"][1], **checks})
        result = old.record_decision(work, receipt, args)
        result["changed"] = native.tree(work) != before
        native.write(receipt / "result.json", result)
        assert result["exit"] == 0 and result["thread"] and "started" in result and "decided" in result and not result["changed"]
        signed = study.unwrap(receipt / "answer.md")
        assert signed["skill"] == SKILL and signed["version"] == VERSIONS[0] and set(signed["cases"]) == set(round3.CASES)
        assert signed["verdict"] in {"PASS","FAIL","PROVISIONAL","BLOCKED"} and signed["assurance"] == "independent"
        native.write(receipt / "signed.json", signed)
        print(signed["verdict"], result["decided"], flush=True)


if __name__ == "__main__":
    main()
