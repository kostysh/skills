"""Operate the connected project browser. See README.md for commands."""
import fcntl
import json
from pathlib import Path
import signal
import sys

project = Path(__file__).parent
signal.alarm(25)
with (project / ".window-lock").open("a") as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    with (project / ".window-request").open("w") as request:
        request.write(json.dumps(sys.argv[1:]) + "\n")
    with (project / ".window-response").open("r") as response:
        result = json.loads(response.readline())
print(json.dumps(result, ensure_ascii=False, indent=2))
sys.exit(1 if "error" in result else 0)
