"""Hide the randomized parent directory also printed by Git at the mount boundary."""
from pathlib import Path
import study
import assess

original = assess.anonymous

def hide_mount_path(text, work):
    return original(text, work).replace(str(Path(work).parent), "<temporary directory>")

assess.anonymous = hide_mount_path
study.packets()
