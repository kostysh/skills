# Capability governance

The purpose of capability governance is to prevent the process from replacing product capability with infrastructure readiness.

## 1. Basic definitions

### Capability

Capability is an observable system ability that a user, operator, integration system, or end-to-end scenario can verify.

Capability claim formula:

```text
actor performs trigger X -> system responds Y -> state/effect Z is produced -> later/restarted system preserves or uses W
```

Capability is not the existence of a table, API, test, status, lifecycle transition, background job, schema, tool call, queue, prompt, model wrapper, or deployment scaffold.

### Capability record

Capability record is the canonical artifact `CAP-*.md`, which describes the capability independently of a specific task.

Capability record is needed to:

- record the product map;
- connect backlog work with concept;
- verify that support work serves a capability;
- onboard an existing project;
- analyze product progress.

### Work item

Work item is a delivery unit that has a relation to capability:

- `introduces` - creates a new capability;
- `extends` - expands an existing/intended capability;
- `supports` - creates an infrastructure prerequisite;
- `maintains` - preserves or restores an existing capability;
- `verifies` - proves or clarifies a capability;
- `retires` - removes or stops supporting a capability.

## 2. Delivery kind policy

Runtime creates a work item with `delivery.kind`.

Allowed values:

- `capability` - delivers observable behavior.
- `support` - enables capability but does not deliver observable behavior by itself.
- `maintenance` - preserves, restores, or corrects existing observable behavior.
- `exploration` - answers a bounded question without delivery claim.

Rules:

1. `feature` work defaults to `delivery.kind = capability` unless the agent explicitly creates support work.
2. `refactor`, `migration`, `operations`, `test`, `documentation`, and `debt` work default to `support` or `maintenance`.
3. Runtime blocks closure when delivery kind contradicts acceptance criteria, demo evidence, or review results.
4. Support item must not be counted as completed product capability.
5. Capability item must not close with only support/infrastructure acceptance criteria.
6. Maintenance item must link to an existing capability.
7. Exploration item must produce a decision, follow-up, or explicit no-follow-up outcome.

## 3. Capability claim

Capability claim is machine-owned frontmatter populated through runtime:

```bash
dossier-engineer capability claim set --capability <capability-id> --actor "<actor>" --trigger "<trigger>" --behavior "<observable behavior>" --response "<system response>" --state-change "<state/effect>" --continuity "<later or restarted behavior>"
```

Required fields:

- `actor` - who initiates the capability;
- `trigger` - which action or event starts the behavior;
- `observable_behavior` - what can be observed externally;
- `system_response` - what result the system returns;
- `state_change` - what is saved, changed, sent, or executed;
- `continuity` - what must work later, after restart, repeated request, rerun, or in a downstream flow.

If a field is unknown, the agent creates a blocker or leaves the capability as `partial/unverified`; it must not invent a weak claim.

```bash
dossier-engineer work blocker add --work <work-id> --kind requirement-gap --summary "<missing capability field>"
```

## 4. Behavioral acceptance criteria

Capability work must have at least one active acceptance criterion with `kind = behavior`.

Behavioral criterion states an observable scenario, not an internal implementation fact.

Acceptable:

```text
When the operator asks the system to resume a previous investigation, the system loads prior dossier context, explains what it remembers, and continues from the last unresolved blocker.
```

Not acceptable as the only criterion:

```text
A sessions table exists.
```

```text
The API returns 200 for POST /sessions.
```

```text
Unit tests cover the session repository.
```

Runtime command:

```bash
dossier-engineer work acceptance add --work <work-id> --kind behavior --text "<criterion>" --source <source-id>#<anchor>
dossier-engineer work acceptance add --work <work-id> --kind negative --text "<forbidden observable behavior>" --source <source-id>#<anchor>
dossier-engineer work acceptance add --work <work-id> --kind falsifier --text "<condition that would prove the capability is not integrated>" --source <source-id>#<anchor>
```

Support or infrastructure criteria may exist, but they cannot satisfy capability closure by themselves.

Runtime does not infer testability from arbitrary anti-claim prose. If the agent
marks an anti-claim as testable in `Spec Compact`, that claim must be represented
as `negative` or `falsifier` acceptance before spec-compact closure.

## 5. Demonstration scenario

Every capability item requires a demo scenario before spec-compact closure and passing demo evidence before implementation closure.

Demo scenario must answer:

1. What does the actor do?
2. What does the system return?
3. What state/effect is created?
4. How is persistence, continuity, downstream use, or recovery verified?
5. What would falsify the claim?

Runtime command:

```bash
dossier-engineer work demo set --work <work-id> --name "<demo name>" --scenario "<actor does X; system responds Y; state Z persists; later W holds>"
```

Implementation closure requires behavioral verification:

```bash
dossier-engineer verify run --work <work-id> --stage implementation --profile behavioral-demo
```

or:

```bash
dossier-engineer verify record --work <work-id> --stage implementation --profile behavioral-demo --evidence-class behavioral --verdict pass --summary "<observed behavior>" --evidence <path>
```

For user-visible/operator-visible capability work, implementation closure
requires live-app behavioral evidence through the named production path:

```bash
dossier-engineer verify record --work <work-id> --stage implementation --profile behavioral-demo --evidence-class live-app --entrypoint "<actual app entrypoint>" --runtime-path "<production path>" --verdict pass --summary "<observed behavior>" --evidence <path>
```

Capability work is treated as user-visible/operator-visible unless `Plan Slice`
records an explicit non-user-visible rationale. Mock, headless, unit, contract,
and support evidence can support closure, but cannot be the only passing
behavioral-demo evidence for user-visible capability work.

Capability records can also hold baseline demonstration evidence:

```bash
dossier-engineer capability demo record --capability <capability-id> --verdict pass --summary "<observed existing behavior>" --evidence <path>
```

## 6. Anti-claims

Anti-claims are explicit non-goals that prevent self-deception.

Capability work must include at least one anti-claim before spec-compact closure.

Runtime command:

```bash
dossier-engineer work anti-claim add --work <work-id> --text "<this item does not implement ...>"
```

Capability-level anti-claims:

```bash
dossier-engineer capability anti-claim add --capability <capability-id> --text "<this capability does not provide ...>"
```

Good anti-claims:

- "This work does not implement autonomous deployment."
- "This work does not train or fine-tune a model."
- "This work does not provide long-term memory beyond registered dossier records."
- "This work does not make the agent act without operator approval."

Rules:

1. Anti-claims are not excuses for missing capability.
2. Anti-claims define the boundary between delivered behavior and unsupported implication.
3. If an anti-claim contradicts the capability claim, open change-proposal.
4. If implementation accidentally relies on something listed as an anti-claim, open change-proposal.

## 7. Pre-implementation challenge

Before implementation, the agent must challenge the plan.

Runtime command:

```bash
dossier-engineer work challenge record --work <work-id> --summary "<why the plan may be wrong>"
```

Challenge must cover:

- how the plan could deliver infrastructure without capability;
- which steps are stubs or placeholders;
- which tests could pass while product behavior remains absent;
- which user expectations are implied but not written;
- what would count as self-deception;
- which dependencies could hide unfinished behavior;
- where concept conformance might fail.

`plan-slice` cannot close for capability work until a challenge event exists.

For support work, the challenge must state why the support slice is needed now and which capability would be blocked without it.

## 8. Concept conformance

Concept conformance asks:

```text
Does this work actually move the project concept forward, or does it merely create the appearance of progress?
```

Concept conformance differs from spec conformance:

- spec conformance checks whether the task was implemented as specified;
- concept conformance checks whether the task specification itself is a valid slice of the concept.

Capability work requires concept-conformance review before implementation closure:

```bash
dossier-engineer review record --work <work-id> --stage implementation --class concept-conformance-reviewer --verdict pass --reviewer <reviewer-id>
```

Plan-slice should also receive concept-conformance review when:

- the item is broad or foundational;
- the capability claim is novel;
- the work is likely to drift into infrastructure;
- the project has no recent passing end-to-end demonstration;
- guardrails are close to triggering.

A concept-conformance review must inspect:

- concept sources;
- capability record;
- work relation to capability;
- behavioral acceptance criteria;
- demo scenario;
- anti-claims;
- support dependencies;
- implementation evidence when reviewing closure.

## 9. Infrastructure masquerade detection

Runtime `capability check` flags work items that look like capability but contain only support evidence.

Command:

```bash
dossier-engineer capability check --root .
```

Findings include:

- capability record without concept source;
- capability record without complete claim;
- capability work item without capability reference;
- capability work item without behavioral acceptance criterion;
- capability work item without demo scenario;
- capability work item without anti-claim;
- capability work item whose acceptance criteria are only contract/unit/infrastructure criteria;
- capability work item closed without behavioral verification;
- capability work item closed without concept-conformance review;
- support item not linked to capability or guardrail;
- repeated support closure without recent capability demonstration;
- generated mocks, statuses, repositories, or tables counted as capability evidence;
- existing capability marked `existing` without demo evidence.

`capability check` is read-only and returns next actions.

## 10. Guardrails and kill criteria

Guardrails stop a project from accumulating support work while the intended product remains absent.

A guardrail is a project-level criterion such as:

```text
If five closed support work items pass without an end-to-end capability demonstration, stop support slicing and open a change-proposal.
```

```text
If no scenario demonstrates perceive -> decide -> act -> remember -> explain by milestone M, stop adding infrastructure and review the concept decomposition.
```

Runtime commands:

```bash
dossier-engineer guardrail add --title "<title>" --condition "<trigger condition>" --action "<required action>"
dossier-engineer guardrail check --root .
dossier-engineer guardrail resolve --guardrail <guardrail-id> --summary "<resolution>"
```

When a guardrail triggers:

1. Stop creating new support work in the affected scope.
2. Open a change-proposal or concept review.
3. Demonstrate an end-to-end capability or revise the decomposition.
4. Resolve the guardrail only with explicit evidence or project decision.

## 11. Existing-project baseline

Existing-project baseline records already working functionality without pretending that historical development happened inside the dossier.

Commands:

```bash
dossier-engineer baseline create --title "Existing product baseline" --mode existing-project --source <source-id>
dossier-engineer baseline capability add --baseline <baseline-id> --capability <capability-id> --status observed --evidence <path>
```

Baseline statuses:

- `observed` - behavior was demonstrated and evidence recorded;
- `assumed` - believed to exist, but not yet demonstrated;
- `unverified` - insufficient evidence;
- `partial` - works only in limited scope;
- `regressed` - previously observed but now broken.

Rules:

1. `existing` capability requires at least one observed baseline or demo evidence.
2. `partial` and `unverified` capabilities can be used as development targets but not as proof of current product behavior.
3. New work should extend or maintain existing capability instead of duplicating it.
4. Baseline evidence can be a manual scenario, test output, screenshot, recording, logs, or a written observation when no better evidence exists.

## 12. Default closure gates by delivery kind

### Capability

Required before implementation closure:

- active concept source reference;
- capability record exists;
- capability claim complete;
- at least one active behavioral acceptance criterion;
- demo scenario defined;
- anti-claim present;
- pre-implementation challenge recorded;
- behavioral verification PASS and fresh;
- concept-conformance review PASS and fresh;
- spec-conformance review PASS and fresh;
- code/security reviews according to risk;
- no open source reviews, blockers, or triggered guardrails affecting the item.

### Support

Required before closure:

- support link to capability or active guardrail;
- reason why this support is needed now;
- verification appropriate to support scope;
- no claim that the support item delivers product behavior;
- attention entry if support budget is being consumed without recent demo.

### Maintenance

Required before closure:

- existing capability identified;
- regression scenario or demonstration recorded;
- verification proves preservation or restoration of behavior.

### Exploration

Required before closure:

- bounded question answered;
- result recorded;
- follow-up capability/support items created or explicitly declined.

## 13. Agent operating rule

Before implementing any work item, the agent must be able to state:

```text
This item delivers/supports exactly this capability; this is how it will be observed; this is what it explicitly does not deliver; this is how the plan could fool us; this is the evidence that will close it.
```

If the agent cannot state that, it must not start implementation. It must refine the work item, add blockers, or open a change-proposal.
