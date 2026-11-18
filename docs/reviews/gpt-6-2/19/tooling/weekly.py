"""Read the Weekly choice in Chrome using the frozen exercise and returned CSS."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
from tempfile import TemporaryDirectory


def verify(fixture, css):
    with TemporaryDirectory(prefix="form-readback-") as temporary:
        work = Path(temporary)
        shutil.copytree(fixture, work, dirs_exist_ok=True)
        shutil.copyfile(css, work / "dist/presentation.css")
        driver = work / "visit.mjs"
        source = driver.read_text()
        select_field = "input:not([type=hidden]),[role=switch],[role=radio]"
        assert source.count(select_field) == 1 and source.count("ArrowLeft:37") == 1
        driver.write_text(source.replace(select_field, "select," + select_field)
                          .replace("ArrowLeft:37", "ArrowDown:40,ArrowLeft:37"))
        actions = [
            {"op":"width", "width":320 if fixture.name == "holdout" else 390, "height":844},
            {"op":"fill", "target":"#email", "value":"oops"},
            {"op":"key", "key":"Tab"},
            {"op":"key", "key":"ArrowDown"},
            {"op":"click", "target":"[data-primary]"},
            {"op":"fill", "target":"#email", "value":"ops2@example.test"},
            {"op":"click", "target":"[data-primary]"}, {"op":"click", "target":"#cancel"},
            {"op":"click", "target":"[data-primary]"}, {"op":"click", "target":"#confirm"},
            {"op":"click", "target":"[data-secondary]"},
        ]
        subprocess.run(["node", "visit.mjs", json.dumps(actions)], cwd=work,
                       capture_output=True, check=True, timeout=36)
        snapshots = list((work / "visits").glob("*.json"))
        assert len(snapshots) == 1
        raw = snapshots[0].read_bytes()
        timeline = json.loads(raw)["timeline"]
        rows = {}
        for label, index in [("selected",4), ("invalid",5), ("review",7),
                             ("cancel",8), ("applied",10), ("restored",11)]:
            state = timeline[index]["state"]
            fields = {item["id"]:item for item in state["fields"]}
            rows[label] = {
                "email": fields["email"]["value"], "frequency":fields["rate"]["value"],
                "focus": state["focus"], "messages":state["status"], "dialog":bool(state["dialog"]),
            }
        assert rows["selected"]["frequency"] == rows["invalid"]["frequency"] == "Weekly"
        assert rows["invalid"]["focus"]["id"] == "email" and len(rows["invalid"]["messages"]) == 2
        assert rows["review"]["dialog"] and not rows["cancel"]["dialog"]
        assert rows["cancel"]["email"] == "ops2@example.test" and rows["cancel"]["frequency"] == "Weekly"
        assert rows["cancel"]["messages"] == ["ops@example.test / Daily"]
        assert rows["applied"]["messages"] == ["ops2@example.test / Weekly"]
        assert rows["restored"]["email"] == "ops@example.test" and rows["restored"]["frequency"] == "Daily"
        return {"width":actions[0]["width"], "cssSha256":hashlib.sha256(css.read_bytes()).hexdigest(),
                "traceSha256":hashlib.sha256(raw).hexdigest(), "actions":actions, "states":rows}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("fixture", type=Path)
    parser.add_argument("css", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(verify(args.fixture, args.css), ensure_ascii=False, indent=2) + "\n")
