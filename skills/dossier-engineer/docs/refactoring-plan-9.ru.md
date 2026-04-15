# План рефакторинга 9: completion guard, early security seam checkpoint и freshness closure

Дата: `2026-04-15`
Компонент: `dossier-engineer`
Основание: [issues/improvement-proposal-20260415-1.md](issues/improvement-proposal-20260415-1.md)
Скоп: `implementation`, `plan-slice`, audit policy, workflow-stage logging, docs-contract tests

## Цель

Закрыть три сильных process gap, выявленных ретроанализом:

- агент не должен считать частичный зеленый implementation increment завершением всей stage;
- security-sensitive seam changes должны получать ранний узкий checkpoint, а не только финальный review;
- closure artifacts должны иметь понятную freshness-модель, чтобы pre-final и final артефакты не смешивались.

План не переносит обязанности review skills внутрь `dossier-engineer`. Скил остается владельцем orchestration, gates, logging и closure semantics.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/workflow-stage-implementation.md](../references/workflow-stage-implementation.md)
- [../references/workflow-stage-plan-slice.md](../references/workflow-stage-plan-slice.md)
- [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md)
- [../references/implementation-audit-policy.md](../references/implementation-audit-policy.md)
- [issues/improvement-proposal-20260415-1.md](issues/improvement-proposal-20260415-1.md)

## Не цели

- Не добавлять новые CLI commands.
- Не менять формат существующих dossier body sections.
- Не требовать security audit для prose-only изменений.
- Не делать commit SHA критерием валидности.
- Не превращать `review-artifact` в сам review.

## Package 1. Completion guard и allowed stop points

### Смысл

Агент должен явно различать:

- implementation checkpoint;
- завершение package/increment;
- завершение всего planned implementation scope;
- остановку из-за blocker или operator pause.

### Файлы

- `references/workflow-stage-plan-slice.md`
- `references/workflow-stage-implementation.md`
- `references/workflow-stage-logging.md`
- `SKILL.md` если там есть summary-level closure wording
- `test/docs-contract.test.ts`

### Изменения

1. В `plan-slice` добавить требование фиксировать `allowed_stop_points` для multi-slice или package-based планов.
2. В `implementation` добавить completion guard:
   - final answer после `implementation` разрешен только если all planned slices complete;
   - или достигнут заранее записанный `allowed_stop_point`;
   - или есть blocker, требующий решения оператора;
   - или оператор явно попросил остановиться на checkpoint.
3. В `workflow-stage-logging.md` добавить structured fields:
   - `planned_slices`
   - `slice_status`
   - `current_checkpoint`
   - `completion_decision`
4. Добавить docs-contract тесты, которые защищают эти формулировки от регресса.

### Acceptance

- В instructions есть буквальный запрет выдавать final close-out после partial increment без допустимого stop reason.
- `plan-slice` объясняет, кто и когда задает `allowed_stop_points`.
- Stage log contract содержит поля, позволяющие ретроанализу отличить checkpoint от completion.
- Документация не требует legacy support для старых логов.

### Риски и смягчение

Риск: агент будет слишком долго продолжать работу по слишком крупному плану.

Смягчение: `allowed_stop_points` обязательны именно для multi-slice/package work, чтобы крупные планы имели безопасные остановки.

## Package 2. Early security seam checkpoint

### Смысл

Финальный `security-reviewer` остается обязательным для code/trust-boundary changes, но некоторые изменения должны получить ранний узкий checkpoint до того, как вокруг ошибочного seam будут построены tests, logs и closure artifacts.

### Файлы

- `references/implementation-audit-policy.md`
- `references/workflow-stage-implementation.md`
- `test/docs-contract.test.ts`

### Изменения

1. В audit policy добавить раздел `Early security seam checkpoint`.
2. Триггеры checkpoint:
   - public route exposure или reserved route behavior;
   - auth/admission gate;
   - trusted ingress или internal bypass;
   - secret material, redaction, export controls;
   - failure semantics для security-sensitive paths.
3. Зафиксировать, что checkpoint:
   - запускается через spawned external agent;
   - использует `security-reviewer`;
   - имеет узкий scope changed seam only;
   - не заменяет финальный security audit;
   - не запускается для prose-only, formatting-only или non-security refactors.
4. Добавить out-of-spec stop rule: если checkpoint выявляет проблему, исправление которой выходит за текущую спецификацию или approved process model, агент не расширяет scope молча, не реализует security behavior самовольно, а останавливается и запрашивает решение оператора.
5. В implementation steps добавить ссылку на policy в момент после первого working increment of security-sensitive seam.

### Acceptance

- Агент получает раннюю точку решения для trust-boundary changes.
- Финальный audit stack остается неизменным.
- Нет требования запускать security checkpoint для любой реализации.
- Out-of-spec security finding blocks continuation until operator decision; the agent cannot silently widen scope or invent new security requirements.

### Риски и смягчение

Риск: агент начнет запускать security checkpoint слишком широко.

Смягчение: triggers должны быть закрытым списком с explicit negative rule.

## Package 3. Freshness closure model

### Смысл

Closure artifacts должны отражать intended final tree и не смешивать pre-final drafts с final artifacts.

### Файлы

- `references/workflow-stage-implementation.md`
- `references/workflow-stage-logging.md`
- `SKILL.md` если summary-level step closure wording требует уточнения
- `test/docs-contract.test.ts`

### Изменения

1. В implementation stage добавить closure sequence:
   - intended final tree;
   - verification;
   - external audits;
   - review / verification / step-close artifacts;
   - commit;
   - trace-only metadata backfill when needed.
2. В logging contract добавить freshness fields:
   - `canonical_for_commit`
   - `supersedes`
   - `generated_after_commit`
   - `freshness_basis`
3. Сделать эти поля conditionally required для новых implementation closure / step-close artifacts, когда freshness применима: artifact создается после verification/review, supersedes previous artifact, ссылается на committed state, или получает post-commit trace-only metadata.
4. Оставить старые артефакты non-migrated: план не требует задним числом переписывать legacy closure artifacts.
5. Прямо указать, что commit SHA является trace link, а не validity criterion.
6. Уточнить, что post-commit metadata backfill не должен менять техническое содержание closure artifacts.

### Acceptance

- Агент понимает, какой artifact является canonical final.
- Ретроанализ может отличить superseded artifact от финального.
- Новые implementation closure / step-close artifacts имеют freshness fields, когда эти поля применимы.
- Нет требования переписывать старые артефакты задним числом.

## Package 4. Trace anchors для process misses и review events

### Смысл

Ретроанализ должен видеть не только факт process miss, но и операторскую команду, review event или decision point, где проблема возникла.

### Файлы

- `references/workflow-stage-logging.md`
- `test/docs-contract.test.ts`

### Изменения

1. Добавить поля:
   - `operator_command_refs`
   - `process_miss_refs`
   - `review_events`
2. Для `process_miss_refs` описать минимальную форму:
   - `miss_id`
   - `severity`
   - `operator_command_ref`
   - `stage_log_ref`
   - `decision_ref`
   - `resolution_ref`
3. Для `review_events` описать минимальную форму:
   - `agent_id`
   - `role`
   - `model`
   - `requested_ts`
   - `verdict_ts`
   - `verdict`
   - `rerun_reason`
   - `scope`
4. Уточнить, что эти поля обязательны только когда соответствующие события реально были.

### Acceptance

- Лог не раздувается при простом happy path.
- При review rerounds и process misses есть machine-readable anchors.
- Секции остаются readable для оператора.

## Проверки

- `pnpm --filter @kostysh/dossier-engineer-cli test` если package command доступен.
- Иначе targeted docs-contract tests для `dossier-engineer`.
- `rg` на абсолютные локальные пути в измененных docs.
- `git diff --check`.

## Review plan

Перед имплементацией выполнить внешний spec-conformance/UX review этого плана против proposal. После правок добиться PASS на узком scope измененного plan doc.
