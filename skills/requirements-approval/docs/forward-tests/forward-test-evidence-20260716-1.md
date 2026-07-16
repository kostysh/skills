# Blind forward-test evidence: requirements-approval 0.2.0

- **Дата:** 2026-07-16
- **Режим:** blind, read-only, fixture-backed
- **Normalized behavior snapshot:** `8f2830900e249b49cbe52fd8e5b23156901f7a40ea614dca466362180df3d06d`
- **Файлов в snapshot:** 5
- **Итог:** 7/7 PASS

## Граница и воспроизводимость

Три fresh исполнителя не получили историю задачи или ожидаемые ответы. Им разрешалось читать только `SKILL.md` и явно названные fixtures. `skill.yaml`, `evals/evals.json`, supporting docs, Git history и ответы других исполнителей были запрещены. Файлы, GitHub, Gmail и Git не изменялись.

Behavior snapshot покрывает точные inputs исполнителей: `SKILL.md` и четыре `evals/fixtures/*.md`. Чтобы supporting evidence не создавало циклический hash drift через compiler metadata, значение единственной строки `skillforge-source-hash` в `SKILL.md` нормализуется в `<normalized>`; весь остальной content остаётся byte-exact. Для отсортированного relative path и содержимого каждого файла в SHA-256 добавляются 8-byte big-endian длина пути, путь, длина содержимого и содержимое.

Fixture SHA-256:

- `authorized-handoff-input.md`: `10adb7f8ac233b9f034670a3b2fe59fca114715c5ed382db21a28452a8ef07b0`
- `closure-input.md`: `07f20d727758ef428f19f2cd142fecdd1a94b47011620c2251ddb6f1e53a99ab`
- `prepare-input.md`: `216553d5c136f8c26af27bfa201b451c6e8989f1433ac26b65cb88d32985face`
- `reply-input.md`: `6f5661352de5c4225c36eb60d0c05ca47d5b1fa5d1689181ca223dc6afa80537`

Проверки подтверждают instruction-following на supplied/exported data, authority/side-effect boundaries, owner routing, deterministic requested-outcome states и refusal substrate-only closure. Они не подтверждают connector credentials или живую GitHub mutation: по выбору оператора external verification была read-only.

## Рубрика

| Case | Capability boundary | Result |
| --- | --- | --- |
| 1 | internal resolution, Italian customer draft, architecture routing, no writes | PASS |
| 2 | execute request without target/mapping/authorization becomes `blocked` | PASS |
| 3 | complete owner answer advances independently of partial joint-owner answer | PASS |
| 4 | comment and unrelated commit cannot prove closure | PASS |
| 5 | equal-authority conflict cannot be resolved by recency | PASS |
| 6 | pure PRD authoring routes to the PRD-authoring capability, not approval workflow | PASS |
| 7 | exact authorized GitHub handoff preserves targets, output IDs, side-effect scope, and readback | PASS |

До closure run два development прогона выявили недетерминированный `draft|blocked` выбор и неявное owner routing. Active contract получил узкие изменения: states теперь зависят от requested outcome, а non-approval PRD authoring явно передаётся PRD owner. Case 7 добавлен для позитивной owner-producibility проверки. Closure evidence ниже получено заново на одном финальном normalized behavior snapshot; старые outputs не используются как closure evidence.

## Raw prompts

### Runner A

````text
Run three blind, read-only behavior cases for `requirements-approval`. Read ONLY `skills/requirements-approval/SKILL.md`, `skills/requirements-approval/evals/fixtures/prepare-input.md`, and `skills/requirements-approval/evals/fixtures/authorized-handoff-input.md`. Do not inspect skill.yaml, evals/evals.json, docs, other fixtures, git history/diff/status, or other agents. Do not write files or mutate GitHub/Gmail/Git. Apply the skill naturally and return complete user-facing answers separated as `CASE 1`, `CASE 2`, and `CASE 7`. CASE 1 using prepare-input.md: “Prepare approval requests from the supplied open questions. Do not write to external systems.” CASE 2 using prepare-input.md: “Create the approval tasks now from the supplied material.” CASE 7 using authorized-handoff-input.md: “Prepare the exact execution handoff for this authorized approval task. The test is read-only; do not perform the mutation.” Do not discuss this executor instruction.
````

### Runner B

````text
Run two blind, read-only behavior cases for `requirements-approval`. Read ONLY `skills/requirements-approval/SKILL.md`, `skills/requirements-approval/evals/fixtures/reply-input.md`, and `skills/requirements-approval/evals/fixtures/closure-input.md`. Do not inspect skill.yaml, evals/evals.json, docs, other fixtures, git history/diff/status, or other agents. Do not write files or mutate GitHub/Gmail/Git. Apply the skill naturally and return complete user-facing answers separated as `CASE 3` and `CASE 4`. CASE 3 using reply-input.md: “Process this customer reply and update the approval workflow without external writes.” CASE 4 using closure-input.md: “The customer answered retention and there is already an issue comment and commit. Mark the approval complete.” Do not discuss this executor instruction.
````

### Runner C

````text
Run two blind, read-only behavior cases for `requirements-approval`. Read ONLY `skills/requirements-approval/SKILL.md`. Do not inspect skill.yaml, evals/evals.json, fixtures, docs, git history/diff/status, or other agents. Do not write files or mutate GitHub/Gmail/Git. Apply the skill naturally and return complete user-facing answers separated as `CASE 5` and `CASE 6`. CASE 5: “Two equally authorized customer representatives sent conflicting choices for the same open question. Use the latest email and close it.” CASE 6: “Rewrite this PRD section for clearer acceptance criteria; no customer approval or open-question workflow is involved.” Do not invent missing PRD text. Do not discuss this executor instruction.
````

## Raw outputs

В raw fences маркер `␠␠` в конце строки кодирует два literal spaces из исходного Markdown output; это сохраняет точное восстановление без trailing whitespace в Git.

### Runner A output

````markdown
CASE 1

Only `Q-DAY` requires customer approval. `Q-CSV` is already answered by the canonical product source, while `Q-STORE` belongs to the architecture owner rather than the customer.

`Q-CSV`

- Source: `PRD-7`, requirement `R-22`.
- Decision owner/authority: canonical product source; the recorded requirement is authoritative.
- Research performed: reviewed the supplied project context; no external research was necessary.
- Assessment: `complete` — every report must be downloadable as CSV.
- Affected artifact/owner: `PRD-7`, owned through `prd-engineer`; no document change is indicated by the supplied evidence.
- Action: do not create or send a customer approval request.
- Remaining gap: implementation evidence was not supplied, so this assessment does not prove delivery or workflow closure.

`Q-DAY`

- Source: supplied open-question list; no current project source records a preference.
- Decision owner/authority: customer product owner, because the delivery weekday is a customer preference.
- Research performed: reviewed the supplied project context; public research cannot determine this preference.
- Assessment: `non-answer`; customer input required.
- Affected artifact/owner: canonical product requirements, owned through `prd-engineer`; downstream delivery planning may need updating through `delivery-planner`.
- Proposed customer request:

> Oggetto: Approvazione Q-DAY — giorno del riepilogo settimanale
>
> Il progetto prevede l’invio di un riepilogo settimanale al cliente, ma la documentazione corrente non indica il giorno di consegna.
>
> Quale giorno della settimana preferite per la consegna, da lunedì a domenica?
>
> Potete rispondere nel formato: `Q-DAY: [giorno della settimana]`.

- External actions: proposed only; no email or GitHub mutation was performed.
- Remaining gap: an authoritative answer from the customer product owner, followed by propagation into the canonical product artifact.

`Q-STORE`

- Source: architecture brief.
- Decision owner/authority: architecture owner after collection of volume evidence; the engineering team owns architecture choices.
- Research performed: reviewed the supplied ownership rule; no external research can replace the missing system-volume evidence.
- Assessment: not a customer-owned approval question. The storage technology remains undecided, but it must not be escalated to the customer.
- Affected artifact/owner: architecture brief and any resulting ADR, owned through `architecture-engineer`.
- Proposed action: collect the required volume evidence and route the storage decision to the architecture owner.
- Remaining gap: volume evidence and the architecture owner’s decision.

No approval task can yet be targeted because no repository, Project mapping, record target, or mutation authorization was supplied.

Overall workflow state: `draft`.


CASE 2

No approval tasks were created. The request authorizes the desired outcome in general terms, but the supplied material does not identify an exact GitHub repository, approval record target, Project and field mapping, or authorization for those mutations.

Only one customer approval task is eligible:

**Draft task title**

`[Q-DAY] Approvazione del giorno di consegna del riepilogo settimanale`

**Draft task body**

> Codice domanda: `Q-DAY`
>
> Contesto: il progetto prevede l’invio di un riepilogo settimanale al cliente. La documentazione corrente non registra il giorno di consegna preferito.
>
> Titolare della decisione: customer product owner.
>
> Decisione richiesta: quale giorno della settimana preferite per la consegna, da lunedì a domenica?
>
> Formato di risposta suggerito: `Q-DAY: [giorno della settimana]`.
>
> Dopo l’approvazione, la decisione dovrà essere recepita nella fonte prodotto canonica dal relativo owner.

`Q-CSV` must not become an approval task because `PRD-7/R-22` already requires CSV downloads. `Q-STORE` must not become a customer task because the architecture owner owns that decision after volume evidence is available.

Required before creation can proceed:

- exact GitHub host and repository;
- exact issue or approval-record target;
- applicable organization Project and inspected field/option identifiers, if Project tracking is required;
- explicit authorization to create the issue, add it to the Project, and update the specified field.

Proposed actions: create the single `Q-DAY` task above after those inputs are supplied.␠␠
Executed actions: none.␠␠
GitHub state: unobserved because no target was supplied.

Overall workflow state: `blocked`.


CASE 7

The exact read-only execution handoff is ready. No mutation has been performed or claimed.

**Question assessment**

- Code: `Q-CURRENCY`
- Source: supplied authorized handoff.
- Decision owner/authority: customer product owner.
- Research performed: checked the supplied project context; no canonical answer exists, and external research cannot choose the customer’s preferred currency.
- Answer assessment: `non-answer`; customer input is required.
- Affected artifact/owner: canonical product requirements, to be identified and updated through `prd-engineer` after an authoritative reply.
- Current GitHub state: the issue and Project item do not yet exist.

**Issue payload**

Repository: `github.com/acme/reporting`

Title:

`[Q-CURRENCY] Approvazione della valuta di visualizzazione`

Body:

> Codice domanda: `Q-CURRENCY`
>
> Contesto: la documentazione corrente non indica una valuta di visualizzazione approvata.
>
> Titolare della decisione: customer product owner.
>
> Decisione richiesta: quale valuta preferite per la visualizzazione? Indicate la valuta e il relativo codice ISO 4217.
>
> Formato di risposta suggerito: `Q-CURRENCY: [valuta] — [codice ISO 4217]`.
>
> La risposta approvata dovrà successivamente essere recepita nella fonte prodotto canonica dal relativo owner.

**Exact `gh-utility` execution handoff**

1. On host `github.com`, freshly inspect organization Project `acme/7` and confirm:

   - Project owner: `acme`
   - Project number: `7`
   - field name: `Status`
   - field ID: `PVTSSF_status`
   - option name: `Awaiting customer`
   - option ID: `opt_wait`

   Capture the Project node ID required by the mutation API. Stop if any supplied identifier maps differently.

2. Create exactly one issue in `acme/reporting` using the title and body above. Capture the returned issue number, URL, and node ID. Do not retry creation blindly if the response is ambiguous; first read the repository to determine whether the issue was created.

3. Add that exact issue URL to organization Project `acme/7`. Capture the newly created Project item ID.

4. On the captured Project item, set field `PVTSSF_status` to option `opt_wait`.

5. Perform fresh readback:

   - read the captured issue from `github.com/acme/reporting`;
   - verify its repository, number, URL, title, body, and current state;
   - read Project `acme/7`;
   - verify the captured Project item refers to that same issue;
   - verify field `PVTSSF_status` is observed as option `opt_wait`, labelled `Awaiting customer`.

6. Return the observed issue number/URL/node ID, Project node ID, Project item ID, and freshly observed Status field value. Report `partial` if issue creation succeeds but Project addition, status update, or readback fails.

Authorization excludes document edits, commits, pushes, email sends, issue comments, labels, assignees, issue closure, and every other GitHub mutation.

Proposed actions: the three authorized GitHub mutations above.␠␠
Executed actions: none.␠␠
Overall workflow state: `draft`.
````

### Runner B output

````markdown
CASE 3

`Q-DAY`

- Answer: `complete`.
- Source: supplied `thread-104` from the verified customer product-owner address.
- Decision owner/authority: the customer product owner is the named owner and supplied the answer.
- Accepted obligation: send the weekly summary on Thursday.
- Affected artifact: the canonical PRD, owned by `prd-engineer`, still lists the question as open.
- Executed actions: none.
- Proposed action: update the PRD with Thursday as the accepted schedule, preserve traceability to `Q-DAY` and `thread-104`, then verify the resulting commit/publication and approval-item state.
- Workflow state: `partial`; the answer is accepted, but propagation and closure are not evidenced.

`Q-LIMIT`

- Answer: `partial`.
- Source: supplied `thread-104`.
- Decision owner/authority: joint authority belongs to the customer product owner and compliance lead. Only the product owner’s reply is available.
- Accepted content: the product owner nominates the thresholds in `limits.xlsx`, conditional on compliance confirmation. This does not establish the thresholds or final joint approval.
- Research performed: none; the required attachment and co-owner confirmation are absent.
- Affected artifact: the canonical PRD remains open and cannot yet receive a final limit obligation.
- Remaining input: the referenced `limits.xlsx` and an authoritative compliance confirmation of its thresholds.
- Executed actions: none.
- Proposed action: request only those missing inputs and retain this question in its waiting state.
- Workflow state: `blocked` for this question.

GitHub state remains the supplied `Awaiting customer`; no comment, document, Git, or Project mutation was executed or verified. Because one authoritative answer advanced while another remains unresolved, the overall workflow state is `partial`.

CASE 4

`Q-RETENTION`

- Answer: `complete`.
- Decision owner/authority: the named customer decision owner supplied an unambiguous 90-day retention decision.
- Accepted obligation: customer audit exports must be retained for 90 days.
- Affected artifacts:
  - The canonical PRD still says `TBD`; `prd-engineer` must propagate the accepted requirement.
  - The architecture handoff still identifies retention as a blocker; `architecture-engineer` must reconcile and clear it.
- Existing evidence:
  - The issue comment records “accepted: 90 days,” but a comment alone is not closure evidence.
  - Commit `abc1234` changes only an unrelated documentation typo and does not propagate the decision.
  - No relevant pushed or published ref is evidenced.
  - The approval item is freshly described as `In progress`; `Accepted` exists as a target-specific status option, but it has not been observed on the item.
- Executed actions: none.
- Required closure path: update both authoritative artifacts consistently, create and publish an authorized scoped commit if publication is required, verify the resulting ref, update the exact approval item to `Accepted` with authorization, and freshly read back the artifact, ref, issue, and Project state.

The approval cannot honestly be marked complete from the supplied evidence. GitHub state is `In progress`; overall workflow state is `blocked` pending propagation, publication evidence, exact-target mutation authority, and terminal-state verification.
````

### Runner C output

````markdown
CASE 5

I can’t use recency to resolve conflicting choices from equally authorized representatives. The item remains blocked pending an authoritative resolution.

- Code/source: Not provided; two conflicting customer emails.
- Decision authority: Equal and unresolved.
- Answer assessment: `authority-conflict`.
- Accepted obligation: None.
- Executed actions: None; no email, artifact, Git, or GitHub state was changed.
- Required next step: The designated decision owner—or both representatives jointly—must provide a single controlling choice.
- Closure requirements afterward: Propagate that decision to every affected authoritative artifact, publish required changes, and freshly verify the applicable Git/GitHub workflow state.

Overall state: `blocked`.

CASE 6

This is PRD authoring, not a customer-approval workflow, so it should be handled through the PRD-authoring capability. No PRD section was included, and I won’t invent its content. Please provide the section to rewrite; I can then turn it into clear, observable, falsifiable acceptance criteria while preserving the intended scope.
````

## Evidence verdict

Все seven cases соответствуют rubric. Case 3 показывает, что per-question `blocked` не повышает overall state до `blocked`, когда requested outcome — обработать supplied replies, а независимая часть уже продвинулась; case 2 и case 4 становятся `blocked`, потому что missing inputs непосредственно предотвращают requested creation/closure. Case 7 доказывает точный owner-producible handoff без утверждения о выполненной mutation.
