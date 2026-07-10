# Blind forward-testing

Read this reference for material skill behavior changes, a formal PASS that depends on realistic task behavior, or a suspected generalization gap.

## When forward-testing is required

Run blind forward-tests when a change can affect activation, authority, readiness, decisions, actions, side effects, interop, fallback, validation, stop rules, output shape, or completion claims. Also run them when structural validation can pass while the claimed behavior may still fail.

Forward-testing may be skipped for a demonstrably non-behavioral change such as typo-only prose, a supporting-only index correction, or UI wording that does not alter trigger scope. Record why no agent decision, action, handoff, validation, or report can change.

## Preserve blindness

Give the evaluator:

- the packaged skill or exact stable snapshot;
- a realistic user request and only the source artifacts that user would supply;
- necessary execution constraints and allowed side effects.

Do not give the evaluator:

- the suspected defect or expected finding;
- the intended fix or desired verdict;
- prior audit conclusions or remediation notes;
- hidden answer keys in filenames, nearby files, prompts, or retained artifacts.

Use a fresh reviewer context when possible. If the same evaluator is reused after remediation, rebuild from the new raw snapshot and treat prior exposure as reduced independence.

## Scenario selection

Choose the smallest set that covers the material risk. Include applicable families:

| Family | What it probes |
| --- | --- |
| Should trigger | The skill recognizes a representative owned task and produces its contract. |
| Should not trigger | Adjacent authoring, implementation, code review, domain, or operational work is routed correctly. |
| Positive authoritative input | Sufficient sources produce the strongest honest output or handoff. |
| Missing/conflicting input | The skill blocks, limits, or drafts instead of inventing authority. |
| Substrate-only/adversarial | Mocks, files, schemas, scaffolds, tests, or logs cannot close a broader behavior claim. |
| Interop boundary | Upstream inputs and downstream artifacts are assigned to owners that can produce or consume them. |
| Negative/failure path | Invalid, unsafe, unsupported, or recovery behavior is explicit. |
| Minimal change | A non-behavioral diff can justify reduced testing without claiming extra confidence. |

Prefer historical raw before/after snapshots when they have known independent findings. Keep that ground truth from the evaluator, then compare whether the new review method detects the pre-remediation failure class and accepts the corrected snapshot without inventing new requirements.

## Evaluation

Before running the case, define an evaluator-only rubric from authoritative sources:

- expected owner and claim boundary;
- decisions or output fields that must appear;
- prohibited inventions or overclaims;
- observable failure conditions;
- evidence required for the strongest verdict.

Assess the emitted answer or artifact, not only whether the skill was mentioned. A useful forward-test should fail when the skill omits a blocking distinction, makes an invented decision, accepts substrate-only evidence, violates interop, or reports a stronger status than the sources support.

## Reporting

For each case record:

```text
Case: <neutral identifier>
Snapshot: <identity>
Prompt/artifacts: <raw inputs or durable location>
Observed output: <decision/artifact summary>
Rubric result: PASS | FAIL | INCONCLUSIVE
Evidence limit: <what this case does not prove>
```

Forward-tests are samples, not universal proof. Combine them with instruction inspection, structural checks, domain review, and runtime or boundary evidence proportionate to the claim.
