# Evidence, causality, and deduplication

Read this reference for every `full evidentiary` retrospective and whenever
source closure, prior-fix verification, audit causality, deduplication, or
attribution to an owning layer is material.

For targeted work, use the relevant evidence and causal checks with concise
locators and explicit unknowns. Full source/observation registers, exhaustive
streams and count reconciliation below belong to the full-mode claim; reading
this reference for one prior fix or causal question does not activate them.

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

## Computed summary for full mode

Use an independently computed collector summary for the analyzed scope and
window. Take figures from the summary and use primary evidence to interpret
them and verify the underlying classifications. If the summary lacks an
aggregate, compute it deterministically from its records or the reconciled
matrix. Reconcile differences in coverage and classification before reporting
a complete count.

When the summary is missing, deliver supported observations, identify the
unavailable metrics, and mark the full retrospective incomplete. When coverage
is partial, label the affected measures partial or unavailable. Identify the
missing sources or intervals and limit dependent conclusions. An observed zero requires adequate coverage.

## Solo decision receipts

When the scope includes adopted solo decisions, reconcile the collector with
the stable decision IDs, class, original choice and owner receipts. Count each
distinct applied decision once. A batch message, replay, confirmation and
linked rework can refer to the same decision. Count a reversal once when an
owner changes that decision. Keep held proposals and pending items separate
from changed decisions. A passing check on an old head provides no evidence
that the replacement was verified.

Use source coverage for the denominator and observed owner dispositions for
the changed share and time to confirmation. Use the actual blocked intervals
for operator wait. When a receipt, time or coverage is missing, show the
known counts and identify the affected metric as partial or unavailable.

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
- linked problem ID, original observation ID for a duplicate, or reason for
  rejection or unresolved status;
- control that closes the observation, with verification evidence or the check
  still needed. For a rejection, cite the evidence that disposes of it.

An observation must not combine several causes merely because they appeared in
one audit paragraph or session episode.

## Operator interventions before problem grouping

In full mode, after closing the source boundary and before starting from an
existing problem list, inspect direct operator interventions, stops, and
requests to remember or retain a working rule. Select material episodes by
their effect on the outcome, repeated behavior, acceptance, or operator work;
this is not a mandatory record for every message. For each selected episode,
reconstruct the prior decision and authority, what the agent said or saved,
the first next action where the instruction applied, any recurrence after
correction, and observable rework, waiting, or manual checking. Distinguish
measured intervals from operator estimates and do not infer token or monetary
cost from frustration or event counts.

Keep counterexamples in the same pass: an authorized limited scope is not
unilateral narrowing, and a justified safety, authority, or tool stop is not
automatically a process failure. A later discovery that the agreed result was
unfit for its promised acceptance may still be a separate problem.

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

For a repeated failure, compare the rule or skill revision effective at each
decision, whether it was available and actually read, conflicting instructions,
the exact choice of action or tool, and the check that should have caught the
failure before audit, CI, stage, or the operator did. A current rule does not
prove historical availability; historical reading does not prove application.
“The agent applied an existing rule inconsistently” describes recurrence but
does not by itself explain the mechanism. If the traces cannot distinguish
memory loss, interpretation, tool availability, or deliberate bypass, record
the mechanism as `unknown` and limit the remedy to what the evidence supports.

Assign the supported cause to the responsible layer and route the remedy to
its owner. Check the environment and tools, harness configuration, portable
methodology, project adaptation, skill, and requirements or specification.
In partial adoption, compare the local rule with the actual package rule
effective for the work before attributing a defect to the package. Cite the
relevant rule and adoption boundary. Attribute the cause to model behavior
only when evidence supports it and rules out the other plausible layers. If
the evidence cannot distinguish them, leave the attribution unknown.

Use more specific tags where helpful, such as skill misuse, a missing automated
check, implementation or test defect, document/code drift, or audit-method defect.

## Failed-audit analysis

For every finding:

- preserve audit ID and exact finding pointer;
- inspect the artifact snapshot that the auditor reviewed;
- verify the requirement or criterion against its owning source;
- decide whether the finding was valid, false positive, imprecise, or
  over-prescriptive;
- trace when the defect entered and why prior controls missed it;
- record the remediation and whether it changed the root or only the occurrence.

For material valid findings, identify whether the independent auditor was the
first to detect the defect. Compare the author's self-check and its actual
oracle or scope with the finding's falsifier; do not infer a missing self-check
merely from a later audit failure. Keep every finding occurrence, including
repeats and false positives. Link repeated findings to their original
observation.

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
