"""Build the original task workspace for one case. Run from any directory."""
import argparse
import json
import shutil
import sqlite3
from pathlib import Path
from studio import svg

parser = argparse.ArgumentParser()
parser.add_argument("case", choices=["ordinary", "boundary", "holdout"])
parser.add_argument("output", type=Path)
args = parser.parse_args()
here = Path(__file__).resolve().parent
case = json.loads((here / "cases.json").read_text())[args.case]
root = args.output
state = root / ".studio"
state.mkdir(parents=True)
for name in ("studio.py", "STUDIO.md"):
    shutil.copyfile(here / name, root / name)
(state / "connection.json").write_text(json.dumps({"document": case["document"], "state": case["connection"]}) + "\n")
labels = (case["title"], case["detail"], case["action"])
original = [{"id": lid, "text": value, "x": 24, "y": y, "style": "Body"} for lid, value, y in zip(("heading", "order", "action"), labels, (55, 108, 190))]
native = root / case["document"]
if case["connection"] == "attached":
    with sqlite3.connect(native) as db:
        db.execute("create table document(revision integer not null)")
        db.execute("insert into document values(5)")
        db.execute("create table layers(frame text, id text, text text, x integer, y integer, style text, primary key(frame,id))")
        for frame, items in [(case["target"], original), (case["sibling"], [dict(original[0], text="Archive list"), dict(original[1], text="Earlier jobs"), dict(original[2], text="Open log")])]:
            db.executemany("insert into layers values(?,?,?,?,?,?)", [(frame, item["id"], item["text"], item["x"], item["y"], item["style"]) for item in items])
else:
    native.write_text("Press Studio desktop document reference\nSession owner: evening shift\n")
    (root / "last-week.svg").write_text(svg(case["target"], [dict(original[0], text="Previous handover"), dict(original[1], text="Previous order"), dict(original[2], text="Collect")]))
if case["cache"]:
    (state / "preview.svg").write_text(svg(case["target"], original))
brief = f"""# Approved press sheet

On “{case['target']}” set “{case['title']}” in Display, 32 px, bold, dark ink (#192c38). Keep “{case['detail']}” in Body, 16 px, regular. Set “{case['action']}” in Amber action, 18 px, bold, dark amber (#9a4000). This color identifies the action. All three lines are left aligned to the existing 24 px guide. Keep their wording, baselines, the 480 × 240 frame and the neighboring “{case['sibling']}” as supplied. This is a press proof and editable design deliverable.
"""
(root / "press-kit.md").write_text(brief)
