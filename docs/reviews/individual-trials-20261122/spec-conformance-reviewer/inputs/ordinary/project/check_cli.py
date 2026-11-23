from pathlib import Path
import subprocess
import sys

module = Path(__file__).with_name("route_tag.py")
for channel, expected in [("yard", b"Y\n"), ("bay", b"B\n"), ("gate", b"G\n")]:
    reply = subprocess.run(
        [sys.executable, "-B", str(module), channel],
        capture_output=True,
        check=False,
    )
    assert reply.returncode == 0, (channel, reply.returncode)
    assert reply.stdout == expected, (channel, reply.stdout)
