#!/bin/bash
set -o pipefail
printf '%q ' agent-browser --session ui-rev-candidate-browser "$@" >> /tmp/ui-rev-20260908/results-candidate-browser/commands.log
printf '\n' >> /tmp/ui-rev-20260908/results-candidate-browser/commands.log
agent-browser --session ui-rev-candidate-browser "$@" 2>&1 | tee -a /tmp/ui-rev-20260908/results-candidate-browser/commands.log
