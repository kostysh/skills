# DESIGN-TOOLS-REV-v1 — принятый план

## Основание и результат

Оператор 2026-09-09 принял полный план в беседе и поручил реализацию. Первичный scope — приложенный запрос «Инструменты дизайна и компонентов», разделы 1–3. [Аудит плана](reviews/design-tools-rev-20260909/plan-audit.md): PASS. [Закрытые критерии](reviews/design-tools-rev-20260909/criteria.md) конкретизируют проверки, не добавляя scope. AGENTS.md владеет workflow, docs/skill-standard.md — качеством, skill-reviewer — verdict/forward-testing, skill-source-compiler — generation/self-check. Отдельного issue нет: direct request достаточен.

Capability: два самостоятельно полезных скилла и наблюдаемая цепочка Pencil→shadcn→browser→fix. Substrate: source/generated instructions и evidence. Anti-claims: compiler/mocks/screenshots/старый PASS не доказывают runtime или automatic Pencil→React. Scope delta unchanged; Unauthorized additions: none.

## Три этапа

1. Worktree до изменений, baseline полных пакетов и соседей, фиксированные raw cases/criteria до исправлений, independent baseline reviews и comparable trials; selection отдельно от forced execution. При недоступном live инструменте сохранить baseline и продолжить независимое.
2. Исправить подтвержденные недостатки shadcn и pencil-dev через объявленные source bundles; регенерация; сохранить самостоятельность и проверить прямые стыки пяти соседей без их изменений. Все области исходного запроса обязательны для ревизии, но не объявлены дефектами заранее. Адаптация официального Astra prompting guide в границах authority. Active EN, общий log/reports RU, существующие templates, ссылки обоих docs/README.
3. Comparable baseline/candidate GPT-6 Astra fresh blind runs; реальные shadcn add/composition/update+browser, Pencil edit/component/instance/readback/visual/PNG export/save, joint по shared brief. Raw evidence и model/exposure provenance. Compiler lint/regenerate/check/isolated compile+parity, links/metadata/portability/diff, frozen pnpm install и test:ci, owning checks по применимости. Авторский self-check, independent stable reviews каждого target + joint/interop, P1/P2 correction→RCA при повторе→обновление затронутого verdict. Сохранить evidence и проверить cleanup только своих ресурсов.

## Условия и приёмка

Полный утвержденный сценарий по умолчанию: Vite/React/TypeScript local notification settings, email/switch/frequency/dialog/result, desktop/mobile/validation/disabled/keyboard/focus; отдельный Pencil test doc. При отсутствии natural defect — явно контролируемый focus defect отдельно от blind trial. Без backend/email delivery claims. Полный план также требует разных sufficient/missing/conflicting inputs, tool error/recovery, authority, partial, catalog/standalone/interop cases — критерии связаны выше.

Операционные зависимости: работающий Pencil MCP с отдельным canvas и проверяемый save (UI operator action и reopen readback, если нужен); браузер; работоспособный pnpm. Missing essential live evidence блокирует общий PASS, не независимую работу. Assigned/runtime model/settings различать; shared filesystem не hard sandbox.

Один итоговый hard-stop checkpoint: изменения/before-after/independent verdicts/joint evidence/limits/recovery ledger по PLANS.md. Никаких новых промежуточных approval gates. Commit/push/PR/merge запрещены без отдельного разрешения. Откат — только task-owned изменения в task worktree, после сохранения evidence; соседние worktrees и user state не менять.

## Уточнение оператора в ходе исполнения

2026-09-09 оператор установил Base UI для целевых shadcn live/joint проверок и отсутствие альтернативного имени внутри skill. Это уточняет исходный technology scope; общие задачи, три этапа и единый acceptance checkpoint сохранены. S-02 generic metadata расширение отозвано, исходное Base UI metadata восстановлено; functional S-01 исправление остаётся. Предыдущие raw прогоны сохраняются как исторические и не заменяют comparable Base B0/C2. Самостоятельные Pencil проверки продолжаются; оператор отдельно подтвердил все перечисленные тестовые изменения областей A/B после auto-review блокировки.
