"""Исполняемая учебная модель печати. Вывод — журнал выдачи."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).parent
for shot in json.loads((root / "shots.json").read_text()):
    profile_bytes = (root / shot["source"]).read_bytes()
    profile = json.loads(profile_bytes)
    cell = shot["id"]
    if shot["action"] == "manual" or profile["labelId"] == "literal":
        printed = cell
    else:
        printed = str(int(cell))
    print(json.dumps({
        "job": shot["job"],
        "station": shot["station"],
        "release": profile["release"],
        "profile_sha256": hashlib.sha256(profile_bytes).hexdigest(),
        "action": shot["action"],
        "ordered": cell,
        "printed": printed,
        "receipt": "accepted" if printed == cell else "returned",
    }))
