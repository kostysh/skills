#!/bin/bash
printf '%q ' agent-browser --session ui-rev-candidate-spa "$@" >> /tmp/ui-rev-20260908/results-candidate-spa/commands.log
printf '\n' >> /tmp/ui-rev-20260908/results-candidate-spa/commands.log
XDG_RUNTIME_DIR=/tmp/ui-rev-20260908/results-candidate-spa/runtime agent-browser --session ui-rev-candidate-spa --args '--no-sandbox' "$@" 2>&1 | tee -a /tmp/ui-rev-20260908/results-candidate-spa/browser-raw.log
exit "${PIPESTATUS[0]}"
