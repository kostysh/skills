"""Operate the connected project browser. See README.md for commands."""
import json
import pathlib
import socket
import sys

channel = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
channel.settimeout(20)
channel.connect(str(pathlib.Path(__file__).parent / ".window"))
channel.sendall((json.dumps(sys.argv[1:]) + "\n").encode())
response = json.load(channel.makefile("r"))
print(json.dumps(response, ensure_ascii=False, indent=2))
sys.exit(1 if "error" in response else 0)
