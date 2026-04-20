#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  run-fixture-scratch.sh <fixture-name> -- <backlog-engineer command args...>

Example:
  run-fixture-scratch.sh refreshable-backlog -- refresh --source-path ./sources/docs/modules/auth.md

The script copies a tracked backlog fixture to a temporary directory and runs
the built backlog-engineer CLI there, so fixture snapshots in git stay clean.
EOF
}

if [[ $# -lt 3 ]]; then
  usage >&2
  exit 2
fi

fixture_name=$1
shift

if [[ ${1:-} != "--" ]]; then
  echo "Expected '--' after fixture name." >&2
  usage >&2
  exit 2
fi
shift

if [[ $# -eq 0 ]]; then
  echo "Missing backlog-engineer command arguments." >&2
  usage >&2
  exit 2
fi

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
skill_root=$(cd "${script_dir}/.." && pwd)
fixture_root="${skill_root}/test/fixtures/backlogs/${fixture_name}"
cli_path="${skill_root}/scripts/backlog-engineer.mjs"

if [[ ! -d "${fixture_root}" ]]; then
  echo "Fixture not found: ${fixture_name}" >&2
  exit 1
fi

scratch_dir=$(mktemp -d "${TMPDIR:-/tmp}/backlog-fixture-${fixture_name}-XXXXXX")
cp -R "${fixture_root}/." "${scratch_dir}"

echo "scratch_dir=${scratch_dir}" >&2

(
  cd "${scratch_dir}"
  exec node "${cli_path}" "$@"
)
