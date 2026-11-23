"""Исполняемая учебная модель участка G. Вывод — журнал событий."""
import json
from pathlib import Path

root = Path(__file__).parent
profiles = json.loads((root / "profiles.json").read_text())
loads = json.loads((root / "loads.json").read_text())


def record(job, step, result):
    print(json.dumps({"job": job, "step": step, "result": result}))


for load in loads:
    job = load["job"]
    pieces = set(load["pieces"])
    required = set(profiles[load["profile"]]["dispatchRequires"])
    if required - pieces:
        record(job, "dispatch", "held")
        continue
    record(job, "dispatch", "sent")
    record(job, "receipt", "accepted" if {"map", "legend"} <= pieces else "returned")
