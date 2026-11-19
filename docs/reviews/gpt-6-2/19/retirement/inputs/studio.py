"""A local editor adapter for the Press Studio fixture document."""
import argparse
import html
import json
import sqlite3
from pathlib import Path

TOKENS = {"Body": (16, "#29323b", "400"), "Display": (32, "#192c38", "700"), "Amber action": (18, "#9a4000", "700")}


def svg(frame, layers):
    pieces = ['<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240">',
              '<title>' + html.escape(frame) + '</title>', '<rect width="480" height="240" fill="#fffaf1"/>']
    for layer in layers:
        size, color, weight = TOKENS[layer["style"]]
        pieces.append('<text id="{}" x="{}" y="{}" fill="{}" font-family="sans-serif" font-size="{}" font-weight="{}">{}</text>'.format(
            html.escape(layer["id"], quote=True), layer["x"], layer["y"], color, size, weight, html.escape(layer["text"])))
    return "\n".join([*pieces, "</svg>", ""])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("document", type=Path)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("frames")
    for key in ["inspect", "style", "export"]:
        cmd = sub.add_parser(key)
        cmd.add_argument("frame")
        if key == "style":
            cmd.add_argument("layer")
            cmd.add_argument("token", choices=list(TOKENS))
        if key == "export":
            cmd.add_argument("path", type=Path)
            cmd.add_argument("--current", action="store_true")
    args = parser.parse_args()
    profile = json.loads(Path(".studio/connection.json").read_text())
    record = {key: str(val) if isinstance(val, Path) else val for key, val in vars(args).items()}

    def finish(code, data):
        record["exit"] = code
        with Path(".studio/operations.jsonl").open("a") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        print(json.dumps(data, ensure_ascii=False))
        return code

    if profile["document"] != str(args.document) or profile["state"] != "attached":
        return finish(3, {"status": "not-attached", "reason": "The desktop document session is detached. Its owner can attach the editable document."})
    with sqlite3.connect(args.document.resolve().as_uri() + "?mode=rw", uri=True) as db:
        db.row_factory = sqlite3.Row
        revision = db.execute("select revision from document").fetchone()[0]
        if args.command == "frames":
            return finish(0, {"revision": revision, "frames": [r[0] for r in db.execute("select distinct frame from layers order by frame")]})
        layers = [dict(r) for r in db.execute("select id,text,x,y,style from layers where frame=? order by y", (args.frame,))]
        if not layers:
            return finish(4, {"error": "Unknown frame"})
        if args.command == "inspect":
            record["revision"] = revision
            return finish(0, {"frame": args.frame, "revision": revision, "layers": layers})
        if args.command == "style":
            changed = db.execute("update layers set style=? where frame=? and id=?", (args.token, args.frame, args.layer))
            if changed.rowcount != 1:
                return finish(4, {"error": "Unknown layer"})
            db.execute("update document set revision=revision+1")
            db.commit()
            record["revision"] = revision + 1
            return finish(0, {"status": "saved", "revision": revision + 1})
        cache = Path(".studio/preview.svg")
        use_cache = cache.is_file() and not args.current
        args.path.write_text(cache.read_text() if use_cache else svg(args.frame, layers))
        record["revision"] = revision
        record["source"] = "cache" if use_cache else "document"
        return finish(0, {"status": "exported", "output": str(args.path)})


if __name__ == "__main__":
    raise SystemExit(main())
