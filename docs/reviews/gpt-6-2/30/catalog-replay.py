"""Повторить T03 по двум каталогам product. Печатает фактические команды и JSON."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


READ = """import {loadCatalog,pinnedTitles} from './src/catalog.mjs';
const cards = loadCatalog(process.argv[1]);
console.log(JSON.stringify({cards, titles: pinnedTitles(cards)}));"""
UNPIN = """import {loadCatalog,setPinned,saveCatalog,pinnedTitles} from './src/catalog.mjs';
const path = process.argv[1];
const changed = setPinned(loadCatalog(path), 'a', false);
saveCatalog(path, changed);
console.log(JSON.stringify(pinnedTitles(changed)));"""


def command(args, cwd, workspace):
    proc = subprocess.Popen(args, cwd=cwd, env={
        **os.environ, "npm_config_cache": str(workspace / "npm"), "npm_config_offline": "true"
    }, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out, err = proc.communicate(timeout=30)
    return {"argv": args, "pid": proc.pid, "exit": proc.returncode,
            "stdout": out.replace(str(workspace), "<work>"), "stderr": err.replace(str(workspace), "<work>")}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inspect_module(source, label, repaired, workspace):
    root = workspace / label
    shutil.copytree(source, root)
    jsonfile = root / "case.json"
    original = json.loads((root / "fixture/catalog.json").read_text())
    assert [(c["id"], c["title"], c["pinned"]) for c in original] == [("a","Alpha",False), ("b","Beta",True)]
    results = {}
    for scenario in ("pin", "unpin", "legacy-pin"):
        initial = [card.copy() for card in original]
        if scenario == "unpin":
            initial[0]["pinned"] = True
        if scenario == "legacy-pin":
            del initial[0]["pinned"]
        jsonfile.write_text(json.dumps(initial))
        first = command(["node", "--input-type=module", "-e", READ, "case.json"], root, workspace)
        writer = (["node", "--input-type=module", "-e", UNPIN, "case.json"] if scenario == "unpin"
                  else ["node", "desk.mjs", "case.json", "pin", "a"])
        write = command(writer, root, workspace)
        disk = json.loads(jsonfile.read_text())
        second = command(["node", "--input-type=module", "-e", READ, "case.json"], root, workspace)
        pins = command(["node", "desk.mjs", "case.json", "pins"], root, workspace)
        assert {first["exit"], write["exit"], second["exit"], pins["exit"]} == {0}
        assert len({write["pid"], second["pid"], pins["pid"]}) == 3
        before = [{**c, "pinned": c.get("pinned",False)} for c in initial]
        assert json.loads(first["stdout"])["cards"] == before
        expected = [{**original[0], "pinned": scenario != "unpin"}, original[1]]
        titles = [c["title"] for c in expected if c["pinned"]]
        assert json.loads(write["stdout"]) == titles
        stored = expected if repaired else [{k:c[k] for k in ("id","title")} for c in expected]
        readback = [{**c, "pinned": c.get("pinned",False)} for c in stored]
        assert disk == stored
        assert json.loads(second["stdout"]) == {"cards": readback, "titles": titles if repaired else []}
        assert json.loads(pins["stdout"]) == (titles if repaired else [])
        results[scenario] = {"seed": initial, "firstReader": first, "writer": write,
                             "disk": disk, "newModuleReader": second, "newCliReader": pins}
    jsonfile.write_text(json.dumps(original))
    prior = digest(jsonfile)
    missing = command(["node","desk.mjs","case.json","pin","missing"], root, workspace)
    assert missing["exit"] != 0 and "Unknown card: missing" in missing["stderr"] and digest(jsonfile) == prior
    results["missing"] = {"command": missing,"fileBefore": prior,"fileAfter": digest(jsonfile)}
    acceptance = command(["npm","test"], root, workspace)
    assert acceptance["exit"] == 0
    results["packageTest"] = acceptance
    return results


def main():
    before, after = (Path(arg).resolve() for arg in sys.argv[1:])
    with tempfile.TemporaryDirectory(prefix="t03-replay-") as raw:
        workspace = Path(raw)
        results = {}
        for key, src, fixed in (("R2",before,False),("correctedR2",after,True)):
            results[key] = inspect_module(src, key, fixed, workspace)
        mixed = workspace / "original-with-returned-tests"
        shutil.copytree(before, mixed)
        shutil.copytree(after/"test", mixed/"test", dirs_exist_ok=True)
        regression = command(["npm","test"], mixed, workspace)
        assert regression["exit"] != 0, regression
        results["returnedRegressionOnOriginalWriter"] = regression
        print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
