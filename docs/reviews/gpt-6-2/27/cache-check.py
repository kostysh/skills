"""Exercise Next's installed cache modes in scratch apps. Run with a prepared route/ copy."""
import argparse
import hashlib
import http.client
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time

parser = argparse.ArgumentParser()
parser.add_argument("project", type=Path, help="A route/ copy after npm ci")
parser.add_argument("--node", default="node")
args = parser.parse_args()
project = args.project.resolve()
node = shutil.which(args.node)
next_cli = Path("node_modules/.bin/next")
env = dict(os.environ, NEXT_TELEMETRY_DISABLED="1")
static_source = """export async function GET() {
  return Response.json({queue: 'public-desk'});
}
"""
request_source = """import {cookies, headers} from 'next/headers';
export async function GET() {
  const desk = (await headers()).get('x-desk');
  const theme = (await cookies()).get('theme')?.value;
  return Response.json({desk, theme});
}
"""


def link_or_copy(src, dest):
    try:
        return os.link(src, dest)
    except OSError:
        return shutil.copy2(src, dest)


def request(port, route, headers=None):
    con = http.client.HTTPConnection("127.0.0.1", port, timeout=4)
    try:
        con.request("GET", route, headers=headers or {})
        res = con.getresponse()
        assert res.status == 200, res.status
        return json.loads(res.read())
    finally:
        con.close()


def probe(folder, cache, segment_runtime):
    shutil.copytree(project / "node_modules", folder / "node_modules", symlinks=True, copy_function=link_or_copy)
    shutil.copy2(project / "package.json", folder / "package.json")
    (folder / "app/api/info").mkdir(parents=True)
    (folder / "app/api/desk").mkdir()
    (folder / "app/api/info/route.js").write_text(("export const runtime = 'nodejs';\n" if segment_runtime else "") + static_source)
    (folder / "app/api/desk/route.js").write_text(request_source)
    (folder / "next.config.mjs").write_text("export default " + json.dumps({
        "cacheComponents": cache, "partialPrefetching": cache, "experimental": {"cpus": 1}
    }))
    built = subprocess.run([node, next_cli, "build"], cwd=folder, env=env, capture_output=True, text=True, timeout=90)
    output = (built.stdout + built.stderr).replace(str(folder), "{project}")
    lines = [line for line in output.splitlines() if "/api/" in line or "runtime" in line.lower()]
    if segment_runtime:
        assert built.returncode and "runtime" in output and "cacheComponents" in output, output
        return {"buildExit": built.returncode, "relevantOutput": lines}
    assert built.returncode == 0, output
    pm = json.loads((folder / ".next/prerender-manifest.json").read_text())
    declared_static = "/api/info" in pm["routes"]
    assert declared_static == cache and "/api/desk" not in pm["routes"], pm["routes"]
    with socket.socket() as tmp_port:
        tmp_port.bind(("127.0.0.1", 0))
        port = tmp_port.getsockname()[1]
    with (folder / "next.log").open("w") as log:
        server = subprocess.Popen([node, next_cli, "start", "--hostname", "127.0.0.1", "--port", str(port)],
                                  cwd=folder, env=env, stdout=log, stderr=log)
        try:
            for _ in range(80):
                try:
                    static = request(port, "/api/info")
                    break
                except OSError:
                    if server.poll() is not None:
                        raise
                    time.sleep(.1)
            else:
                raise TimeoutError("Fixture did not start")
            contexts = [request(port, "/api/desk", {"x-desk": desk, "Cookie": "theme=" + theme})
                        for desk, theme in [("amber", "dark"), ("reed", "light")]]
            assert static == {"queue": "public-desk"}
            assert contexts == [{"desk": "amber", "theme": "dark"}, {"desk": "reed", "theme": "light"}]
        finally:
            server.terminate()
            server.wait(timeout=15)
    return {"buildExit": 0, "routeBuildOutput": lines, "staticGETInPrerenderManifest": declared_static,
            "staticGET": static, "requestGET": contexts}


results = {
    "node": subprocess.check_output([node, "--version"], text=True).strip(),
    "next": json.loads((project / "node_modules/next/package.json").read_text())["version"],
    "lockSHA256": hashlib.sha256((project / "package-lock.json").read_bytes()).hexdigest()
}
for name, cache, runtime in [("disabled", False, False), ("enabled", True, False), ("enabledWithRuntimeExport", True, True)]:
    with tempfile.TemporaryDirectory(prefix="docket-cache-") as scratch:
        results[name] = probe(Path(scratch), cache, runtime)
print(json.dumps(results, ensure_ascii=False, indent=2))
