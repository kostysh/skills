# Журнал реализации: source-grounded documentation workflow

## Language

Russian.

## Log ID

`implementation-log-20260716-1`

## Related Issue

Отдельный issue не создавался; remediation выполняется по независимому baseline
review текущего скила.

## Related Plan

Принят conversational plan; отдельный plan-файл не создавался.

## Operator Request

Провести полный review `documentation`, минимально улучшить его сквозную
способность, актуализировать guidance, исключить substrate-only closure и
подтвердить результат через `skill-reviewer`.

## Summary

Скил переводится с Diataxis-only классификации на source-grounded authoring,
review и restructuring. Diataxis остаётся владельцем формы и information
architecture, но factual, executable и publication readiness получают отдельные
authority, evidence и status contracts.

Capability: агент создаёт документ, review или restructure handoff для
определённого читателя и target state либо честно ограничивает результат по
доступным источникам и проверкам.

Anti-claims:

- правильная Diataxis-форма не доказывает accuracy или executable correctness;
- lint, links, generated pages и docs build не доказывают описанное поведение;
- documentation-only skill не создаёт runtime capability и не владеет product,
  architecture, specification или domain truth.

## Changes Made

- Исправлена canonical compass-модель Reference на cognition +
  application/work.
- Добавлены task-mode, audience, target-state, source-authority, side-effect,
  evidence и output-status contracts.
- Review-only и mutation workflows разведены; corpus restructuring включает
  URL, link, navigation и redirect implications.
- Interop распределён между product/spec/architecture, domain, Docusaurus,
  DOCX/PDF и concept-conformance owners.
- `diataxis-guide.md` переведён из contradictory required/conditional surface в
  optional reference с точными triggers и актуализированным содержанием.
- Runtime, CLI, assets, UI metadata и постоянный test package не добавлялись:
  repeated deterministic operation у этого judgment-oriented skill отсутствует.

## Decisions

- Root contract остаётся каноническим для compass, authority, statuses и
  validation; optional reference содержит только подробные различия и patterns.
- Статусы ограничены `structure-reviewed`, `draft`, `verified`, `blocked`, чтобы
  downstream consumer мог отличить form-only review от проверенного результата.
- Safety validation не расширяет authority: destructive, production,
  privileged или externally visible commands нельзя выполнять только ради docs
  verification без отдельного разрешения.
- UI metadata не создаётся: текущий skill не имеет UI surface, а новый файл не
  улучшил бы заявленную поведенческую способность.

## Verification Performed

- `skill-source-compiler lint`, `regenerate` и `check`: `OK`.
- Source и isolated package: `quick_validate.py` — `Skill is valid!`.
- Isolated compile/check: `OK`; package содержит 7 declared files.
- Generated `SKILL.md`: 15,697 bytes, 255 lines, ниже 20,000-byte
  recommendation.
- Parsed description: 257 Unicode code points.
- Active portability scan: machine-specific filesystem dependencies не
  найдены.
- Generated readback подтверждает optional reference, canonical
  application/work + cognition для Reference, status и interop contracts.
- Blind forward-tests: `6/6 PASS` на clean active-only candidate.
- Independent `skill-reviewer` closure re-audit: `PASS`.

## Blind Forward-Tests

- Candidate: active-only package из `SKILL.md` и
  `references/diataxis-guide.md`; supporting logs исключены для сохранения
  blindness.
- Candidate snapshot:
  `488294f702e054e04c1d66d9ab06d1bb2b4e5fa56c21cb137987562ec49d7ecc`,
  2 files, relative-path aggregate SHA-256.
- Evaluators получили только candidate, raw user tasks и read-only constraint;
  baseline findings, expected answers и intended fixes не передавались.

| Case | Raw task | Observed decision | Result | Evidence limit |
| --- | --- | --- | --- | --- |
| FT-01 | Опытным operators нужен lookup всех `deploy` flags/defaults/values/exit codes | Выбран Reference как cognition + application/work; запрошен authoritative CLI contract; `structure-reviewed` | `PASS` | Не проверяет authoring полного reference. |
| FT-02 | Написать ADR, выбирающий Kafka без quality scenarios и approval | Запрос передан architecture owner; invented decision отклонён; `blocked` | `PASS` | Не проверяет accepted ADR rewrite. |
| FT-03 | Publication-ready current quick-start: README использует `--force`, current help — `--dry-run`, future spec — `--safe`; lint/links/build зелёные | Выбран current CLI help, stale и future commands исключены; без execution — `draft` | `PASS` | Не проверяет реальное выполнение CLI. |
| FT-04 | Создать complete billing API reference из одной product sentence и sensible assumptions | Contract facts не выдуманы; потребован OpenAPI/current routes/owner; `blocked` | `PASS` | Не проверяет reference при полном contract input. |
| FT-05 | Review-only Docusaurus cluster с публичными routes и без redirect decision | Предложен bounded in-place content split, сохранены routes, platform actions routed to Docusaurus; `structure-reviewed` | `PASS` | Не проверяет actual repo, links, build или reader outcome. |
| FT-06 | Создать publication-ready Reference для `acme deploy` v2.4 из полного parser-generated contract, 8 passing contract tests и safe smoke transcript | Создан полный scoped artifact; все entries traced к contract, examples read back против smoke evidence; `verified` | `PASS` | Не доказывает route/build/link integration, явно исключённую из requested boundary. |

Forward-tests являются выборочным behavioral evidence и не заменяют domain
correctness, structural checks или independent re-audit.

### FT-06 Positive Authoritative Fixture And Artifact

Raw user input задавал experienced operators, Acme CLI v2.4, точный scope
`acme deploy`, English и repository entry order `title → version/scope → usage
→ options → exit codes → examples`. Route/build/link integration был явно вне
requested boundary.

Approved parser-generated contract:

```text
Usage: acme deploy --env <dev|staging|prod> [--dry-run]
--env: required enum; dev, staging, prod; no default
--dry-run: optional boolean; default false; validates without applying changes
Exit 0: deployment completed, or validation succeeded with --dry-run
Exit 2: missing or invalid arguments
Exit 7: authentication failed before deployment
```

Current contract-test evidence:

```text
PASS usage_matches_parser
PASS env_required
PASS env_accepts_dev_staging_prod
PASS dry_run_defaults_false
PASS dry_run_does_not_apply_changes
PASS exit_0_success
PASS exit_2_invalid_arguments
PASS exit_7_authentication_failure
8 passed, 0 failed
```

Safe smoke evidence:

```text
$ acme deploy --env staging --dry-run
Validation succeeded for staging; no changes applied.
[exit 0]

$ acme deploy --env invalid --dry-run
Error: --env must be one of dev, staging, prod.
[exit 2]
```

Observed documentation artifact:

```markdown
# `acme deploy`

_Acme CLI v2.4. This page covers only the current `acme deploy` command._

## Usage

`acme deploy --env <dev|staging|prod> [--dry-run]`

## Options

| Option | Required | Default | Description |
| --- | --- | --- | --- |
| `--env <dev\|staging\|prod>` | Yes | None | Target environment. Accepted values: `dev`, `staging`, or `prod`. |
| `--dry-run` | No | `false` | Validate the deployment without applying changes. |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Deployment completed, or validation succeeded when `--dry-run` was used. |
| `2` | Arguments are missing or invalid. |
| `7` | Authentication failed before deployment. |

## Examples

`acme deploy --env staging --dry-run` returns
`Validation succeeded for staging; no changes applied.` and exit `0`.

`acme deploy --env invalid --dry-run` returns the accepted-values error and
exit `2`.
```

Evaluator reported mode `author`, form `reference`, no product assumptions,
full entry-by-entry contract comparison, smoke-example readback, and
`verified` for the requested command-reference boundary. Route/build/link
checks remained explicitly unassessed and owned by the maintainer during
publication integration.

## Instruction-Quality Self-Check

`ready-to-regenerate`:

- observable outcome, actor/consumer, allowed side effects, evidence rules и
  output shape заданы явно;
- target state разделяет intended и shipped authority, а missing/conflicting
  inputs имеют deterministic draft/structure-reviewed/blocked behavior;
- canonical compass хранится в root, optional reference не дублирует authority
  или status rules и имеет точный load trigger;
- review-only, authoring и restructure paths не смешивают mutation authority;
- interop owners могут произвести вход или выполнить handoff без скрытого
  product, platform или format decision;
- commands, runtime, tests, metrics, UI metadata и config surfaces не заявлены
  без текущего поведенческого основания;
- compiler и self-review evidence не представлены как independent behavioral
  `PASS`.

### Skill Review Evidence

Baseline:

- mode / assurance: `baseline` / `independent`;
- snapshot: `bbc1c984bada4a5695efcbc9d89536853d534ca8535d74227f146a081f6cda83`,
  9 files, relative-path aggregate SHA-256;
- verdict: `FAIL`;
- findings: `2×P1`, `1×P2`.

| Finding | Concrete change | Evidence | Status |
| --- | --- | --- | --- |
| P1: canonical compass смешивает Reference со study | Reference закреплён как cognition + application/work в canonical root | Generated readback и FT-01 | `verified` |
| P1: quality закрывается Diataxis structure без authority/evidence | Добавлены source readiness, safe fallback, proportional checks и explicit statuses | FT-02—FT-06; positive artifact/status path included | `verified` |
| P2: reference одновременно required и conditional | Reference сделан optional с одним точным trigger contract | Compiler check и packaged readback | `verified` |

Первый independent re-audit snapshot
`1f242ce56ff4338bf0e468c45390a6abe0c41cd7b95ab866a04d0f353a8fa31a`
закрыл все baseline findings, но выдал новый P2: пять исходных forward cases не
проверяли positive authoritative path до полезного `verified` artifact. FT-06
добавлен в fresh blind context без изменения active guidance.

Closure re-audit:

- mode / assurance: `re-audit` / `independent`;
- reviewed snapshot:
  `52207434dd61b6694fb1cb587d8962ceb422d2327d42092b4574373862ac029b`,
  10 files, stable end identity;
- baseline `2×P1 + 1×P2`: closed;
- positive-path P2: closed FT-06 evidence;
- adjacent active regressions: none;
- verdict: `PASS`.

Эта verdict record и README status являются единственным planned mutation после
полного closure review. Они требуют terminal bounded delta audit и намеренно не
переписываются после него.

## Deviations From Plan

Нет.

## Side Effects

- Изменения ограничены `skills/documentation`.
- Product/runtime repositories и внешние системы не изменялись.

## Follow-up

- Завершить structural и behavioral evidence.
- Получить независимый `PASS` либо устранить подтверждённые review gaps.

## Final Status

`PASS` — structural/package checks, `6/6` blind forward-tests и independent
closure re-audit завершены; supporting verdict delta проходит отдельный terminal
audit.
