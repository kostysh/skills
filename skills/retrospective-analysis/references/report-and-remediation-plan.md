# Report, matrix, and remediation plan

Read the mode/output contract before recommendations or a remediation plan.
The full-report and matrix requirements apply only to `full evidentiary` mode.

## Mode and output contract

- `targeted`: give the outcome, relevant evidence pointers, supported causal
  links and unknowns, historical-fix versus prevention/effectiveness status,
  and a proportionate residual recommendation or next owner. Combine these in
  short prose. Do not require a machine-readable matrix, full appendices, or a
  project task hierarchy. Add a numbered plan only when requested; apply the
  relevant recommendation/step fields below without creating full-mode output.
- `full evidentiary`: retain the complete report, machine-readable matrix,
  source disposition, mappings, counts, numbered remediation plan, and required
  independent review specified below. Missing evidence limits this claim; it
  does not silently switch the task to targeted.

In both modes, recommendations address only source-supported residual work.
Creating tasks or implementing recommendations requires its own authority.

## Human-readable full report

Use the smallest structure that preserves these sections:

1. executive summary;
2. analyzed boundary, source inventory, all failed audits, and unavailable data;
3. deduplicated problem matrix;
4. detailed recommendations;
5. numbered remediation plan;
6. limitations and uncertainty;
7. appendices mapping observations, audit findings, problems, recommendations,
   and steps;
8. final reconciled statistics.

Project conventions may rename sections or add frontmatter, but must not weaken
the information contract.

The main text must stand without the matrix: show a few complete, consequential
chains from decision and action through late discovery, correction, and any
recurrence; explain why the expected control did not prevent or detect them.
State observed operator interventions, waiting, and rework with measurement
limits. Give separate verdicts for the delivered result, development process,
and implementation/effectiveness of prevention. Include material justified
stops, authorized scope decisions, rejected findings, and unknown causes where
they change the interpretation. The matrix preserves atomic evidence and
counts; it does not replace this explanation.

Each problem row contains:

- stable problem ID and short title;
- description and occurrences;
- exact evidence pointers;
- primary class and secondary tags;
- severity;
- systemic root cause;
- consequence;
- historical-occurrence status;
- systemic-prevention status;
- effectiveness status when applicable;
- implemented remediation evidence;
- recommendation IDs;
- confidence;
- audit IDs and related artifacts.

Severity expresses consequence and recurrence risk, not how much prose the audit
used. Confidence expresses evidence strength and causal certainty.

## Full-mode machine-readable matrix

Use JSON by default unless project rules require CSV. The machine copy must
preserve, at minimum:

- artifact/schema identity and analyzed boundary;
- source records and unavailable-source records;
- atomic observations and dispositions;
- failed audits and individual findings;
- deduplicated problems;
- recommendations and their statuses;
- history-verification evidence;
- numbered remediation steps;
- all cross-mappings and reconciled counts.

Do not maintain two independent truths. Generate or check the summary counts and
mappings from one stable dataset where practical, and compare the Markdown
claims with the machine copy before review.

Required reconciliation:

- every observation maps to one or more problems, a duplicate occurrence, or a
  justified rejection;
- every audit finding maps to a problem or justified rejection;
- every problem maps to at least one recommendation, accepted no-action
  disposition, or blocker;
- every active recommendation appears in exactly one remediation step;
- cancelled, rejected, superseded, already implemented, and not-applicable
  recommendations do not silently create work;
- source, observation, duplicate, rejected, problem, severity, status,
  recommendation, and step totals agree between report and matrix.

If an operator separately requests analysis of a named session still active
after the original cutoff, add a clearly labeled supplemental cohort with a
fixed timestamp, source prefixes or equivalent integrity boundary, and an
explicitly unknown terminal result. Keep the original session denominator and
audit counts visible and unchanged; give new observations and counts separately
or show the arithmetic between cohorts. Do not silently turn a snapshot into
the final outcome of the active work.

## Recommendations

In full mode, keep detailed proposals outside the compact problem matrix and
give each recommendation the fields below. For targeted work, keep only the
fields needed to understand and act on the bounded recommendation:

- stable ID;
- target file, skill, rule, process stage, test, tool, runtime boundary, or
  domain artifact;
- exact residual change after history verification;
- linked root problems;
- prevention mechanism;
- priority;
- expected effect and approximate complexity;
- acceptance and effectiveness evidence;
- current disposition.

Before accepting a high-severity problem, recurrence after operator correction,
or `no_action` with partial prevention, ask what concrete action before the next
comparable failure would stop it. If work remains, name the owner, change
location, exact residual after verified fixes, a negative acceptance case that
would reject an insufficient correction, and an effectiveness check on a later
comparable task. If no new work is justified, identify the already verified
control and why it covers that failure path; a written rule, closed issue, audit
`PASS`, or absence of another case is insufficient. Do not reimplement a fixed
occurrence or merge different mechanisms merely because they share a symptom.
A future check can test a concrete measure but cannot replace the measure.

Classify recommendations by owning surface, for example:

- project rules and process;
- portable skills and methods;
- tests, linters, or tools;
- runtime, domain, data, or contract work;
- audit-method correction.

Do not recommend automation merely because a defect occurred. A new script,
harness, registry, or workflow is justified only when:

- the repeated risk is named and material;
- existing checks cannot detect it sufficiently;
- the proposed control fails clearly rather than hiding the problem;
- its maintenance cost is lower than expected recurrence cost;
- an owner and effectiveness check exist.

## Numbered remediation plan

For a full retrospective or an explicitly requested plan, use a numbered list
of concrete steps. An operator must be able to say “take step N” without the
implementer making source-owned decisions. retrospective-analysis owns the
recommendation mapping; delivery-planner owns project task decomposition,
dependencies and readiness when those decisions are needed.

Every step contains:

- number and linked recommendation IDs;
- goal and root cause being removed;
- history/current-state verdict;
- exact residual scope;
- target repository, owner, and prerequisite steps;
- concrete changes;
- explicit non-goals;
- acceptance criteria and commands or review evidence;
- effectiveness check;
- publication, audit, and CI expectations where relevant.

Order steps so that downstream work can use accepted controls:

1. foundational skills and methods when later steps depend on them;
2. project rules and process;
3. domain, runtime, and justified tooling work;
4. a final effectiveness gate on comparable future work.

Combine recommendations only when repository, owner, dependencies, residual
change, review path, and evidence are compatible. Otherwise preserve independent
steps even if themes are similar.

Do not reopen verified historical work. A step may validate a current control or
complete residual prevention, but its scope must name what remains after history
verification.

## Full-report acceptance and status

A full report may receive independent audit `PASS` while its program verdict is
`FAIL` because unresolved problems remain. Explain this in plain language:
`PASS` means the analysis is complete and accurate for its boundary; it does not
mean the analyzed project was problem-free or that recommendations are already
implemented.

Report acceptance requires:

- closed or explicitly limited source perimeter;
- all failed audits accounted for;
- zero undispositioned observations;
- evidence-backed root causes;
- second-pass deduplication;
- reconciled report/matrix mappings and counts;
- concrete prevention for all critical and high problems or explicit blockers;
- independent completeness/causality/deduplication review when required.

For that independent review, supply the stable source perimeter and require
attempts to falsify the major causal chains, contested `no_action` decisions,
and sufficiency of residual steps, including repeated failures after
correction. Reconciled arithmetic and links are necessary but not a substitute.
A material later change to the report, mappings, or recommendations makes the
earlier `PASS` historical for its own snapshot.

Task creation needs explicit action/target approval distinct from report
acceptance. Reuse existing approval within that scope; do not ask again merely
because the workflow reached the handoff stage.
