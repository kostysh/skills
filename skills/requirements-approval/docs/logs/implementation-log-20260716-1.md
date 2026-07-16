# Журнал реализации: сквозная способность requirements-approval

- **Log ID:** implementation-log-20260716-1
- **Дата:** 2026-07-16
- **Статус:** COMPLETE
- **Baseline snapshot:** `93a1ea37937e71c3b53562eaacfb227c1524ce4851337ab944d4d73149be78ed`
- **Baseline verdict:** independent `FAIL`

## Цель и anti-claims

Скил должен координировать customer-owned вопрос до авторитетно принятого решения, согласованных project artifacts и наблюдаемого workflow state. Email, issue, comment, generated document, test или commit сами по себе не доказывают closure.

Скил не присваивает product/architecture authority, не отправляет email и не выполняет GitHub/Git mutations без точного target и текущей авторизации.

## Remediation matrix

| Baseline finding | Изменение | Evidence | Статус |
| --- | --- | --- | --- |
| P1: broad triggers переходили к внешним writes без execution gate | Разделены assessment/draft и exact-target execution; добавлены authorization и fresh-read gates | Missing-target blind case и re-audit | implemented |
| P1: mailbox reply мог стать решением без проверки authority | Добавлены decision owner, identity/currentness, source precedence и conflict stop rules | Reply/conflict blind cases и re-audit | implemented |
| P1: comment + любой commit позволяли substrate-only DONE | Ответ и workflow closure разделены; введён multi-artifact terminal evidence gate | Closure adversarial case и re-audit | implemented |
| P2: handoffs не удовлетворяли readiness соседних skills | Уточнены exact inputs/outputs для gmail, gh-utility, artifact owners и git-engineer | Interop inspection, blind cases и re-audit | implemented |
| P2: target-specific Project statuses были hard-coded | Семантическое состояние отделено от inspected Project field/option values | Live CLI contract и closure case | implemented |
| P2: отсутствовал исполнимый output/blocked contract | Добавлен per-question report и overall `verified|partial|blocked|draft` | Instruction audit и blind cases | implemented |
| P3: UI metadata не соответствовала интерфейсному контракту | Сокращён short description и добавлен `$requirements-approval` default prompt | YAML/UI validation | implemented |

## Изменённая поверхность

- Source bundle и generated instruction contract.
- UI metadata.
- Portable eval scenarios и neutral fixtures.
- Supporting navigation, evidence и этот log.

Новый runtime не добавляется: повторяемой package-local машинной операции нет, а Gmail/GitHub/Git behavior принадлежит соседним capabilities.

## Проверки

### Author self-check

`ready-to-regenerate`: outcome, success criteria, side-effect limits, authority/precedence, output contract, fallback и stop rules явные; обязательных hidden references, placeholder commands или runtime claims нет. Это author-side evidence, не независимый behavioral verdict.

### Structural и portability

- `skill-source-compiler lint`, `regenerate`, `check` — PASS без warning после оптимизации размера.
- `quick_validate.py` — PASS.
- `SKILL.md` — не более заявленного бюджета 14 000 bytes.
- YAML/UI contract — PASS: description 297 codepoints, short description 54 codepoints, default prompt содержит `$requirements-approval`.
- `evals/evals.json` — 7 уникальных portable scenarios, JSON contract PASS.
- Absolute-path scan и `git diff --check` — PASS.
- Isolated `compile`, compiler `check`, quick validation и readback copied eval/supporting artifacts — PASS.

### Current GitHub CLI contract

Read-only проверка `gh 2.96.0` и official CLI docs подтвердила:

- issue placement in a Project использует `--project` и требует соответствующей project authorization;
- `gh project item-edit` требует item/project/field/option identifiers для single-select update;
- `gh project item-list` даёт readback для свежей проверки состояния.

Live mutation не выполнялась: оператор выбрал fixtures и read-only external verification.

### Blind forward-tests

[Полное evidence](../forward-tests/forward-test-evidence-20260716-1.md) фиксирует prompts, raw outputs, fixture hashes, rubric и limits. Все 7 итоговых cases — PASS: internal resolution, customer-language draft, deterministic missing-target refusal, partial attachment/authority handling, substrate-only closure refusal, equal-authority conflict, PRD boundary routing и exact authorized GitHub handoff.

Development прогоны выявили недетерминированный `draft|blocked` выбор, неполный readiness enumeration и неявный PRD owner. Узкая instruction delta определила states через requested outcome и explicit owner routing; весь набор был заново выполнен fresh agents. Normalized behavior snapshot: `8f2830900e249b49cbe52fd8e5b23156901f7a40ea614dca466362180df3d06d`.

### Independent review

Baseline independent `skill-reviewer` verdict: `FAIL` с 3 P1 и 2 P2. Первый closure re-audit подтвердил их устранение, но нашёл P2 в snapshot attribution/state aggregation и отсутствие positive exact-target coverage. После исправления state/evidence contract и eval-oracle parity независимый bounded closure re-audit дал `PASS` без P1/P2/P3 на full snapshot `03135d413cdc724b5ccfbd977d8b3936d6f977145cc68dff3c226696a4dd3538` и normalized behavior snapshot `8f2830900e249b49cbe52fd8e5b23156901f7a40ea614dca466362180df3d06d`.

## Итог

Capability закрыта на уровне portable documentation-only orchestration skill. Structural checks не используются как behavioral verdict; closure опирается на blind forward evidence и независимый `skill-reviewer PASS`. Live Gmail/GitHub write не заявляется и не тестировался.
