#!/usr/bin/env bash
set -o pipefail
printf '%q ' agent-browser --session dtr-joint "$@" >> /tmp/design-tools-rev-20260909/joint-evidence/browser-transcript.txt
printf '\n' >> /tmp/design-tools-rev-20260909/joint-evidence/browser-transcript.txt
agent-browser --session dtr-joint "$@" 2>&1 | tee -a /tmp/design-tools-rev-20260909/joint-evidence/browser-transcript.txt
