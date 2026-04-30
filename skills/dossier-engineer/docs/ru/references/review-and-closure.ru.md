# Review and closure policy

Closure must prove the right thing. Passing tests and clean code are insufficient when the work item claims product capability.

## 1. Evidence classes

Verification evidence has `evidence_class`:

- `behavioral` — proves observable capability or maintenance scenario;
- `contract` — proves API/schema/protocol contract;
- `unit` — proves isolated logic;
- `integration` — proves interaction between components;
- `security` — proves security condition;
- `performance` — proves latency/throughput/resource constraint;
- `manual` — records manual observation;
- `operational` — proves deploy/run/operate condition;
- `documentation` — proves doc artifact exists;
- `support` — proves infrastructure/support slice correctness.

Capability closure requires `behavioral` evidence. Contract/unit/support evidence can supplement but cannot replace behavioral evidence.

## 2. Review classes

Built-in review classes:

- `concept-conformance-reviewer` — verifies that the work meaningfully advances or preserves the project concept and not just the written task.
- `spec-conformance-reviewer` — verifies that implementation conforms to the work item spec and acceptance criteria.
- `code-reviewer` — checks implementation quality, maintainability, error handling, and integration correctness.
- `security-reviewer` — checks security, privacy, secrets, auth, permissions, dependency and abuse risk.
- `contract-reviewer` — checks protocol/API/schema compatibility.
- `release-reviewer` — checks rollout, migration and operational readiness.

## 3. Concept-conformance review

Concept-conformance review is required for capability work implementation closure.

The reviewer must inspect:

- concept source;
- capability record;
- capability claim;
- work item relation to capability;
- behavioral acceptance criteria;
- anti-claims;
- demo scenario;
- implementation evidence;
- support dependencies;
- guardrail state.

Reviewer question:

```text
Does this work actually deliver, extend, maintain, or verify the claimed capability, or does it merely create infrastructure that resembles progress?
```

A passing concept-conformance review must not be recorded when:

- the demo proves only internals;
- acceptance criteria are only contract/unit/support criteria;
- the work changed scope without change-proposal;
- the capability claim remains incomplete;
- anti-claims contradict observed behavior;
- the work item is support-only but is being counted as capability;
- an existing capability is marked as existing without evidence.

## 4. Spec-conformance review

Spec-conformance review checks whether the implemented result matches the current work item spec.

It must inspect:

- active source refs;
- acceptance criteria;
- dependencies;
- risk fields;
- demo scenario;
- implementation notes;
- verification evidence.

Spec-conformance review does not replace concept-conformance review.

## 5. Behavioral verification

Behavioral verification must show an observable scenario:

```text
actor does X -> system responds Y -> state/effect Z is created -> later/restarted/downstream W holds
```

Acceptable evidence:

- executable end-to-end test;
- integration scenario with real persistence or durable state;
- manual demo with logs/screenshots/recording;
- CLI/API transcript showing state continuity;
- production or staging observation when safe and documented.

Insufficient as sole capability evidence:

- unit tests of repository/service only;
- mock-only interaction;
- schema existence;
- route returns 200;
- status field changed;
- artifact file written;
- lifecycle transition recorded;
- prompt template generated.

Commands:

```bash
dossier-engineer verify run --work <work-id> --stage implementation --profile behavioral-demo
dossier-engineer verify record --work <work-id> --stage implementation --profile behavioral-demo --evidence-class behavioral --verdict pass --summary "<observed behavior>" --evidence <path>
```

## 6. Review freshness

Review and verification freshness is determined by material scope hash.

Material scope includes:

- source refs and source hashes;
- capability refs and capability claim;
- delivery kind and relation;
- acceptance criteria;
- demo scenario;
- anti-claims;
- dependencies;
- risk classification;
- implementation evidence references;
- guardrail relevance.

If any material scope input changes after a PASS review or verification, the evidence becomes stale.

Runtime derives freshness during:

```bash
dossier-engineer review required --work <work-id> --stage implementation
dossier-engineer verify required --work <work-id> --stage implementation
dossier-engineer status --root .
dossier-engineer attention --root .
dossier-engineer lint --root .
```

## 7. Closure gates by delivery kind

### Capability work

Implementation closure requires:

- stage prerequisites closed;
- capability record exists;
- concept source active;
- capability claim complete;
- at least one active behavioral acceptance criterion;
- demo scenario exists;
- anti-claim exists;
- pre-implementation challenge recorded;
- behavioral verification PASS and fresh;
- concept-conformance review PASS and fresh;
- spec-conformance review PASS and fresh;
- code/security/contract/release reviews according to risk;
- no open blockers;
- no open source-review affecting linked sources;
- no triggered guardrail affecting the scope;
- coverage gate green or not applicable;
- post-close hygiene ready to run.

### Support work

Implementation closure requires:

- linked capability or active guardrail;
- support reason recorded;
- verification appropriate to support scope;
- no wording or evidence that counts support as capability;
- concept-conformance review if support is foundational, risky, or part of a long support chain;
- no open blockers/source-reviews/guardrails.

### Maintenance work

Implementation closure requires:

- linked existing capability;
- regression or preservation demo scenario;
- behavioral or integration verification PASS and fresh;
- spec-conformance review when code changes are material;
- no open blockers/source-reviews/guardrails.

### Exploration work

Closure requires:

- bounded question answered;
- evidence or reasoning recorded;
- follow-up work/capability created or explicitly declined;
- no claim of product capability.

## 8. Stage closure gates

### feature-intake

Blocks closure if:

- source refs are invalid;
- delivery kind is missing;
- capability relation is missing for capability/support/maintenance work;
- concept source is missing for new capability;
- intake blockers remain open.

### spec-compact

Blocks capability closure if:

- no behavioral acceptance criterion;
- no demo scenario;
- no anti-claim;
- capability claim incomplete;
- source-review affects linked source.

### plan-slice

Blocks closure if:

- no challenge event;
- no verification profile or manual verification plan;
- risk review requirements unknown;
- support item lacks immediate support reason;
- guardrail is triggered.

### implementation

Blocks closure according to delivery kind gates.

### change-proposal

Blocks closure if accepted changes are not reflected in structured artifacts.

## 9. Hygiene run

After implementation stage closes:

```bash
dossier-engineer hygiene run --work <work-id> --stage implementation
```

Checks:

- source reviews resolved;
- capability gates satisfied;
- behavioral demo fresh when required;
- reviews fresh;
- verification fresh;
- guardrails not triggered;
- queue derivation succeeds;
- attention has no unresolved entry caused by this work item;
- status overlay is consistent;
- changeset recommended for branch work.

Hygiene is not a substitute for review. It verifies that closure evidence remains coherent after closure.

## 10. Failure behavior

Runtime must fail closed:

- never silently close a stage;
- never mark stale review fresh;
- never convert support evidence into behavioral evidence;
- never delete canonical artifacts during normal commands;
- never overwrite immutable review/verification/hygiene/stage-event artifacts;
- never proceed on malformed YAML unless command is `repair frontmatter`;
- never infer missing semantics from body prose for closure;
- never resolve guardrails without explicit evidence or decision.
