# Implementation Log 7

## Package

`Package 9. Реализовать merged runtime/CLI`

## Что реализовано

- добавлен первый shipped merged runtime в `src/*` и emitted launchers в `scripts/*`
- добавлены unified entry points:
  - `dossier-engineer`
  - `dossier`
  - `backlog-engineer`
- реализован unified process-root bootstrap:
  - `.dossier/manifest.json`
  - `.dossier/backlog/*`
  - `docs/ssot/*`
- реализован backlog-side source-review слой:
  - `refresh` открывает или обновляет source-review records
  - `attention` показывает source-review records раньше generic item entries
  - `status`, `items`, `queue`, `search` учитывают source-review blocking
  - `ack-source-review` закрывает truthful no-op path
- реализованы delivery stage-controller commands:
  - `spec-compact`
  - `plan-slice`
  - `implementation`
  - `change-proposal`
- `feature-intake` обёрнут unified telemetry append-ом
- `feature-intake` теперь:
  - сериализует feature allocation через global delivery lock
  - сохраняет truthful `partial_success` envelope при vendored nonzero после создания dossier
  - нормализует pre-summary validation failures в `UDE_FEATURE_INTAKE_FAILED`
- `dossier-step-close` обёрнут stage-log closure synchronization
- `dossier-step-close` принимает только canonical managed artifact families:
  - `.dossier/verification/<feature-id>/*`
  - `.dossier/reviews/<feature-id>/*`
  - truthful blocked closeout маппится в `code=3` / `UDE_CLOSURE_BLOCKED` только при наличии реального step artifact
- добавлены managed-path / symlink guards для:
  - feature-intake logs
  - source-review artifacts
  - default `docs/ssot/index.md`
  - lifecycle metrics и session-index
  - review / verify / drift / step-close output paths
  - dossier / review / verify / implementation-step managed reads
- добавлены advisory delivery locks для:
  - feature-intake
  - stage-controller commands
  - mutating delivery helpers
  - index mutation helpers
- feature-facing wrappers валидируют canonical dossier identity и safe `feature_id` before deriving managed paths
- backlog-side mutations больше не сваливаются в misleading nonzero exit после source-review follow-up; cleanup failures surfaced as warnings / prechecks instead of unsafe post-commit errors
- source bundle promoted from planning-stage wording to shipped first-wave runtime wording
- добавлены command-behavior tests для public merged launchers
  - invalid feature-intake log root
  - feature-intake validation failure before dossier creation
  - invalid source-review root before `update-source-path`
  - invalid dossier path for stage controllers
  - invalid default SSOT index path
  - unsafe dossier `feature_id` before lifecycle artifact writes
  - poisoned implementation `step_artifact` metadata before `lifecycle-refresh`
  - symlinked verification artifact before `dossier-step-close`
  - invalid stage-log path before `dossier-step-close`

## Что сознательно не закрыто

- migration tooling и parity-hardening перенесены в `Package 10`
- split-skill retirement перенесён в `Package 11`
- command help/output surface остаётся first-wave, а не final retirement-state contract

## Локальные проверки

- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`
- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `pnpm --filter @kostysh/unified-dossier-engineer build`
- `git diff --check -- skills/unified-dossier-engineer`
- `skill-source-compiler lint`
- `skill-source-compiler compile`
- `skill-source-compiler check`
- external review (`gpt-5.4`):
  - `spec-conformance-reviewer` — PASS
  - `code-reviewer` — PASS
  - `security-reviewer` — PASS

## Основные риски, закрытые в пакете

- unified backlog commands больше не зависят от split root layout
- source hash changes больше не вызывают immediate item-level attention flood
- stage-controller commands больше не размывают closure authority `dossier-step-close`
- compatibility launchers дают deprecation warning, но не ломают first-wave operator flow
- managed-write guards теперь fail-closed before repo-owned writes when symlinked or escaping paths appear
- delivery mutation commands сериализуются per feature cycle or via global index lock

## Остаточные риски

- first-wave runtime пока не покрывает migration tooling для переноса split artifacts
- compatibility behavior ещё нужно проверять против split runtimes в `Package 10`
- split-skill retirement по-прежнему остаётся отдельным последующим циклом
