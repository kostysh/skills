"""Preserve the wc result from a combined project and package read for blind scoring."""
import gzip
import json
import runpy
import shutil
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
run = runpy.run_path(str(HERE / "run-study.py"))
study, native = run["study"], run["native"]
import assess

original = assess.make_packet
issue = "27df8d5695d4"
details = {}


def keep_project_output(ident):
    if ident != issue:
        return original(ident)
    reg = study.read_registration()
    row = reg["assignments"][ident]
    skill = row["skill"]
    receipt = HERE / skill / "runs" / ident
    status = study.read(receipt / "result.json")
    raw = gzip.decompress((receipt / "events.jsonl.gz").read_bytes())
    assert native.sha(raw) == status["eventsSha256"]
    assert study.digest(receipt / "answer.md") == status["answerSha256"]
    study.selection(skill, row["variant"])
    name = "references/spec-pass.md"
    package_tail = native.payload(skill)[name].decode()
    cmd = "wc -l changes.diff base/rooms.ini head/rooms.ini"
    combined = "/bin/bash -lc '" + cmd + "; cat .agents/skills/" + skill + "/" + name + "'"
    events = [json.loads(line) for line in raw.splitlines()]
    items = [e["item"] for e in events if e["type"] == "item.completed" and e["item"]["id"] == "item_3"]
    assert len(items) == 1
    item = items[0]
    assert item["command"] == combined and item["aggregated_output"].endswith(package_tail)
    project = item["aggregated_output"][:-len(package_tail)]
    output = [l for l in project.splitlines() if l.strip() != assess.AMBIENT]
    assert [l.split() for l in output] == [["10", "changes.diff"], ["6", "base/rooms.ini"], ["6", "head/rooms.ini"], ["22", "total"]]
    combined_exit = item["exit_code"]
    item.update({"command": "/bin/bash -lc '" + cmd + "'", "aggregated_output": project, "exit_code": None})
    # The standard formatter consumes a disposable projection. The original signed
    # execution and receipt stay untouched; their fingerprints are recorded below.
    derived = b"".join((json.dumps(e, ensure_ascii=False) + "\n").encode() for e in events)
    with tempfile.TemporaryDirectory(prefix="blind-evidence-") as tmp:
        scratch = Path(tmp)
        local = scratch / skill / "runs" / ident
        local.mkdir(parents=True)
        for field in ("answer.md", "delivery.json"):
            shutil.copyfile(receipt / field, local / field)
        (local / "events.jsonl.gz").write_bytes(gzip.compress(derived, mtime=0))
        native.write(local / "result.json", {**status, "eventsSha256": native.sha(derived)})
        oldroot = assess.ROOT
        try:
            assess.ROOT = scratch
            original(ident)
        finally:
            assess.ROOT = oldroot
        name_packet = Path(skill) / "assessments/packets" / (row["label"] + ".json")
        packet = study.read(scratch / name_packet)
    kept = [a for a in packet["actions"] if a.get("command") == item["command"]]
    assert len(kept) == 1 and kept[0]["output"] == "\n".join(output)
    kept[0]["shellExit"] = combined_exit
    kept[0]["exitScope"] = "Код shellExit относится ко всей составной команде. Отдельный код wc в событии отсутствует."
    native.write(HERE / name_packet, packet)
    details.update({"run": ident, "event": "item_3", "eventsSha256": status["eventsSha256"],
                    "combinedShellExit": combined_exit, "keptCommand": cmd,
                    "retainedOutput": output, "omittedPackageFile": name,
                    "omittedPackageSha256": native.sha(package_tail.encode()),
                    "packetSha256": study.digest(HERE / name_packet)})


assess.make_packet = keep_project_output
run["third"].packets()
native.write(HERE / "packet-extraction.json", {"recorded": native.now(), "methodSha256": study.digest(Path(__file__)),
             "reason": "Штатная подготовка остановилась на одном смешанном чтении. До выдачи оценщикам выделены команда wc и её точный вывод. Отброшенный хвост совпал с полным текстом поставленного справочника. Исходное исполнение сохранено.",
             **details})
