# Report, matrix, and remediation plan

Read this reference before producing a full report, machine-readable matrix,
recommendation set, or independently assignable remediation plan.

## Human-readable report

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

## Machine-readable matrix

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

## Recommendations

Keep detailed proposals outside the compact problem matrix. Give each
recommendation:

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

The final plan is a numbered list of concrete steps, not a package taxonomy plus
a second checklist. An operator must be able to say “take step N” without the
implementer making source-owned decisions.

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

## Acceptance and status

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

Task creation is a later, separately approved operation.
