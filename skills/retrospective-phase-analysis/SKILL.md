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

At minimum, try to gather:

- session trace JSONL or equivalent;
- stage logs for the phase;
- relevant dossier/spec/plan/implementation artifacts;
- review artifacts and verification artifacts if present;
- skill files used during the phase;
- commit or patch metadata if available.

If an expected input is missing, record the gap explicitly.

## Procedure

### 1) Scope the retrospective

Establish:

- phase boundary;
- target feature, slice, or package;
- source-of-truth artifact set;
- output files to produce.

Record the phase boundary explicitly:

- start trigger;
- end trigger;
- included sessions/cycles;
- excluded follow-up work.

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

For every skill clearly used during the phase:

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

## Recommended workflow with the CLI

When Node.js is available, use:

- `scripts/retro-cli.mjs scan ...` to inventory evidence and generate metrics;
- `scripts/retro-cli.mjs report ...` to create a draft retrospective report;
- `scripts/retro-cli.mjs logging-review ...` to generate logging findings;
- `scripts/retro-cli.mjs skill-audit ...` to generate a skill-focused draft.

Read the CLI reference first:

- [CLI reference](references/CLI.md)

The CLI is heuristic. Validate its output against the actual artifacts before finalizing the report.

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

### No structured stage logs

Infer stages from artifacts and commits, but downgrade confidence and recommend logging improvements.

### Very large rollout file

Sample structure first, then run the CLI over the full file. Avoid loading everything into the model context when a script can summarize it.

### Multiple features in one session

Partition the evidence by feature id, cycle id, file path, or artifact linkage before making conclusions.

### Skill usage is implicit

Treat the skill assessment as lower-confidence unless you can connect the behavior to the relevant skill file, stage artifact, or repeated action pattern.

## File usage guidance

Read these files on demand:

- [Detailed method reference](references/REFERENCE.md)
- [CLI reference](references/CLI.md)
- [Project adaptation notes](references/PROJECT-ADAPTATION.md)
- [Main report template](references/REPORT-TEMPLATE.md)
- [Skill audit template](references/SKILL-AUDIT-TEMPLATE.md)
- [Logging improvements template](references/LOGGING-IMPROVEMENTS-TEMPLATE.md)
- [Metric definitions](assets/metrics-schema.json)
