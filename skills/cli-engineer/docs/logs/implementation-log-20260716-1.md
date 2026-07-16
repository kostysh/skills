# Журнал реализации: сквозная надёжность `cli-engineer`

## Идентификатор

`implementation-log-20260716-1`

## Связанный запрос

Прямой запрос оператора: провести baseline-review `cli-engineer` через `skill-reviewer`, актуализировать guidance по официальным источникам и `nodejs-cli-apps-best-practices`, устранить ложные критерии готовности и подтвердить переносимость и поведение. После обсуждения оператор зафиксировал Vite, `node:test`, native type stripping и полный запрет `tsx` как стандарт скила; Node baseline должен динамически следовать текущей Active LTS.

## Результат

Source bundle обновлён до `0.2.0`. Скил остаётся documentation-only и не заявляет runtime capability. Основной контракт теперь различает design/review/implementation/release preparation/publication, требует representative installed-command job для `verified` и точную авторизацию/readback для `published`.

## Изменения

- `skill.yaml` — task modes, authority/output/evidence contracts, interop, optional references, portable eval/supporting surfaces.
- `fragments/overview.md` — компактный outcome-first стандарт: current Active LTS, TypeScript, Vite, `node:test`, native type stripping, no `tsx`.
- `references/*` — динамический LTS, Vite artifact contract, portable install verification, service-boundary evidence, release/publish safety и shell completion.
- `agents/openai.yaml` — UI prompt синхронизирован с фактическим стандартом.
- `evals/*` — переносимые trigger, toolchain, authority, substrate-only, completion и interop сценарии.

## Решения

- Vite и `node:test` сохранены как стандарт, а не ослаблены до ecosystem-neutral defaults.
- Существующая non-Vite сборка может обслуживаться без миграции, если миграция вне запроса; это отклонение, не второй стандарт.
- Vitest допустим только по прямому требованию пользователя или авторитетного проектного контракта.
- `tsx` запрещён полностью. Несовместимый с native stripping TypeScript переводится в erasable профиль либо выполняется как Vite-built JavaScript.
- Номер Node LTS не хранится как постоянная нормативная константа; агент сверяет текущую Active LTS и version-specific APIs по официальным Node.js источникам.
- Из `nodejs-cli-apps-best-practices` принят только materially missing shell-completion contract и current-LTS native styling preference; обязательные shrinkwrap/container rules не добавлялись.

## Матрица remediation

| Baseline finding | Изменение | Evidence | Статус |
| --- | --- | --- | --- |
| P1 release preparation может перейти к неавторизованному publish | Явные режимы, exact publication inputs, preflight и terminal registry/install readback | Структурные checks, blind cases 4/5/9, независимый re-audit | verified |
| P1 build/help/mock могут дать ложный `verified` | Outcome states и representative built/installed job; real/sandbox/contract-conformant service boundary | Blind case 6 и независимый re-audit | verified |
| P2 runner/type-stripping guidance противоречива | Операторский стандарт закреплён однозначно; current Active LTS и supported erasable profile, без obsolete flag и `tsx` | Blind cases 1/2/3, official Node evidence и независимый re-audit | verified |
| P2 POSIX-only install smoke | Platform-appropriate temp/bin resolution и Windows/POSIX branches | Static/readback checks, blind cases 4/6 и независимый re-audit | verified |
| P3 все references объявлены required | Шесть references переведены в optional-active с точными triggers | Compiler/readback и независимый re-audit | verified |
| Adjacent P2: supporting forward prompts содержали путь author machine | Три path arguments заменены на `<skill-folder>` с явным disclosure о path normalization | Portability scan, compiler/package readback и bounded delta audit | verified |

## Проверки

Выполнено:

- `skill-source-compiler lint`, `regenerate`, `check` — PASS.
- `skill-creator quick_validate.py` — PASS.
- `evals/evals.json` — 9 уникальных scenarios, JSON contract PASS.
- Изолированные `compile` и compiled-package `check`, byte readback declared copies — PASS.
- `SKILL.md` — 229 строк, 19 393 bytes при лимите 20 000.
- YAML/UI parsing: description 264 code points, short description 46.
- Absolute dependency/symlink/diff checks — PASS для active/portable surfaces.
- Blind forward-tests: 9/9 PASS на normalized behavior snapshot `741cac097c6aafd30db1cc4e778c4435f4fbacfcaede6ca5a8d3878b75a5c61d`; prompts, summaries, fixture hashes и limits сохранены в [forward-test evidence](../forward-tests/forward-test-evidence-20260716-1.md).
- Первый independent re-audit full snapshot `4c8be406cf7d4e89ed35089493e9b2f3b20273426afd697701ec69b3b548bb97` закрыл все baseline findings, но дал `FAIL` из-за нового P2: три абсолютных author-machine paths в copied supporting evidence. Paths нормализованы в `<skill-folder>` с truthful disclosure и переданы на bounded delta audit.
- Independent bounded delta re-audit snapshot `4af6d07fa99a9521d3fa16aa4fca95f69a143c3b014647bba9d97983f6ee4e77` — `PASS`, P1/P2/P3 отсутствуют; portability P2 закрыт, normalized behavior snapshot остался `741cac097c6aafd30db1cc4e778c4435f4fbacfcaede6ca5a8d3878b75a5c61d`.

## Отклонения от плана

- Первоначальное предложение убрать универсальные Vite/`node:test`/native-stripping правила отклонено оператором. Реализация вместо этого устраняет внутренние противоречия и явно ограничивает стандарт областью данного скила.
- Node 24 не фиксируется; используется динамическая текущая Active LTS.

## Side effects

Изменения ограничены папкой `skills/cli-engineer`. npm publication, Git/GitHub mutations, установка зависимостей и внешние записи не выполнялись.

## Статус

**INDEPENDENT PASS** — source version 0.2.0, baseline remediation, blind forward-tests и portability delta независимо проверены; P1/P2/P3 отсутствуют на reviewed snapshot `4af6d07f…f6ee4e77`.
