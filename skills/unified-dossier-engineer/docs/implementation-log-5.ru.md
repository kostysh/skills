# Лог реализации `Package 7`

Дата: 2026-04-21

## Что реализовано

В этой волне создан canonical maintainer-facing документ:

- `docs/utility-spec.ru.md`

Также обновлён:

- `docs/README.md`

## Что зафиксировано

### Назначение unified utility

Будущая merged utility закреплена как один mechanical runtime surface для двух semantic layers:

- `backlog truth layer`
- `delivery workflow layer`

При этом утилита не получает NLP- или prose-analysis authority.

### Root и artifact contract

В спецификации закреплены:

- repo process root через `.dossier/manifest.json`
- backlog subroot через `.dossier/backlog/manifest.json`
- distinction between accounting/process artifacts under `.dossier/*` and human-facing SSOT under `docs/ssot/*`
- path normalization и запрет durable absolute trace paths

### Lock semantics

Определены два независимых lock domains:

- backlog mutation lock
- delivery mutation lock

Это позволяет future runtime не смешивать backlog graph mutations и feature-local delivery work.

### Command families

В спецификации описаны три крупные command families:

- bootstrap/root-management
- backlog truth commands
- delivery commands

Delivery commands дополнительно разведены на:

- stage-controller commands
- helper / closure / integrity commands

### Stage-controller boundaries

Из `Package 6.1` в utility spec перенесена и concretized строгая граница:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

являются mechanical stage-controller commands, но их authority заканчивается на `ready_for_close`.

Authoritative closure truth остаётся у:

- `dossier-step-close`
- `lifecycle-refresh`

### Backlog interaction model

Спецификация закрепляет, что stage-controller commands не мутируют backlog truth напрямую.

Их разрешённый backlog-facing effect:

- materialize explicit follow-up requirement
- surface `backlog_followup_required`
- surface `backlog_followup_kind`
- surface `backlog_followup_resolved`

Truthful stage closure остаётся fail-closed, пока required backlog follow-up не закрыт.

### Source-review replacement contract

В unified utility spec закреплено, что source hash change:

- не создаёт immediate item-level flood по умолчанию
- сначала materialize-ит source-level review record
- делает open source review blocking readiness signal

`refresh` и `attention` должны работать через этот source-review-first contract.

Для first wave дополнительно зафиксированы:

- новый explicit no-op closure helper `ack-source-review`
- minimum `refresh --source-*` fields:
  - `changed_sources`
  - `source_reviews_created`
  - `source_reviews_updated`
  - `source_review_ids`
  - `next_commands`
- default `attention` ordering:
  - open source-review records before generic item-level review entries
- truthful resolution mapping:
  - `ack-source-review`
  - `patch-item`
  - `packet`
  - `update-source-path`
  - `remove-source`

### Output / error / telemetry boundaries

Спецификация также фиксирует:

- global JSON envelope
- bounded `result` values
- symbolic error-code family
- truthful closure and telemetry rules
- explicit non-goals для first merged runtime

## Что сознательно НЕ делалось

В этой волне не реализовывались:

- runtime modules
- CLI help surface
- executable command parser
- tests for command behavior
- migration shims for split runtimes

Причина:

- это scope `Package 8`
- `Package 7` должен сначала дать deterministic maintainer-facing contract

## Валидация

Для этой docs-only волны достаточно:

- `git diff --check`
- внешний `spec-conformance-reviewer` против:
  - `docs/issues/unified-dossier-engineer-concept-2026-04-20.md`
  - `docs/refactoring-plan-1.ru.md`
- `code-reviewer` и `security-reviewer` допустимо маркировать как `N/A`, если пакет не меняет runtime/code surface

Целевой outcome:

- utility spec становится обязательным upstream input для `Package 8`
- downstream runtime design больше не должен угадывать merged command behavior ad hoc
