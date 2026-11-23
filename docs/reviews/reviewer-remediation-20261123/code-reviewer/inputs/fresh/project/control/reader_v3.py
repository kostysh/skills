"""Приёмочная сверка строки считывателя В3. Выдаёт результат в stdout."""
from hashlib import sha256
from pathlib import Path
import subprocess
import sys


def main():
    source = Path(sys.argv[1]) / "slip.py"
    series = (
        ("F", 0, b"F   /000\r\n"),
        ("YQ", 52, b"YQ  /052\r\n"),
        ("ABCD", 999, b"ABCD/999\r\n"),
    )
    for route, stop, expected in series:
        result = subprocess.run(
            [sys.executable, "-B", str(source), route, str(stop)],
            capture_output=True,
            check=False,
        )
        if result.returncode or result.stdout != expected:
            print(f"V3 REJECT {route} {stop} {result.stdout!r}")
            return 1
    print(f"V3 ACCEPT {sha256(source.read_bytes()).hexdigest()} {len(series)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
