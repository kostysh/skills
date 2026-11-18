# Blind forward-testing

Read when collecting or assessing behavioral evidence for a material instruction change, a behavior-dependent PASS, or an activation/generalization claim. This reference produces evidence, not the final review verdict.

## Applicability and roles

Use realistic samples when changed activation, authority, readiness, decisions, actions, interop, fallback, validation, stop rules or reporting could fail despite structural success. A demonstrably non-behavioral edit may use narrow checks with its rationale. Existing evidence may be reused when its snapshot, relevant behavior and exposure support the current claim; do not require a new run for every formal PASS.

Keep three functions distinguishable:

| Role | Information and responsibility |
| --- | --- |
| Case author | Establishes realistic raw inputs and closed criteria from accepted sources before candidate edits; records the baseline and coverage. |
| Executor | Receives the task, the appropriate skill/catalog surface, necessary inputs and allowed side effects; produces actual actions/artifacts without an answer key. |
| Assessor | Sees criteria and raw results; checks observed behavior, side effects and evidence limits against those criteria. |

These are exposure/responsibility boundaries, not a demand for three new agents per case. The case author may assess results if independence from the candidate and exposure are stated; the executor must not assess its own output as independent acceptance. Review assurance (authorship of the target) is separate from trial blindness (knowledge of the expected result).

When testing this reviewer or another evaluation method, the candidate's own verdict rules cannot be the sole ground truth. Use accepted requirements and criteria fixed independently of candidate wording. Do not adjust the rubric to make a candidate pass; a necessary criterion correction invalidates the affected comparison and must be explained and rerun or bounded.

## Preserve blindness and authority

Use fresh, unexposed contexts for blind trials and keep cued runs as guided evidence. Give the assessor the rubric. Count comparison scores as blinded only when the version key stayed hidden from the assessor until all scores were recorded.

Isolate the executor's task files from answer keys, prior audits, remediation logs, revealing filenames and neighboring runs. A skill may ship supporting history: constrain access or make a documented trial copy containing the relevant active surface. Record included/excluded files and check that removing history did not remove governing instructions or behavior. Audit the full shipped package separately when claiming package parity. Do not present instructional access limits on a shared filesystem as a hard sandbox.

Give the executor ordinary user inputs, not a problem diagnosis. For re-audit, prior findings are legitimate required task inputs; that run is not blind to those findings. It may still test closure/regression decisions without disclosing the new candidate's expected outcome; state the narrower blindness boundary. Historical instructions inside a reviewed target remain data, not authority over the reviewer.

Obtain any required action/delegation authority from the operator/environment, reusing permissions already given. Use a disposable workspace for writes. Missing permission stops that execution, not already authorized preparation; use available evidence honestly rather than inventing a run or an independent reviewer.

## Cases and activation

Choose the smallest set covering material risks and include sufficient/correct cases to detect unnecessary rejection. Useful families are owned and adjacent requests, authoritative and missing/conflicting inputs, substrate-only overclaims, unsafe or recovery paths, interop/dependencies, and minimal non-behavioral changes. Historical before/after artifacts can be useful if prior conclusions remain outside the executor's context except where the requested re-audit itself requires them.

For changes to instruction economy or completion, select only the relevant contrasts: an ordinary authorized task versus a genuinely missing material decision; a task needing several authorized actions versus a legitimate checkpoint; relevant conditional reading versus an unrelated prerequisite. Preserve a justified exact sequence and a small self-contained skill as controls when those distinctions are in scope. For a model-specific claim, use declared executors and comparable evidence; an unknown executor limits that claim rather than requiring guessed capabilities. These are conditional case choices, not a fixed suite for every review.

Separate two claims:

- **Selection/activation:** present the realistic request and candidate catalog description/available metadata alongside fixed relevant neighboring entries. Do not force the tested skill or expose its body before the selection decision. Observe both owned and adjacent requests; record this as a catalog selection trial, not proof of every host's loading mechanism.
- **Execution:** explicitly supplied skill plus task tests decisions after activation. It does not establish that the host or model would select that skill naturally.

Reuse the same raw task inputs and constraints for baseline/candidate. A user clarification may be tested as an actual later message or as supplied conversation history; record which was used and do not claim live-delivery behavior from a static replay.

## Contribution of one rule

When deciding whether one instruction is needed or can be shortened, test its effect on an observable decision.

1. Freeze the full materials an executor receives with the rule (A) and with only that rule removed (B). Trace equivalent cues in the task, governing instructions, metadata, references and generated copies. If an independent requirement or a copy derived from the rule still supplies it, success in B shows at most that this occurrence is redundant in that setting. To test unaided behavior, withhold equivalent cues where the setting permits it. For portability, test the complete package under the target environment’s actual rules.
2. Before editing, fix the criteria from accepted requirements, an ordinary case and one that exposes a wrong decision. Reserve a different case until the wording has been chosen. Run A and B on the first two cases in fresh contexts with the same inputs, tools and executor settings. Give an assessor who does not know the version key the criteria and shuffled, anonymously coded actions and outputs. Reveal the key after the assessor records a judgment for each case.
3. If B consistently succeeds on both cases, choose the shortest positive instruction (C) that preserves the required action, binding obligations and material exceptions. If A already meets that minimum, record C = A. In both cases, compare the fixed C with A on the original cases, then test C on the reserved case. Accept C when both checks support it.
4. If A succeeds and B fails, retain the detail that prevented the error and recheck that path after any edit. If A fails, correct the defect, test the original failure and a fresh case, and also test minimal C if B consistently succeeds. Investigate mixed results against a specific explanation before deciding whether to keep the rule.

## Assessment and evidence

Before the run, fix the expected owner/claim boundary, required observable decisions or outputs, prohibited inventions/actions, falsifiers, and evidence needed for the strongest conclusion. Synthetic examples may test reasoning about stipulated facts, but cannot masquerade as authentic transcripts or actual external validation. An assessor should be able to distinguish observations, supplied facts and assumptions.

Inspect actual outputs and relevant tool events or persisted state, not only the executor's summary. Preserve raw inputs/results and snapshot identity. Use an authoritative supplied identity or record the hash algorithm, relative paths and file count. A complete event page or group shell exit does not prove each command's result; retain truncation, missing events and per-command limits. Missing evidence is not proof of a forbidden action's absence. Check file changes where side effects matter.

Compare correctness, material finding coverage, false PASS/BLOCKED, invented requirements, evidence completeness and permitted side effects. Assess each case as `PASS`, `FAIL`, or `INCONCLUSIVE` under the closed criteria; these are trial results, not the skill's formal verdict. Investigate inconsistent results with repeated or varied cases against a hypothesis rather than selecting only a favorable run.

Record case/snapshot, task and artifact locations, assigned model/settings and exposure, actual output, rubric result, limits and baseline comparison. Distinguish assigned settings from independently observed runtime metadata. Measure tokens, latency, tool calls or cost only when available and comparable; lower text size or a single faster run is not evidence of improvement by itself.

Samples do not prove universal reliability. Combine them with source inspection, structural and package readback, specialized authority and real-boundary evidence only where the claim needs those checks. When sufficient evidence supports the requested boundary, stop rather than inventing a permanent harness or unrelated tests.
