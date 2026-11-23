"""Extend the existing independent re-audit with the .11/.12 records and R4."""
import importlib.util
import shutil
import sys
from pathlib import Path


def load_module(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


HERE = Path(__file__).resolve().parent
run = load_module("round_four", HERE / "run-study.py")
old = load_module("round_two_audit", run.SECOND / "re-audit.py")
run.configure()
old.HERE, old.VERSIONS, old.CASES = HERE, run.VERSIONS, run.CASES
old.run["copy_inputs"] = run.copy_inputs
native, study = run.native, run.study
original_load, original_collect = old.load_packages, old.collect


def load_packages(work):
    # Only the previous transport archive comes from round three. The original
    # collector still needs round one's .10 auditor and the initial .9 evidence.
    old.FIRST = run.THIRD
    try:
        return original_load(work)
    finally:
        old.FIRST = run.FIRST


def collect(work):
    basis = original_collect(work)
    shutil.copyfile(HERE / "packet-extraction.json", work / "packet-extraction.json")
    shutil.copyfile(HERE / "packet-handoff.json", work / "packet-handoff.json")
    shutil.copyfile(HERE / "execution-timing.json", work / "execution-timing.json")
    shutil.copyfile(HERE / "source-boundary.json", work / "source-boundary.json")
    shutil.copyfile(HERE / "prepare-extract.py", work / "method/prepare-extract.py")
    extraction = study.read(work / "packet-extraction.json")
    assert study.digest(work / "method/prepare-extract.py") == extraction["methodSha256"]
    assert study.read(work / "packet-handoff.json")["extractSourceSha256"] == study.digest(work / "packet-extraction.json")
    for name in basis["changedPackageFiles"]:
        if name.startswith("assets/"):
            target = work / "source" / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(old.REPO / "skills" / run.SKILL / name, target)
            assert study.digest(target) == study.digest(work / "package" / name)
    checks = study.read(work / "checks.json")
    assert checks["changedArchives"][run.SKILL]["sha256"] == basis["archives"][run.VERSIONS[0]]
    for path, label, version, run_id, log_number in (
        (run.SECOND, "second", "0.4.11", "f93a6d71fd73", 2),
        (run.THIRD, "third", "0.4.12", "bcbd25d84b5e", 3),
    ):
        dest, src = work / "prior" / label, path / run.SKILL
        dest.mkdir()
        verdict = study.read(src / "audit/signed.json")
        assert verdict["skill"] == run.SKILL and verdict["version"] == version
        for field in ("signed.json", "result.json"):
            shutil.copyfile(src / "audit" / field, dest / field)
        shutil.copyfile(src / "results.md", dest / "results.md")
        shutil.copyfile(path / "registration.json", dest / "registration.json")
        shutil.copytree(src / "runs" / run_id, dest / "run")
        (dest / "assessments").mkdir()
        for entry in (src / "assessments").glob("*/signed.json"):
            shutil.copyfile(entry, dest / "assessments" / (entry.parent.name + ".json"))
        prior_log = old.REPO / "skills" / run.SKILL / "docs/logs" / f"implementation-log-20261123-{log_number}.md"
        shutil.copyfile(prior_log, dest / "author.md")
    shutil.copyfile(old.REPO / "skills" / run.SKILL / "docs/logs/implementation-log-20261123-4.md", work / "author.md")
    basis.update({"scope": "Отчёт о сравнении строк и реальное решение о слиянии. Предыдущий M-56, соседние P-84 и F-31, отдельный перенос L-27; одна работа каждой версии на задание.",
                  "sourceCommitReportedByPackager": "15bcf6753ca81ebc3362901b119c43b0c0717784",
                  "sourceCommitEvidence": "Координатор упаковки сообщил о сравнении git show с содержимым 15 файлов транспортного архива. При подготовке этой выдачи коллектор отдельно сверяет 15 файлов предоставленного дерева с архивом.",
                  "previousAuditSha256": study.digest(work / "prior/third/signed.json"),
                  "authorLogSha256": study.digest(work / "author.md"),
                  "technicalChecksSha256": study.digest(work / "checks.json")})
    import json
    (work / "basis.json").write_text(json.dumps(basis, ensure_ascii=False, indent=2) + "\n")
    return basis


old.PROMPT = old.earlier_audit.PROMPT.split("Верни один JSON-объект:")[0] + """
Это четвертый раунд. В prior/third находятся решение по непосредственно предыдущей редакции 0.4.12, полный M-56 и его рейтинги. В prior/second M-56 относится к 0.4.11. При изложении различай эти исполнения. Изучи разбор и авторскую проверку текущей версии в author.md. Сопоставь собственные утверждения каждого исполнителя с доступным содержимым, идентичностью объекта и фактическими действиями в журнале того же исполнения. Проверь четыре случая, критерии, сравнимость и причины возвратов. Исходная комбинированная команда и её нейтральное представление проверяемы по packet-extraction.json, packet-handoff.json и method/prepare-extract.py. Порядок назначений и фактическая передача при параллельной работе измеряются раздельно. На L-27 отдельно проверь происхождение верных конкретных значений в ответе прежней версии по первичным событиям и сопоставь с source-boundary.json. Укажи, какие заключения поддерживаются при неопределённом источнике. Расхождение с подписанными баллами требует конкретного дефекта доказательства. Новых испытаний не проводи.

Дай один JSON-объект с полями skill, version, verdict (PASS, FAIL, BLOCKED или PROVISIONAL), assurance, rationale (кратко), cases (четыре строки original, fresh, transfer и schedule, каждая с результатами обеих версий и конкретными наблюдениями), findings (массив строк, тяжесть и P1-скрининг по материальной находке), limits, next. При возврате добавь returned с полями primary (skill, rubric, fixture или evidence) и finding. Ответь по-русски."""
old.collect, old.load_packages = collect, load_packages


if __name__ == "__main__":
    # An owner-supplied clean snapshot may provide the source and author logs.
    if len(sys.argv) > 1:
        old.REPO = Path(sys.argv[1]).resolve()
    old.main()
