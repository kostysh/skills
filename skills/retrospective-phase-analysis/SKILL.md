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

Record the phase boundary explicitly:

- start trigger;
- end trigger;
- included sessions/cycles;
- excluded follow-up work.

When one session mentions multiple work items, partition the scope in this order:

1. explicit backlog item ids such as `CF-*`;
2. explicit feature ids such as `F-*`;
3. linkage through review, verification, or step artifacts;
4. touched file paths;
5. time windows.

Stop expansion when the partition remains ambiguous after those checks. Record the ambiguity in the manifest instead of guessing.

By default, place generated outputs under a local `out/` directory for first-pass analysis. Write inside a project-owned documentation or analysis directory only when the operator or project convention explicitly requires durable project artifacts.

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

Use these confidence levels:

- `confirmed_used`: direct trace or stage-log evidence shows the skill was used;
- `probably_used`: the trace strongly suggests the skill influenced execution, but the linkage is indirect;
- `implicitly_relevant`: the skill is contextually relevant, but usage is not evidenced directly.

For every skill that reaches at least `probably_used`:

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

## Recommended workflow with the CLI

Minimum viable workflow:

1. Resolve `session_id`.
2. Find the trace and read `session_meta.cwd`.
3. Run `scan` to build the first evidence summary and trace-derived scope.
4. Check the candidate incidents and scope ambiguities.
5. Read only the highest-ranked linked evidence.
6. Decide whether `report`, `skill-audit`, or `logging-review` are needed.

When Node.js is available, use:

- `scripts/retro-cli.mjs scan --session <file> --out out/scan-summary.json` to inventory evidence and generate metrics;
- `scripts/retro-cli.mjs report ...` to create a draft retrospective report;
- `scripts/retro-cli.mjs logging-review ...` to generate logging findings;
- `scripts/retro-cli.mjs skill-audit ...` to generate a skill-focused draft.

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

### Skill usage is implicit

Use `implicitly_relevant` only when you cannot connect the behavior to the relevant skill file, stage artifact, or repeated action pattern. Do not promote implicit relevance to a stronger claim without direct evidence.

## File usage guidance

Read these files on demand:

- [Detailed method reference](references/REFERENCE.md)
- [CLI reference](references/CLI.md)
- [Project adaptation notes](references/PROJECT-ADAPTATION.md)
- [Main report template](references/REPORT-TEMPLATE.md)
- [Skill audit template](references/SKILL-AUDIT-TEMPLATE.md)
- [Logging improvements template](references/LOGGING-IMPROVEMENTS-TEMPLATE.md)
- [Metric definitions](assets/metrics-schema.json)
