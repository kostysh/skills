#!/usr/bin/env bash
set -euo pipefail
out=/tmp/ui-rev-20260908/results-candidate-components
export XDG_RUNTIME_DIR=/tmp/ui-rev-20260908/candidate-components/.runtime
export XDG_CONFIG_HOME=/tmp/ui-rev-20260908/candidate-components/.config
setsid env UI_REV_PORT=43785 npm start > "$out/server.txt" 2>&1 &
server_pid=$!
ab(){ agent-browser --session ui-rev-candidate-components --args '--no-sandbox' "$@"; }
cleanup(){ ab close > "$out/cleanup.txt" 2>&1 || true; kill -TERM -- "-$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; }
trap cleanup EXIT
for i in {1..40}; do if curl -fsS http://127.0.0.1:43785/components > "$out/ssr.html"; then break; fi; sleep .2; done
ab open http://127.0.0.1:43785/components
ab snapshot -i > "$out/initial-snapshot.txt"
ab eval --stdin < browser-check.js > "$out/browser-check.json"
ab snapshot -i > "$out/final-snapshot.txt"
ab errors > "$out/browser-errors.txt"
ab console > "$out/browser-console.txt"
