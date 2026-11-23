"""Recreate the two local Chromium observations shipped with the case inputs."""

import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PAGES = {
    "/journal": ROOT / "inputs/ordinary/project/index.html",
    "/catalog": ROOT / "inputs/boundary/project/index.html",
}


class FixtureHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        source = PAGES.get(self.path)
        if source is None:
            self.send_error(404)
            return
        body = source.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=UTF-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass


JOURNAL = """({
  dialogOpen: document.querySelector('dialog').open,
  activeElement: document.activeElement.id || document.activeElement.tagName,
  fieldValue: document.querySelector('#callsign').value,
  savedInSecondRow: document.querySelectorAll('li span')[1].textContent
})"""

CATALOG = """(() => {
  const active = document.querySelector('section:not([hidden])');
  return {
    heading: active.querySelector('h2').innerText,
    visibleText: active.innerText,
    controlsInRow: [...active.querySelectorAll('li :is(a, button, summary, input, [tabindex])')].map(e => e.innerText),
    expanded: [...active.querySelectorAll('details[open] summary')].map(e => e.innerText)
  };
})()"""


def collect(directory, host):
    config = directory / "config.json"
    config.write_text("{}\n")
    profile = directory / "profile"
    env = {key: os.environ[key] for key in ("HOME", "PATH", "LANG") if key in os.environ}
    dirs = {"XDG_RUNTIME_DIR": "rt", "XDG_DATA_HOME": "data", "XDG_CONFIG_HOME": "cfg",
            "XDG_CACHE_HOME": "cache", "XDG_STATE_HOME": "state", "TMPDIR": "tmp",
            "AGENT_BROWSER_SOCKET_DIR": "sock"}
    for key, name in dirs.items():
        path = directory / name
        path.mkdir(mode=0o700)
        env[key] = str(path)
    env["AGENT_BROWSER_DEFAULT_TIMEOUT"] = "5000"
    command = [shutil.which("agent-browser"), "--config", str(config), "--session", "capture", "--json"]
    chrome = shutil.which("google-chrome")
    launch = ["--profile", str(profile), "--executable-path", chrome,
              "--allowed-domains", "127.0.0.1", "--args", "--disable-background-networking,--disable-component-update"]

    def run(*args, first=False):
        cmd = command + (launch if first else []) + list(args)
        result = subprocess.run(cmd, check=False, capture_output=True, text=True, env=env, timeout=30)
        if result.returncode:
            raise RuntimeError(f"{args[0]}: {result.stderr.strip()} {result.stdout.strip()}")
        data = json.loads(result.stdout)
        if not data["success"]:
            raise RuntimeError(f"{args[0]}: {data}")
        return data.get("data")

    def snapshot(route, first=False):
        run("open", host + route, first=first)
        run("wait", "--fn", "document.querySelector('main') !== null")
        run("snapshot", "-i")
        answer = run("eval", "({userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight]})")["result"]
        return {
            "htmlSha256": hashlib.sha256(PAGES[route].read_bytes()).hexdigest(),
            "source": "index.html",
            **answer,
            "steps": [],
        }

    def record(observation, label, query):
        observation["steps"].append({"action": label, "observed": run("eval", query)["result"]})

    try:
        run("open", host + "/journal", first=True)
        run("set", "viewport", "1000", "720")
        journal = snapshot("/journal")
        record(journal, "open page", JOURNAL)
        run("press", "Tab")
        run("press", "Tab")
        record(journal, "Tab, Tab", JOURNAL)
        run("press", "Enter")
        run("wait", "--fn", "document.querySelector('dialog').open")
        run("snapshot", "-i")
        run("find", "label", "Позывной", "fill", "Быстрый")
        record(journal, "Enter, then fill Позывной with Быстрый", JOURNAL)
        run("press", "Escape")
        run("wait", "--fn", "!document.querySelector('dialog').open")
        run("snapshot", "-i")
        record(journal, "Escape", JOURNAL)

        catalog = snapshot("/catalog")
        record(catalog, "open page", CATALOG)
        run("find", "text", "Карточка", "click", "--exact")
        run("wait", "--fn", "document.querySelector('#working details').open")
        run("snapshot", "-i")
        run("find", "text", "Журнал измерений", "click", "--exact")
        run("wait", "--fn", "document.querySelectorAll('#working details[open]').length === 2")
        run("snapshot", "-i")
        record(catalog, "open Карточка and Журнал измерений", CATALOG)
        run("click", "nav a[href='#reserve']")
        run("wait", "--fn", "!document.querySelector('#reserve').hidden")
        run("snapshot", "-i")
        record(catalog, "open Резерв", CATALOG)

        for route, data in [("/journal", journal), ("/catalog", catalog)]:
            path = PAGES[route].with_name("browser.json")
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    finally:
        run("close")
        for _ in range(25):
            processes = subprocess.check_output(["ps", "-eo", "args="], text=True)
            if str(profile) not in processes:
                break
            time.sleep(0.2)
        else:
            raise RuntimeError("The capture's Chrome profile is still in use")


if __name__ == "__main__":
    with ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler) as server:
        worker = threading.Thread(target=server.serve_forever)
        worker.start()
        try:
            # Chrome creates nested Unix sockets below this path (108-byte Linux limit).
            with tempfile.TemporaryDirectory(prefix="ui-") as directory:
                collect(Path(directory), "http://127.0.0.1:" + str(server.server_port))
        finally:
            server.shutdown()
            worker.join()
