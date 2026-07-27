# Evidence, causality, and deduplication

Read this reference for every `full evidentiary` retrospective and whenever
source closure, prior-fix verification, audit causality, or deduplication is
material.

## Evidence perimeter

Begin with the requested phase boundary and discover evidence classes that can
change the result. Typical classes are:

- operator and agent messages, session traces, tool calls, outputs, errors,
  retries, restarts, interruptions, and compaction boundaries;
- source requirements and decisions, plans, specifications, architecture,
  implementation, tests, migrations, logs, runtime evidence, CI, and tracker
  state;
- every `FAIL` audit and remediation cycle within scope;
- rules, methods, and skills that governed the analyzed work;
- histories of all repositories that may own a claimed fix.

This is a discovery guide, not permission for indiscriminate broad reading. Name
the relevance rule for each class and stop expanding when it cannot affect the
stated claim.

For every source record capture:

- stable local source ID;
- type and authority;
- path, revision, timestamp, audit ID, command, trace event, or other exact
  pointer;
- reason for inclusion;
- availability, truncation, integrity, and supersession limits;
- disposition into one or more observations, or a reason it contains no
  relevant observation.

Unavailable sources are evidence limits. If a missing class could reverse a
full-retro verdict, the result is `blocked` or explicitly incomplete rather than
`PASS`.

## Atomic observations

An observation records one evidence-backed event, mismatch, omission, repeated
attempt, or control. Keep these fields:

- observation ID;
- factual statement;
- exact evidence pointer;
- source type and time/revision;
- inference, if any, separately labeled;
- affected outcome and consequence;
- status: accepted, duplicate occurrence, rejected, or unresolved;
- linked problem ID or rejection reason.

An observation must not combine several causes merely because they appeared in
one audit paragraph or session episode.

## Full-mode independent streams

Run three analytical streams or passes:

1. session and workflow analysis: commands, tool failures, retries, assumptions,
   context loss, planning, testing, coordination, verification, and operator
   friction;
2. exhaustive failed-audit analysis: every finding, artifact defect, criterion,
   remediation, re-audit, and timing of detection;
3. independent completeness, causality, and deduplication review of the stable
   combined result.

Use separate no-fork agents for these streams when the operator and runtime
authorize them. Provide sources and hierarchy explicitly, but do not leak the
author's conclusions to the independent reviewer. If independence is required
and unavailable, stop before an accepted full verdict.

## Causal chain

For each accepted problem answer in order:

1. What observable defect or inefficiency occurred?
2. What immediate condition produced it?
3. What systemic condition allowed that immediate cause to exist or recur?
4. Which expected control failed to prevent it, and why?
5. Which expected check failed to detect it earlier, and why?
6. What consequence followed or could plausibly follow?

The systemic root must explain the occurrences and point to a preventive control.
“Agent error”, “missed requirement”, “test failed”, and “audit found it” are
usually symptoms or immediate causes, not sufficient roots.

Possible contributing classes include weak or absent skill instruction, ambiguous
method, incorrect skill application, missing project rule, absent automated
check, implementation or test defect, document/code drift, tool limitation, and
audit-method defect. Assign a class only when primary evidence supports it.

## Failed-audit analysis

For every finding:

- preserve audit ID and exact finding pointer;
- inspect the artifact snapshot that the auditor reviewed;
- verify the requirement or criterion against its owning source;
- decide whether the finding was valid, false positive, imprecise, or
  over-prescriptive;
- trace when the defect entered and why prior controls missed it;
- record the remediation and whether it changed the root or only the occurrence.

Do not assume every valid artifact defect is caused by the skill used to create
it. Conversely, repeated findings across artifacts may support a skill or
method-level cause when the instructions lack the needed control.

## Historical fix verification

Search the repository that owns the claimed correction. A project problem may
have been fixed in a separate skills, infrastructure, or product repository.

Use this evidence ladder:

1. commit subject or issue reference locates a candidate;
2. actual commit diff shows what changed at that time;
3. current target state shows whether the fix remains present;
4. focused tests or static checks show the control is exercised;
5. independent audit shows conformance of the changed artifact;
6. runtime or future comparable evidence shows behavior where applicable.

Choose only the evidence levels relevant to the claim, but never stop at level 1.
Record separate verdicts for:

- historical occurrence: fixed, partial, not fixed, superseded, or not
  applicable;
- systemic prevention: implemented, partial, not implemented, superseded, or
  not applicable;
- effectiveness: demonstrated, not yet demonstrated, failed, or not applicable.

## Deduplication

One problem row represents one systemic root plus one prevention mechanism.

Merge occurrences when:

- the same systemic condition explains them;
- the same owner and control would prevent recurrence;
- merging does not hide materially different consequences or status.

Keep separate rows when:

- similar symptoms have different causes;
- different owners or controls are required;
- one issue is an audit defect and another is an artifact defect;
- one is historical and fixed while another is a current unresolved mechanism,
  unless the two-status model keeps that distinction explicit.

After the first grouping, perform a second pass:

- search observations with no problem or rejection;
- look for one root split only by file or audit;
- look for over-merged rows containing multiple prevention mechanisms;
- compare problem titles, causes, recommendations, owners, and evidence;
- reconcile raw observations, rejected observations, duplicate occurrences, and
  final problem counts.
