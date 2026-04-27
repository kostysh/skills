# Detailed retrospective method reference

## 1. Evidence hierarchy

Prefer evidence in this order:
1. Session trace / rollout JSONL
2. Structured stage logs
3. Explicit artifact identity and links declared by included stage artifacts
4. Review artifacts
5. Verification artifacts
6. Produced project artifacts
7. Skill files
8. Commit metadata and diffs
9. Final summary messages

Higher-ranked evidence wins when sources disagree, unless the higher-ranked source is obviously incomplete.

## 1a. Scope derivation rule

Derive retrospective scope from the session trace first.

Use only tasks and artifacts that are mentioned in the trace or linked from trace-derived ids and paths.

Do not begin with broad repo-wide reading. Expand only through explicit linkage.

For `.dossier/logs`, use the strictest linkage rule: include only stage-log paths that the trace shows as created or changed in the analyzed session.

For review, verification, and step artifacts, use explicit links from included stage logs or bounded stage state before broad trace mentions. A feature id in a file name is not sufficient by itself for auto-inclusion.

Do not broad-scan helper-managed `.dossier/stages/*` state. Read it only from a bounded path derived from an already included stage log.

## 1b. Scope partition order

When one session mixes multiple work items, partition in this order:
1. explicit artifact identity from included stage artifacts, such as `primary_feature_id`, `primary_backlog_item_key`, or `phase_scope`
2. explicit canonical backlog item ids such as `CF-016` or `CF-0016`
3. explicit canonical feature ids such as `F-0016`
4. review, verification, or step-artifact linkage
5. touched file paths
6. time windows

If ambiguity remains after this order, keep the ambiguity explicit instead of inventing a single merged narrative.

## 1c. Metrics precedence

Structured fields win over prose heuristics.

- Count `process_misses` or `process_misses_total` before parsing prose `Process misses` sections.
- Count `skills_used` before legacy `skill` metadata or trace-only skill hints.
- Treat structured `review_events` with `FAIL` or `non-compliant` verdicts as candidate-incident evidence before a final PASS artifact.
- Do not double-count prose evidence when structured evidence exists for the same log.
- Record source quality for metrics; unvalidated prose fallback requires agent validation before final report finalization.

## 2. Finding taxonomy

Use these classes consistently:
- **Incident**: A concrete failure, deviation, blocker, or costly misstep.
- **Weak signal**: A small symptom that is not yet a confirmed problem.
- **Root cause**: The most plausible underlying cause based on evidence.
- **Contributing factor**: Something that amplified the issue but was not sufficient on its own.
- **Control**: A review, gate, test, or checklist that should prevent or detect a problem.
- **Blind spot**: Missing or weak telemetry that reduced confidence.

## 3. Severity model

Recommended scale:
- **Critical**: materially threatened correctness, security, or phase completion.
- **High**: caused substantial rework, hidden risk, or major schedule drag.
- **Medium**: caused localized inefficiency or reduced confidence.
- **Low**: minor friction, documentation gap, or low-cost noise.

## 4. Time-sink identification rules

Flag a task as a time sink when at least one of these is true:
- it took unusually long relative to its complexity;
- it required repeated audit or validation loops;
- it involved repeated tool retries or command reformulations;
- it was delayed by unclear instructions, missing prerequisites, or poor observability;
- it triggered multiple downstream corrections.

Explain whether the sink was:
- necessary complexity;
- avoidable friction;
- avoidable ambiguity;
- avoidable process miss;
- environment or tooling overhead.

## 5. Skill-friction heuristics

A skill likely has a quality problem when one or more of these appear:
- the agent paused or hesitated around a required action;
- the agent used a wrong review order or skipped a mandatory check;
- the same instruction had to be reinterpreted mid-flow;
- the skill omitted key decision rules or exit criteria;
- the skill created false blockers or false confidence;
- the skill forced excessive manual inference from scattered references.

Possible remediations:
- add decision tables;
- add examples for non-obvious cases;
- separate normative rules from optional guidance;
- add stronger entry and exit criteria;
- reduce instruction ambiguity;
- encode review policy explicitly;
- add machine-readable sidecar assets.

Skill audit scope:
- use the injected `Available skills` catalog as the authoritative list of possible skills for the current runtime;
- match those skill names and aliases against bounded operational trace evidence and structured stage-log skill metrics;
- ignore copied `Available skills` catalogs, large copied text blobs, compacted summaries, and tool-output blobs as active usage evidence;
- prefer explicit skill file opens, command/path fields, concise operational messages, and included stage-log `skills_used` metrics;
- include only referenced skills in `skill-audit.md`;
- do not include skills solely because they are topically relevant.

## 6. Stage weakness questions

### Specification
- Were requirements complete enough before implementation started?
- Did implementation discover unresolved normative decisions?
- Did threshold terms require late interpretation?

### Planning
- Were slice boundaries stable?
- Were dependencies and fallbacks identified early enough?
- Did planning include drift guard and review strategy?

### Implementation
- Did implementation stay inside stage scope?
- Were failures mostly logic defects, concurrency defects, contract drift, or boundary drift?
- Was there evidence of design thrash?

### Review
- Did reviews catch distinct classes of issues?
- Were reviews timely?
- Did rerounds arise from avoidable omissions?

### Backlog actualization
- Did backlog truth change promptly and durably?
- Was actualization evidenced, not merely implied?

### Closure
- Were verification, review, commit, and step-close artifacts linked?
- Was closure delayed by missing process telemetry?

## 7. Confidence scoring

Give every major conclusion a qualitative confidence:
- **High**: directly supported by multiple strong sources.
- **Medium**: supported by one strong source or several weaker ones.
- **Low**: plausible inference with limited evidence.

## 8. Data quality versus agent context

Data quality describes evidence-source availability and reliability.

Data-quality checks include:
- raw trace present or missing;
- session parse errors;
- phase boundary reliability;
- missing expected artifacts;
- manual artifact overrides and their evidence;
- metric source quality.

Agent-context factors describe execution-context factors separately from data quality.

Agent-context factors include:
- compaction events;
- long gaps;
- interrupted or resumed context;
- handoff or summary reliance;
- known context ambiguity during execution.

Do not classify `compacted` as a data-quality limitation when the raw trace is available and parsed. Mention it as an agent-context factor only when it is material to interpreting behavior.

## 9. Minimum deliverable set

For a serious phase retrospective, produce:
- executive summary;
- evidence manifest;
- timeline summary;
- incident register;
- stage weakness analysis;
- skill audit;
- time sinks;
- control effectiveness;
- prioritized improvements;
- data-quality limits.
- agent-context factors when material.

## 10. Suggested operator-facing recommendations

Structure recommendations by horizon:
- **Immediate**: fixes before the next phase.
- **Near-term**: fixes for the next 1-3 similar cycles.
- **Systemic**: changes to skills, workflow, or telemetry.

Before proposing new fields or log schema changes, check whether the problem is already solved by:
1. existing canonical artifacts;
2. workflow sequencing;
3. prompt recipes.

Propose schema/log expansion only when those mechanisms are insufficient, and name the remaining gap.

## 11. Anti-patterns to avoid

Do not:
- overfit conclusions to one noisy event;
- confuse successful rerounds with efficient process;
- count every review finding as a process failure;
- hide uncertainty;
- treat missing telemetry as proof that nothing happened.
- treat agent-context factors as evidence-source loss when the raw evidence is available and parsed.
