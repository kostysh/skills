"""Replay both viewports using a frozen fixture, returned CSS and a fresh Chrome."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory


# The initial timeline also has an entry for opening the page.
STAGES = [("initial", 1, 1), ("keyboard", 4, 5), ("invalid", 7, 8), ("closed", 11, 12)]


def summarize(state):
    geometry = state["geometry"]
    width = geometry["viewport"]
    elements = geometry["elements"]
    buttons = [element for element in elements if element["tag"] == "BUTTON"]
    keys = ("text", "ink", "fill", "outline", "weight", "w", "h")
    return {
        "width": width,
        "page": geometry["page"],
        "excursions": [el["text"][:85] for el in elements
                       if el["x"] < -0.5 or el["x"] + el["w"] > width + 0.5],
        "clippedButtons": [el["text"] for el in buttons if el["scroll"] > el["client"] + 1],
        "actions": [{key: el[key] for key in keys} for el in buttons],
        "focus": state["focus"],
        "messages": state["status"],
        "fields": state["fields"],
        "dialog": state["dialog"],
    }


def probe(fixture, css, screens, width):
    actions = [
        {"op": "width", "width": width, "height": 844}, {"op": "look"},
        *[{"op": "key", "key": "Tab"} for _ in range(3)],
        {"op": "fill", "target": "#email", "value": "oops"},
        {"op": "click", "target": "[data-primary]"}, {"op": "look"},
        {"op": "fill", "target": "#email", "value": "ops2@example.test"},
        {"op": "click", "target": "[data-primary]"},
        {"op": "click", "target": "#cancel"}, {"op": "look"},
    ]
    capture = """
    if ([1,4,7,11].includes(actions.length)) {
      const shot = await request('Page.captureScreenshot', {format: 'png'});
      await writeFile('observer-' + actions.length + '.png', Buffer.from(shot.data, 'base64'));
    }
    """
    with TemporaryDirectory(prefix="visual-readback-") as temporary:
        work = Path(temporary)
        shutil.copytree(fixture, work, dirs_exist_ok=True)
        shutil.copyfile(css, work / "dist/presentation.css")
        driver = work / "visit.mjs"
        source = driver.read_text()
        marker = "actions.push(a);timeline.push"
        if source.count(marker) != 1:
            raise ValueError("Expected the frozen fixture's action recorder")
        driver.write_text(source.replace(marker, capture + marker))
        process = subprocess.run(["node", "visit.mjs", json.dumps(actions)], cwd=work,
                                 capture_output=True, check=True, timeout=32)
        receipt, = (work / "visits").glob("*.json")
        record = json.loads(receipt.read_text())
        points = {}
        captures = {}
        for name, frame, entry in STAGES:
            points[name] = summarize(record["timeline"][entry]["state"])
            target = screens / f"{width}-{name}.png"
            shutil.copyfile(work / f"observer-{frame}.png", target)
            captures[target.name] = hashlib.sha256(target.read_bytes()).hexdigest()
        return {
            "width": width, "exit": process.returncode, "error": record["error"],
            "points": points, "finalPngSha256": record["screenSha256"], "captures": captures,
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("fixture", type=Path)
    parser.add_argument("css", type=Path)
    parser.add_argument("out", type=Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    narrow = 320 if args.fixture.name == "holdout" else 390
    views = [probe(args.fixture, args.css, args.out, width) for width in (narrow, 1180)]
    (args.out / "browser-readback.json").write_text(json.dumps(views, ensure_ascii=False, indent=2) + "\n")
