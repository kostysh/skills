Status: completed

Target: disposable synthetic HTTP application at http://localhost:43787/; fixture /tmp/ui-rev-20260908/candidate-browser.
Supplied active skill: /tmp/ui-rev-20260908/candidate-active/agent-browser/SKILL.md.
Browser session: ui-rev-candidate-browser; agent-browser 0.27.3, Chrome 152.0.7977.82 (doctor).

Observed initial list: Page 1 of 2; total 3 (Alpha, Beta visible).
Created Test UI-REV via New request and Create; observed total 4.
Searched Test UI-REV; observed one matching list row. Opened its link; URL http://localhost:43787/items/4 and Name Test UI-REV.
Reloaded detail; Name remained Test UI-REV. Screenshot reloaded-detail.png.
Back to requests returned unfiltered list. Page 1: Alpha, Beta, total 4. Next led to page 2: Gamma, Test UI-REV, total 4, Next disabled. Complete extraction in extraction.json.
Deleted only Delete Test UI-REV on page 2. Observed Gamma only and Page 2 of 2; total 3.

Network: actual browser requests to local synthetic server; no interception configured. Recorded POST /api/items 201, GET /api/items/4 200 including after reload, both list pages GET 200, DELETE /api/items/4 200. This is not product/external integration evidence.

Cleanup: agent-browser close returned Browser closed. Own npm start process in exec session 35001 stopped by Ctrl-C; exit code 130. No source/API/seed edits performed.

Environment issue: initial browser open and snapshot failed because /run/user/1000/agent-browser was read-only in sandbox. Escalated doctor --offline --quick succeeded (6 pass, 0 warn, 0 fail); subsequent own-session commands succeeded with approved escalation. Server startup reported WebSocket port 24678 already in use, but HTTP UI at 43787 worked; no changes to other processes were made.

Substantial command/results transcript: commands.log. Startup command UI_REV_PORT=43787 npm start from fixture directory; startup output UI_REV_URL=http://127.0.0.1:43787. Full installed CLI guidance and help retained. Initial version output: agent-browser 0.27.3.

Model/settings: runtime instructions identify Codex based on GPT-6. Exact serving model ID and reasoning-effort setting are not exposed to this agent; no override requested or made. No skill verdict issued.
