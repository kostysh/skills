---
name: retrospective-phase-analysis
description: Perform a retrospective analysis of an agent's completed project phase by reading session traces, stage logs, project artifacts, and skill files; identify incidents, bottlenecks, weak process stages, skill-instruction problems, logging blind spots, and produce evidence-backed Markdown reports with prioritized improvements. Use when a user asks for a retrospective, postmortem, phase review, process analysis, skill effectiveness audit, or logging policy improvement.
compatibility: Requires access to the project workspace, session trace files, stage logs, and Node.js >= 22.22.0 to run scripts/retro-cli.mjs. Works best when stage logs follow a structured logging contract.
---

# Retrospective Phase Analysis

Use this skill when the user asks for a retrospective analysis of a completed project phase, a postmortem of agent execution, an audit of how skills were used, or improvements to logging and development workflow.

## When to use

Use this skill for:

- a completed implementation/review/closure phase that already has evidence artifacts;
- retrospective analysis of agent execution quality, rerounds, bottlenecks, or operator friction;
- auditing whether skills helped or hindered a completed phase;
- identifying logging blind spots and proposing telemetry improvements.

## When NOT to use

Do not use this skill for:

- forward-looking planning of the next phase before evidence exists;
- ordinary code review of a diff or pull request;
- rewriting the workflow itself without first reconstructing what happened in evidence;
- ad hoc opinions about process quality when traces/logs/artifacts are unavailable.

## Interop priority

- This skill owns retrospective method, evidence hierarchy, incident classification, stage weakness analysis, skill-friction analysis, logging-gap analysis, and final report structure.
- Treat `dossier-engineer`, `backlog-engineer`, review skills, and verification skills as evidence sources and workflow context, not as substitutes for retrospective method.
- For packaged CLI authoring and maintenance, use `cli-engineer`; for tests and regression coverage, use `typescript-test-engineer`.

This skill is optimized for agent-executed retrospectives. It assumes the agent can read:

- its session trace or rollout JSONL;
- stage logs;
- produced artifacts;
- skill instructions used during the phase.

Keep the final report evidence-backed. Prefer precise findings over broad judgments.

## Outcomes

Produce one or more Markdown reports that help the operator understand:

- what happened during the phase;
- which problems occurred and their causes;
- where time was spent and why;
- where the process was weak across specification, planning, implementation, review, and closure;
- where skill instructions were unclear, incomplete, misleading, or inefficient;
- which logging gaps reduced observability;
- what should change next.

## Core operating rules

1. Build an evidence inventory before making conclusions.
2. Separate facts, inferred causes, and recommendations.
3. Distinguish process failures from expected iterative development.
4. Treat repeated review findings, rerounds, restarts, aborted turns, and prolonged tool loops as high-signal.
5. Audit skill usage separately from general process issues.
6. Always include data-quality limits and confidence notes.
7. Prefer exact timestamps and artifacts when available.
8. Do not treat successful outcomes as proof that the process was efficient.

## Inputs to collect

At minimum, gather only the preflight anchors first:

- session id when the runtime or operator can provide it;
- session trace JSONL or equivalent;
- candidate `project root` from `session_meta.cwd` when available;
- standard evidence roots only after the candidate `project root` is known;
- stage logs only when the trace links those log paths as created or changed in the analyzed session;
- dossier/spec/plan/implementation artifacts only when trace-derived ids or paths link them into scope;
- review artifacts and verification artifacts only when the trace or linked stage logs point to them;
- skill files used during the phase;
- commit or patch metadata if available.

Do not treat this list as permission for broad repo reading before trace-driven scoping is established.

If an expected input is missing, record the gap explicitly.

## Session id resolution order

The agent owns `session_id` resolution and canonical trace lookup. The CLI does not search the runtime session store on the agent's behalf.

Resolve `session_id` in this order:

1. Use the `session_id` explicitly provided by the operator.
2. If the retrospective request is made inside the same active session, use the current runtime session id.
3. If neither source is available, stop and say that the trace cannot be determined reliably.

In Codex, the runtime may expose the current session id via `CODEX_THREAD_ID`. In another agent runtime, use that runtime's equivalent signal and session-store lookup.

## Quick start from session id only

When you start with only `session_id`, use this minimal path:

1. Resolve `session_id`.
2. Find the canonical rollout/session JSONL trace in your runtime's session store.
3. Read `session_meta.cwd` from the trace.
4. If `session_meta.cwd` is present and reliable, treat it as the candidate `project root`.
5. If `session_meta.cwd` is missing, stale, or cannot be trusted, do not guess. First try an operator-provided project root or a single root implied by repeated trace-linked file paths.
6. If no single candidate `project root` can be confirmed, stop and surface the ambiguity explicitly.
7. Discover standard evidence directories from the confirmed root.
8. Run the first `scan` with the explicit trace file path.

Do not begin with broad repo reading before this preflight is complete.

## Procedure

### 1) Scope the retrospective

Establish:

- phase boundary;
- target feature, slice, or package;
- source-of-truth artifact set;
- output files to produce.

Use trace-driven scoping:

- analyze only tasks, files, and artifacts that are actually mentioned in the session trace;
- do not start with repo-wide reading;
- expand beyond the trace only when a trace-derived id or path links you to the next artifact.
- for `.dossier/logs`, include only the stage-log paths that the trace itself shows as created or changed in the analyzed session.

Active-session boundary rule:

- If the retrospective request is made inside the same active session as the analyzed work, establish the phase boundary before any substantive scan.
- Events after the boundary are excluded from the primary retrospective scope.
- Use `--until-line <n>` or `--until-ts <iso>` when the analyzed phase is a prefix of the trace.
- If the boundary cannot be determined reliably, stop and ask the operator for the boundary instead of scanning the whole active session.

Record the phase boundary explicitly:

- start trigger;
- end trigger;
- included sessions/cycles;
- excluded follow-up work.

When one session mentions multiple work items, partition the scope in this order:

1. explicit canonical backlog item ids such as `CF-016` or `CF-0016`;
2. explicit canonical feature ids such as `F-0016`;
3. linkage through review, verification, or step artifacts;
4. touched file paths;
5. time windows.

Stop expansion when the partition remains ambiguous after those checks. Record the ambiguity in the manifest instead of guessing.

By default, use a durable retrospective root instead of flat files.

- For dossier-driven projects, write under `.dossier/retro/`.
- If the operator explicitly requests another root, use that root.
- If the current working directory and its ancestors are not dossier-managed, fall back to local `out/retro/` relative to the current working directory.

Within the root, keep every analysis under `<scope-slug>/<run-slug>/` so old and new retrospectives never overwrite each other. The standard bundle is:

- `scan-summary.json`
- `retrospective-report.md`
- `skill-audit.md`
- `logging-review.md`

For a retrospective of one session trace, the default `<scope-slug>` is `session-<short-session-id>`. Use a feature semantic slug only when the operator explicitly asks for a feature-scoped retrospective or when one analysis intentionally combines multiple session traces for one feature.

The first `scan` that writes a bundle establishes the canonical run directory. Do not create a second semantic bundle after that scan unless the operator explicitly requested a new run.

Treat `--out <file>` as a low-level override, not the normal workflow.
Treat `--out-root <dir>` as a root only: the CLI chooses and reports the canonical run directory under it.
Treat `--run-dir <dir>` as the exact canonical run directory to reuse for follow-up commands.
Treat `--draft` as an explicitly temporary bundle mode.
Treat auto-discovered paths from `session_meta.cwd` and explicit evidence hints such as `--artifacts-dir` or `--logs-dir` only as read-side inputs; they must not silently redefine the retrospective root.
Treat `--artifacts-dir` only as an evidence hint; it must not silently redefine the retrospective root.

Manual evidence overrides are controlled exceptions:

- Use `--stage-log <path>`, `--review-artifact <path>`, or `--verification-artifact <path>` only when the trace lacks reliable machine-readable write/change evidence but the operator can justify inclusion.
- Every manual override requires `--artifact-evidence <text>`.
- Manual overrides must be recorded as manual inclusion in `scan-summary.json`; they reduce confidence until the agent validates them.
- Do not use manual overrides to widen into repo-wide reading.

### Output path privacy

Do not persist absolute local runtime paths in durable retrospective artifacts. Final Markdown reports and committed `scan-summary.json` files must use display paths such as `<project-root>/...`, `<skills-root>/...`, `<session-trace:<short-session-id>>`, or `<absolute-path:redacted>/...`.

The CLI may print exact operational paths to stdout so the agent can immediately pass `--run-dir` to follow-up commands. Do not copy that raw stdout into committed reports.

### 2) Build the evidence manifest

Create a compact manifest containing:

- files inspected;
- session ids;
- logs used;
- review artifacts used;
- verification artifacts used;
- skill files inspected;
- notable gaps.

Prefer a table or bullet list with path, type, purpose, and relevance.

### 3) Reconstruct the execution timeline

Using the session trace and stage logs, reconstruct:

- stage start;
- meaningful edits or decision points;
- review request and verdict times;
- rerounds;
- backlog actualization;
- closure and commit points.

Identify:

- latency to first review verdict;
- latency from first non-pass to final pass;
- time spent in repeated loops;
- long silent spans;
- phase restarts or abandoned branches.

When timestamps are approximate, mark them as approximate.

### 4) Build an incident register

Create an incident card for each meaningful issue. Include:

- title;
- severity;
- first observed timestamp;
- stage;
- evidence;
- immediate symptom;
- probable root cause;
- contributing factors;
- recovery action;
- residual risk;
- prevention candidate.

Classify incidents at least into:

- process miss;
- specification gap;
- planning weakness;
- implementation defect;
- review effectiveness issue;
- skill instruction problem;
- tool or environment friction;
- logging blind spot;
- coordination or operator-clarification issue.

### 5) Run the skill audit

Derive the skill-audit scope from the injected `Available skills` catalog in the session trace and the bounded operational trace:

- collect skill names and aliases from `Available skills`;
- search those aliases in operational user/assistant messages, tool calls, commands, patch metadata, and structured stage-log skill metrics;
- ignore names that appear only in non-operational summaries, compacted context, or tool-output blobs;
- do not scan every skill folder to discover audit scope.

For every referenced skill:

- identify where it influenced decisions or execution;
- inspect whether the skill instructions were complete enough for the task;
- note confusing, conflicting, missing, or inefficient guidance;
- measure whether the skill likely caused extra loops, extra review churn, or avoidable hesitation;
- distinguish real skill defects from operator-specific constraints not encoded in the skill.

Report for each skill:

- where it helped;
- where it hindered;
- ambiguous instructions;
- missing decision rules;
- missing examples;
- redundant or outdated rules;
- suggested fixes.

When possible, cite concrete evidence such as rerounds, clarification events, or tool misfires after a skill step.

### 6) Analyze stage weaknesses

Analyze the phase by stage:

- specification;
- planning;
- implementation;
- review;
- backlog actualization;
- closure.

For each stage, assess:

- entry quality;
- decision quality;
- handoff quality;
- review readiness;
- traceability;
- avoidable churn;
- closure hygiene.

Look for patterns such as:

- unresolved questions leaking into implementation;
- slice boundaries changing after implementation began;
- review briefs missing relevant context;
- backlog truth changing late;
- closure artifacts produced late or inconsistently.

### 7) Analyze time sinks

Identify tasks or loops that consumed disproportionate time:

- repeated audits;
- schema or contract churn;
- tool retries;
- environment failures;
- ambiguous requirements;
- hidden dependencies;
- skill ambiguity;
- logging or artifact repair.

For each time sink, answer:

- what consumed time;
- why it consumed time;
- whether the delay was necessary;
- what would have shortened it next time.

### 8) Evaluate controls and review effectiveness

Assess whether controls worked:

- spec conformance review;
- code review;
- security review;
- verification;
- smoke or test gates;
- debt audit;
- drift guard;
- backlog actualization checks.

Evaluate:

- which controls caught real problems;
- which controls fired too late;
- which controls were noisy or misleading;
- where coverage was missing;
- where the same class of issue escaped multiple earlier checkpoints.

### 9) Evaluate logging quality

Compare the observed logs with the logging contract:

- required fields present or missing;
- late start markers;
- review-event quality;
- backlog actualization evidence;
- duration accuracy;
- commit traceability;
- process-miss explicitness;
- linkage to verification, review, and step artifacts.

Highlight observability gaps that reduced retrospective confidence.

### 10) Produce reports

Produce at least:

- a main retrospective report;
- a skill-issues section or separate report when skill problems are material;
- a logging-improvement report when the logs limit analysis.

Use the report templates in:

- references/REPORT-TEMPLATE.md
- references/SKILL-AUDIT-TEMPLATE.md
- references/LOGGING-IMPROVEMENTS-TEMPLATE.md

A findings-first draft is acceptable before full template expansion. Do not force the full template before the scope is confirmed.

Write final Markdown analysis content in the operator language. Generated CLI scaffold headings and structural labels are always English. Keep English for direct quotes, commands, paths, identifiers, JSON keys, tool names, skill names, and generated scaffold labels. When using the CLI, pass `--language <language>` to the first `scan`; follow-up commands with `--run-dir` inherit the report language from `scan-summary.json` as metadata. The operator language is not limited to a fixed list.

Generated Markdown is a scaffold, not the final retrospective. The final report is the agent's responsibility after reading and validating the cited evidence. When the CLI marks output as `Status: draft, requires agent validation`, do not present it as final; resolve the listed status reasons first or explicitly document the residual limits.

## Recommended workflow with the CLI

Minimum viable workflow:

1. Resolve `session_id`.
2. Find the trace and read `session_meta.cwd`.
3. Run `scan` to build the first evidence summary and trace-derived scope.
4. Check the candidate incidents and scope ambiguities.
5. Read only the highest-ranked linked evidence.
6. Generate `report`, `skill-audit`, and `logging-review` into the same run directory.
7. Validate all three Markdown scaffolds against the cited evidence before finalizing conclusions.

When Node.js is available, use:

- `scripts/retro-cli.mjs scan --session <file> --language <language>` to inventory evidence and create the canonical retrospective bundle;
- add `--until-line <n>` or `--until-ts <iso>` when active-session retrospective events must be excluded from the analyzed phase;
- add controlled manual artifact overrides only with `--artifact-evidence <text>`;
- read the exact `run_dir` from stdout after `scan`; treat `scan-summary.json` paths as display-safe report content, not as command input;
- `scripts/retro-cli.mjs report --run-dir <run_dir> ...` to add `retrospective-report.md` to that same bundle;
- `scripts/retro-cli.mjs logging-review --run-dir <run_dir>` to add `logging-review.md`;
- `scripts/retro-cli.mjs skill-audit --run-dir <run_dir>` to add `skill-audit.md`.

Read the CLI reference first:

- [CLI reference](references/CLI.md)

The CLI is heuristic. Validate its output against the actual artifacts before finalizing the report.
Do not pass guessed `--logs-dir` or `--artifacts-dir` values when the `project root` is still ambiguous.

## Report quality bar

A good retrospective report should:

- cite exact files and timestamps where possible;
- separate facts from inferences;
- quantify review loops, time sinks, and process misses;
- contain a dedicated skill-friction analysis;
- identify both local fixes and systemic fixes;
- make confidence limits explicit.

## Edge cases

### Missing session trace

Use stage logs, commits, review artifacts, and changed files. State that trace-derived timing and tool metrics are partial.

### Trace present but `session_meta.cwd` missing or unreliable

Do not guess a repo root from broad filesystem search.

Use one of these anchors:

- operator-provided project root;
- a single candidate root implied by repeated trace-linked file paths.

If those anchors do not converge on one reliable root, stop and record the ambiguity instead of widening the search.

### No structured stage logs

Infer stages from artifacts and commits, but downgrade confidence and recommend logging improvements.

### Very large rollout file

Sample structure first, then run the CLI over the full file. Avoid loading everything into the model context when a script can summarize it.

### Multiple features in one session

Partition the evidence in this order:

1. `CF-*`
2. `F-*`
3. review/verification/step artifact linkage
4. touched file paths
5. time windows

If ambiguity remains after this order, keep the ambiguity explicit in the report instead of collapsing multiple scopes into one invented narrative.

### Skill usage is evidence-bound

Do not infer skill usage from topical relevance alone. If the skill name from `Available skills` is not present in the bounded operational trace or structured stage-log skill metrics, leave it out of the skill audit.

## File usage guidance

Read these files on demand:

- [Detailed method reference](references/REFERENCE.md)
- [CLI reference](references/CLI.md)
- [Project adaptation notes](references/PROJECT-ADAPTATION.md)
- [Main report template](references/REPORT-TEMPLATE.md)
- [Skill audit template](references/SKILL-AUDIT-TEMPLATE.md)
- [Logging improvements template](references/LOGGING-IMPROVEMENTS-TEMPLATE.md)
- [Metric vocabulary](assets/metrics-schema.json)

The metric vocabulary is an aspirational reference for manual analysis and future structured logs. Do not treat every listed metric as emitted by the CLI unless it appears in `scan-summary.json`.
