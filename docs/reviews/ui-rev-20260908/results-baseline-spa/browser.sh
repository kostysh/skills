#!/bin/bash
export XDG_RUNTIME_DIR=/tmp/ui-rev-20260908/results-baseline-spa/runtime
printf '%q ' agent-browser --session ui-rev-base-spa "$@" >> /tmp/ui-rev-20260908/results-baseline-spa/commands.log
printf '\n' >> /tmp/ui-rev-20260908/results-baseline-spa/commands.log
agent-browser --session ui-rev-base-spa "$@" 2>&1 | tee -a /tmp/ui-rev-20260908/results-baseline-spa/browser-raw.log
exit "${PIPESTATUS[0]}"
