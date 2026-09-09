#!/usr/bin/env bash
set -o pipefail
log=/tmp/design-tools-rev-20260909/base-b0-evidence/commands.log
printf '\n$ %s\n' "$*" | tee -a "$log"
"$@" 2>&1 | tee -a "$log"
status=${PIPESTATUS[0]}
printf 'EXIT: %s\n' "$status" | tee -a "$log"
exit "$status"
