Status: completed

Target: synthetic local Request desk, http://127.0.0.1:43801. Supplied active skill: candidate-v2-active/agent-browser/SKILL.md.

Created Test UI-REV through rendered form (total 3 -> 4), searched it from list, opened /items/4, reloaded, observed Name textbox still Test UI-REV. Extracted all 4 titles across both list pages: Alpha, Beta, Gamma, Test UI-REV; final Next disabled, total 4. Deleted only Test UI-REV, observed total 3 and surviving Gamma on page 2, Alpha/Beta on page 1.

Real browser HTTP traffic to synthetic local server; no interception or source/API/seed changes. POST 201, GET detail after reload 200, paginated GETs 200, DELETE /api/items/4 200. This is not product or external integration evidence.

Runtime: agent-browser 0.27.3; installed version-matched core guidance and help inspected. Chrome 152.0.7977.82; headless, 1280x720, --no-sandbox required by container SUID error. XDG_RUNTIME_DIR isolated under results/runtime because default socket directory read-only. Long-lived shell maintained browser across calls after standalone calls lost daemon lifetime. Browser session ui-rev-browser-v2 only.

Cleanup: close returned Browser closed; subsequent ps in owning shell showed only sandbox, shell and ps (no browser or daemon), then shell exit 0. Ctrl-C launcher exit 130 did not terminate server: TCP port still accepted connections. Host process inspection located node PID 980862; /proc cwd and UI_REV_PORT=43801 independently confirmed ownership. SIGTERM to that PID followed by server PID absent, esbuild child 980874 absent, port connect_ex=111. No task server/browser remains.

Model/settings: developer identifies GPT-6 based Codex; exact runtime model identifier and reasoning effort are not exposed in this agent context. No overrides selected and no agent-browser AI chat used.

Evidence: raw-commands.json, extraction.json, detail-reloaded.png. Initial version/help and runtime troubleshooting outputs are present in tool transcript; raw-commands.json preserves material successful user workflow and cleanup commands/results. No skill verdict issued.
