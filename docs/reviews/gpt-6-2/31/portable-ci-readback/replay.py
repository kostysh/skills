"""Replay the installer decision from a recorded site, in a temporary project copy."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

import yaml

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("site", type=Path, help="An extracted before/site or after/site directory")
parser.add_argument("action", type=Path, help="The v4 pnpm/action-setup checkout containing dist/")
parser.add_argument("--manifest-version", help="Try a different packageManager pin in the temporary copy")
args = parser.parse_args()
dist = args.action.resolve() / "dist"
digest = hashlib.sha256((dist / "index.js").read_bytes()).hexdigest()
if digest != "0afb261fe492f337c1d2a0447cffeecad890b7a7ca7c52570c744e08017748a9":
    raise SystemExit("The action entry does not match the published revision used for this observation.")

def evaluate(site, step, substitute):
    configured_version = step.get("with", {}).get("version", "")
    if not isinstance(configured_version, (str, int, float)) or "${{" in str(configured_version):
        raise SystemExit("This local replay expects the literal input used in the captured jobs.")

    with tempfile.TemporaryDirectory(prefix="pnpm-action-observation-") as scratch:
        root = Path(scratch)
        project = root / "site"
        shutil.copytree(site, project)
        manifest = project / "package.json"
        about = json.loads(manifest.read_text())
        if substitute:
            about["packageManager"] = "pnpm@" + substitute
            manifest.write_text(json.dumps(about))

        state = root / "state"
        state.mkdir()
        env = {
            "PATH": os.environ["PATH"],
            "npm_config_cache": str(root / "npm-cache"),
            "npm_config_userconfig": str(root / "npmrc"),
            "CI": "true",
            "RUNNER_TEMP": str(state),
            "GITHUB_WORKSPACE": str(project),
            "INPUT_VERSION": str(configured_version),
            "INPUT_DEST": str(root / "install"),
            "INPUT_RUN_INSTALL": "null",
            "INPUT_CACHE": "false",
            "INPUT_CACHE_DEPENDENCY_PATH": "pnpm-lock.yaml",
            "INPUT_PACKAGE_JSON_FILE": "package.json",
            "INPUT_STANDALONE": "false",
            "NPM_CONFIG_UPDATE_NOTIFIER": "false",
            "XDG_CACHE_HOME": str(root / "cache"),
            "XDG_DATA_HOME": str(root / "data"),
            "XDG_STATE_HOME": str(state / "user"),
            "COREPACK_ENABLE_DOWNLOAD_PROMPT": "0",
        }
        for key in ("OUTPUT", "STATE", "PATH", "ENV"):
            target = root / ("runner-" + key.lower())
            target.touch()
            env["GITHUB_" + key] = str(target)

        launch = subprocess.run(
            ["node", str(dist / "index.js")],
            cwd=project, env=env, text=True, capture_output=True, timeout=65,
        )
        installed = None
        for added_path in Path(env["GITHUB_PATH"]).read_text().splitlines():
            pnpm = Path(added_path) / "pnpm"
            if pnpm.is_file():
                probe = subprocess.run(
                    [str(pnpm), "--version"],
                    cwd=project, env=env, text=True, capture_output=True, timeout=30,
                )
                installed = {"exit": probe.returncode, "version": probe.stdout.strip()}
                break
        return {
            "exit": launch.returncode,
            "versionInput": str(configured_version),
            "packageField": about.get("packageManager"),
            "installed": installed,
            "output": (launch.stdout + launch.stderr).replace(str(root), "{temporary}")[-2100:],
        }


site = args.site.resolve()
config = yaml.safe_load((site / ".github/workflows/docs-quality.yml").read_text())
steps = [s for s in config["jobs"]["docs-quality"]["steps"] if s.get("uses") == "pnpm/action-setup@v4"]
if len(steps) != 1:
    raise SystemExit("Expected one setup step in this captured workflow.")
result = evaluate(site, steps[0], args.manifest_version)
print(json.dumps(result, indent=2))
raise SystemExit(0 if result["exit"] == 0 and (result.get("installed") or {}).get("exit") == 0 else 1)
