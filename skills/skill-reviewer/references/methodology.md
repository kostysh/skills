# Skill review methodology

Read this reference before conducting or reporting any `skill-reviewer` assessment.

## Review modes and assurance

| Mode | Use | Minimum reviewed surface |
| --- | --- | --- |
| `baseline` | Review a whole current skill or establish defects before remediation. | Entire active package plus relevant source, generated, runtime, test, asset, UI, and supporting evidence. |
| `change` | Review a stable scoped change. | Exact diff and base, plus unchanged guidance needed to understand triggers, precedence, interop, runtime, and output. |
| `re-audit` | Verify remediation and closure. | Prior findings, remediation matrix, current stable snapshot, and adjacent regression surface. |

Record assurance separately from mode:

- `independent`: reviewer did not author or remediate the reviewed snapshot;
- `self-review`: useful internal check, but its strongest verdict is `PROVISIONAL`;
- `unknown`: independence cannot be established; do not issue `PASS`.

## Required input contract

Before classification, obtain or derive:

1. target skill name and folder or packaged artifact;
2. mode, included scope, explicit exclusions, and source precedence;
3. stable snapshot identity: immutable revision, aggregate content hash, or exact diff plus base revision;
4. claimed capability, actor or consumer, trigger, expected output or action, target-side effects, and downstream consumer;
5. source-of-truth and active instruction surfaces;
6. generated, runtime, test, asset, UI, and supporting surfaces relevant to the claim;
7. previous findings and remediation evidence for `re-audit`;
8. reviewer action boundary, including which checks are read-only, may write locally, or cross an external boundary.

Apply explicit user and repository precedence before inferring from the skill. A generated file cannot override its declared source of truth. Supporting history may explain intent but cannot silently become mandatory guidance. Return `BLOCKED` when a missing or moving target, unresolved equal-authority conflict, unavailable mandatory source, or unbounded scope prevents reproducible conclusions.

## Reviewer autonomy and check side effects

Treat a review request as authority to inspect and report, not to remediate. By default, read in-scope local files, inspect relevant history and logs, compute snapshot identity, and run checks known to be read-only.

Before running a command, determine whether it can regenerate files, update caches or snapshots, install dependencies, stage or commit changes, write externally, incur cost, or otherwise alter the review basis. Run a potentially writing check in a disposable copy when that preserves the evidence boundary. Otherwise, do not run it without separate authority; report the missing check and what it limits. Never mutate the reviewed snapshot during an independent review.

External writes, destructive actions, purchases or material cost, agent delegation, and material scope expansion require authority from the applicable user or environment policy. Missing optional validation does not automatically make the review `BLOCKED`; block only when the requested verdict depends on evidence that cannot be obtained safely.

## Capability and anti-claim frame

Describe the claim before reviewing prose:

```text
When <request/condition> is presented by <actor>, the skill guides the agent to
make <decision/action>, produce <observable output>, and hand it to <consumer>
without inventing <protected authority or fact>.
```

Then state anti-claims. Common examples:

- documentation-only guidance does not create runtime capability;
- compiler success does not prove correct task behavior;
- tests and mocks do not prove a real external boundary unless they exercise or conform to it;
- a review verdict does not implement its recommendations;
- a narrow API or substrate claim does not close a broader user workflow.

Classify each artifact relative to this exact boundary. The same API, template, or report may be capability for its direct consumer and substrate for a broader claim.

## Surface inventory

Inventory only surfaces relevant to the review, but do not omit a surface that can change behavior:

| Surface | Review question |
| --- | --- |
| Source of truth | Where must maintainers edit, and what wins on conflict? |
| Generated | Is it current, readable, complete, and compiler-owned? |
| Active normative | Can the agent reach every mandatory rule from `SKILL.md`? |
| Optional active | Is each load trigger precise enough for progressive disclosure? |
| Supporting/historical | Is it clearly non-normative and prevented from overriding active guidance? |
| Runtime/commands | Does shipped help and behavior match documented inputs, outputs, errors, and paths? |
| Tests/evidence | What behavior is actually exercised, and what remains simulated? |
| Assets/templates | Do they preserve or contradict the active contract? |
| UI metadata | Does it trigger the right tasks without claiming broader ownership? |

For a change review, inspect affected unchanged guidance whenever the diff changes interpretation, precedence, routing, readiness, fallback, commands, or output shape.

## Instruction audit lenses

### Purpose and activation

- Is the capability observable for a named actor or consumer?
- Do description and UI metadata cover real triggers and exclude adjacent work?
- Is the parsed frontmatter `description` no more than 300 Unicode code points after trimming? Astral characters such as emoji count as one code point; combining marks count separately.
- When a description is shortened, does it preserve the owned capability, material should-trigger cases, should-not-trigger boundaries, and responsibility routing?
- Can should-not-trigger requests be routed without loading or misusing the skill?

### Inputs, authority, and readiness

- Are minimum useful inputs separated from inputs required for a stronger handoff or verdict?
- Can the skill distinguish missing, insufficient, lower-authority, and unresolved conflicting sources?
- Can the output claim greater authority or readiness than its inputs?

### Outputs and stop rules

- Is the output shape explicit enough for the next consumer to act without inventing intent, architecture, domain facts, or evidence?
- Are partial, blocked, draft, unsupported, or not-assessed states representable?
- Are stop rules aligned with precedence and fallback rules?

### Responsibility and interop

- Does each decision belong to the named skill?
- Can the named upstream owner actually produce the requested input?
- Can the downstream owner act on the handoff without performing an unassigned decision?
- Does the target route specialized facts to domain owners while preserving its own contract?

### Instruction integrity

- Are outcome, constraints, allowed side effects, validation, fallback, and reporting explicit?
- Are normative rules atomic, deterministic, and free of vague precedence?
- Is each normative rule canonical in one active location instead of being restated across the root and required references?
- Do examples illustrate sourced rules instead of inventing product, architecture, domain, or error contracts?
- Is the root concise while required detail remains reachable?

### Evidence integrity

- Find the least-real implementation or response that can pass each success criterion.
- Reject acceptance that can pass through file existence, metadata, generated prose, route/schema presence, mocks, stubs, self-authored logs, or happy-path examples alone.
- Match proof to claim boundary: structural checks prove structure; unit tests prove exercised units; contract tests prove the tested contract; real-boundary evidence proves only the observed boundary and conditions.
- Attach claims to inspected artifacts, distinguish direct observations from reviewer inference, and state unresolved source conflicts.
- Treat absence as "not found in the reviewed scope," not as proof that an artifact, behavior, or capability does not exist elsewhere.

## Finding model

Consolidate symptoms with one root cause. Every material finding must include:

```text
<severity> <short title>
Evidence: <artifact and precise location or observed behavior>
Basis: <direct | inferred | conflicting, with uncertainty or source precedence when relevant>
Failure path: <request/condition -> wrong decision/output/action/claim>
P1 screen: <credible P1 outcome, or none with evidence showing why no P1 outcome is credible>
Capability impact: <what the actor or downstream consumer cannot trust>
Remediation direction: <bounded correction, or root-cause investigation when recurrence shows the problem model may be incomplete>
Verification: <evidence that would close the finding>
```

Severity rules:

| Severity | Meaning | PASS effect |
| --- | --- | --- |
| `P1` | Can create false capability or closure, dangerous action, silent authority invention, fundamental contradiction, or systematically wrong routing. | Blocks `PASS`. |
| `P2` | Materially weakens interop, parity, portability, evidence, reproducibility, progressive disclosure, or important edge-case behavior. | Blocks `PASS`. |
| `P3` | Bounded clarity or polish improvement with no credible path to a wrong material decision or claim. | Does not block `PASS`. |

Classify severity from the finding's own credible failure path, not from correction size or whether the final verdict is already blocked. If that path can create false capability or closure, dangerous action, silent authority invention, a fundamental contradiction, or systematically wrong routing, assign `P1`. Use `P2` only when those `P1` outcomes are not credible; the `P1 screen` must state the evidence that keeps the impact below `P1`.

Keep the severity, failure path, and `P1 screen` internally consistent. A supporting, historical, optional, or non-normative surface does not by itself justify downgrading a finding when the stated failure path still lets a maintainer or consumer publish, approve, close, or act as if capability were proven. To keep an evidence-integrity or reproducibility finding at `P2`, bound its failure path to auditability, parity, portability, or confidence loss and explain why no credible consumer can turn it into closure, authority, dangerous action, fundamental contradiction, or systematic routing.

Before selecting the verdict, re-read every finding's severity, failure path, and `P1 screen`; resolve any contradiction.

Do not lower severity because a defect appears only in prose when prose is the runtime instruction surface. Do not raise style preference to P2 without a concrete failure path.

Treat an isolated description-length violation as `P3` when no credible material routing, trigger, or progressive-disclosure failure path exists. Escalate to `P2` or `P1` only when direct evidence or a supported inference satisfies the corresponding severity definition above; do not infer material impact from character count alone.

## Verdict contract

Choose exactly one:

- `PASS`: independent review, stable identified snapshot, no unresolved P1/P2, structural checks appropriate to the package passed, and behavioral evidence is proportionate to every material claim;
- `FAIL`: at least one P1/P2 remains on an assessable snapshot;
- `BLOCKED`: a stable review basis or required evidence is unavailable, so neither PASS nor FAIL is supportable for the requested scope;
- `PROVISIONAL`: self-review completed and may contain useful findings, but independence is absent. Never present it as closure.

P3-only observations may accompany `PASS`. A missing optional check is not automatically `BLOCKED`; state its evidence limit and block only when the absent evidence is necessary for the requested claim.

## Output template

```markdown
## Skill review

- Mode / assurance:
- Snapshot / scope:
- Claimed capability and actor:
- Anti-claims:
- Surface inventory:
- Reviewer actions / side effects:

### Findings

<P1/P2/P3 findings, or "No material findings">

### Evidence

- Structural and parity checks:
- Rendered/package readback:
- Runtime/test evidence:
- Forward-tests and evidence limits:

### Remediation status

<finding -> change -> evidence -> status; required for re-audit>

### Verdict

`PASS | FAIL | BLOCKED | PROVISIONAL`

- Rationale:
- Next owner and smallest required action/evidence:
```

## Re-audit and snapshot invalidation

During remediation, a separate implementing agent maintains `finding -> concrete change -> evidence -> status`. The reviewer checks the correction against the original failure path, scans adjacent rules for contradictions or regressions, and issues a verdict only for the new snapshot.

If a re-audit after remediation repeats the same or a materially related P1/P2, do not recommend another point fix. Treat recurrence as evidence that the problem model or remediation scope may be incomplete; re-examine assumptions, the full failure path, adjacent contracts and surfaces, and the root cause before proposing further remediation.

Any change to an active instruction, required reference, relevant runtime or test contract, generated output, UI trigger, or reviewed evidence invalidates the previous PASS. A narrowly bounded supporting-log correction may use a delta re-audit only when it cannot alter the reviewed capability or evidence interpretation; record that rationale.

## Stop rules

- Stop and return `BLOCKED` when the snapshot moves during review.
- Stop before domain judgment when the required specialized authority is unavailable; route it to the relevant domain skill.
- Do not run a check against the reviewed snapshot when it may write; use a disposable copy or report the evidence limit.
- Do not grant PASS from compiler success, self-review, or unexecuted proposed tests.
- Do not require a runtime or permanent test harness for a documentation-only skill unless a repeated deterministic operation justifies it.
