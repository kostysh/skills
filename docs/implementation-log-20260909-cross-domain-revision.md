# Ревизия сквозных предметных требований

## Основание и состояние

Принят план DOMAIN-REV-20260909-v1 от 09.09.2026; независимый аудит плана PASS. Пользователь разрешил независимые baseline-оценки, слепые испытания и итоговые аудиты двух скиллов. Коммит, push, PR и merge не разрешены.

База: `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`, ветка `codex/domain-rev-20260909`, worktree `.worktrees/domain-rev-20260909`. Создание worktree до правок подтверждено; Git metadata потребовали sandbox escalation, автоматическая проверка разрешила операцию. Главный checkout оставлен чистым.

Scope delta: unchanged. Unauthorized additions: none. Версии: gdpr-compliance 0.2.1 → 0.2.2, financial-calculations-engineer 0.3.0 → 0.3.1 и supporting-записи. Активные инструкции английские, журнал и отчёты русские.

## Исходные свидетельства

- [Версии целей и соседей](reviews/domain-rev-20260909/baseline-versions.json).
- [SHA-256 активных trial-копий](reviews/domain-rev-20260909/baseline-active-manifest.json). Копируются SKILL.md, references, assets, agents; source/maintenance и supporting history исключены из слепой экспозиции. Это ограничение доступа по инструкции в общей файловой системе, не жёсткая изоляция. Полный пакет отдельно проверяют независимые reviewers.
- [Входы выбора](reviews/domain-rev-20260909/selection-inputs.json) и [закрытые критерии](reviews/domain-rev-20260909/selection-criteria.json) закреплены до исправлений.

## Текущий этап

Исправления источников завершены: GDPR 0.2.2, finance 0.3.1. Структурные проверки, test:ci и candidate испытания завершены; получены два итоговых независимых PASS. Результат ожидает приёмки оператором на единственной итоговой контрольной точке. Автор/организатор случаев — основной агент; независимые исполнители и reviewers не авторы кандидатных инструкций.

## Проверки и пределы

Node, Chrome и Docker обнаружены; сервер Docker 29.6.2 отвечает. Baseline runtime J01 выполнил 185 проверок Node/PostgreSQL, candidate — 160; обе цепочки завершились возвратом свидетельств и предметными повторными оценками. Реальные персональные данные и финансовые операции исключены. Свидетельства skill-revision не являются юридическим/налоговым одобрением или доказательством непроверенных продуктовых контуров.

## Исходные findings и подготовка испытаний

Независимые source-grounded baseline reviews: [GDPR](reviews/domain-rev-20260909/baseline-gdpr-review.md) — 2 P1, 2 P2; [finance](reviews/domain-rev-20260909/baseline-finance-review.md) — 3 P2. Это defects инструкции; reviewers не заявляли наблюдавшийся отказ исполнителя.

[Закрытые критерии](reviews/domain-rev-20260909/execution-criteria.json) и входы: 9 GDPR, 8 finance, 6 catalog-selection. Дополнительные парные случаи закреплены по первым source findings до любых candidate-правок; первоначальные критерии не изменены. Общий J01: [источники](reviews/domain-rev-20260909/joint-input.json), [критерии](reviews/domain-rev-20260909/joint-criteria.json), отдельно реальные producer -> consumer -> evidence -> re-audit.

Для J01 запущен только принадлежащий задаче disposable Docker container `codex-domain-rev-20260909`, image `postgres:18.4`, без сети/портов, временное хранилище, 1 CPU/384 MiB. `pg_isready` и `select version()` подтвердили PostgreSQL 18.4. После сохранения свидетельств контейнер подлежит удалению; другие контейнеры не затрагиваются.

Прямое исходное чтение также подтвердило в finance ту же неоднозначность conditional-mandatory references, что GDPR-B04: шесть императивных triggers классифицированы как optional. Исправление относится к текущей разрешённой поверхности и нормативному правилу compiler source-language; проверка — source/emitted classification + фактическое чтение references в применимых trials.

## Исправления и текущая проверка

[Авторская проверка](reviews/domain-rev-20260909/author-self-check-v1.md) связывает GDPR-B01–B04, F-FIN-01–03 и FIN-A04 с исправлениями источников. [Стабильный полный снимок](reviews/domain-rev-20260909/final-target-manifest.json) — SHA256 по repository-relative путям; [активный trial v1](reviews/domain-rev-20260909/candidate-active-manifest-v1.json) зафиксирован до candidate исполнения. Только EOF-formatting GDPR отличается от trial, без изменения правил.

Baseline standalone: 9 GDPR + 8 finance и 6 selection соответствуют закреплённым критериям. Не заявляется измеренное улучшение, поскольку baseline ответы уже корректны. Подтверждены source-level противоречия и проверяется их устранение без регрессий. [Ошибка подготовки первого finance candidate](reviews/domain-rev-20260909/trial-preparation-incident.md) исключена из сравнения; новый независимый исполнитель получил очищенные исходные входы.

[Структурные результаты](reviews/domain-rev-20260909/structural-results.json), [финальный GDPR formatting check](reviews/domain-rev-20260909/gdpr-final-format-checks.json), [ссылки и isolated output](reviews/domain-rev-20260909/links-isolated-results.json), [test:ci](reviews/domain-rev-20260909/test-ci.txt): 108 passed. [Границы validator и оркестрации](reviews/domain-rev-20260909/validation-limits.md) не скрыты. [Официальные источники](reviews/domain-rev-20260909/official-source-check.md) поддерживают узкие изменённые предметные утверждения.

## Итог независимых проверок

- [gdpr-compliance 0.2.2 — PASS, change / independent](reviews/domain-rev-20260909/final-gdpr-review.md).
- [financial-calculations-engineer 0.3.1 — PASS, change / independent](reviews/domain-rev-20260909/final-finance-review.md).

Оба reviewers независимо сверили полный target manifest, реальные source/generated и применимые evidence; неразрешённых P1/P2 нет. Их промежуточные source-review не выдавались за окончательные verdict. Окончательные оценки включают [поведенческое сравнение](reviews/domain-rev-20260909/behavioral-comparison.md) и реальные [baseline](reviews/domain-rev-20260909/baseline-joint/runtime-report.md) / [candidate](reviews/domain-rev-20260909/candidate-joint/runtime-report.md) цепочки.

Общие численные ожидания сопоставлены отдельно: [20 literal/variant/contour readbacks](reviews/domain-rev-20260909/joint-literal-oracle-readback.json). Candidate evidence содержит 160 expected/actual assertions без расхождений и 60 дополнительных записей ошибок/наблюдений; 44 отрицательных service-входа и 12 прямых SQL-входов входят в эти проверки, а не прибавляются как отдельный success metric. Baseline/candidate числа assertions не сравниваются как показатель улучшения.

Предметные возвраты: [baseline GDPR](reviews/domain-rev-20260909/baseline-joint/gdpr-reassessment.md), [baseline finance](reviews/domain-rev-20260909/baseline-joint/finance-reassessment.md), [candidate GDPR](reviews/domain-rev-20260909/candidate-joint/gdpr-reassessment.md), [candidate finance](reviews/domain-rev-20260909/candidate-joint/finance-reassessment.md). Финальные candidate runtime hashes и readback — [проверка](reviews/domain-rev-20260909/candidate-runtime-readback.json). Первые ошибки SQL division/MAX и NULL helper сохранены в runtime evidence; исправления относятся к временным реализациям, target skill после фиксации не менялся. Directed repair не объявляется blind first-pass success.

[Уточнение count](reviews/domain-rev-20260909/joint-count-clarification.json) одинаково дано обоим потребителям как synthetic fixture input; оригинальные SPEC сохранены. Это обработка конкретного вопроса владельцу, а не новое реальное продуктовое/правовое решение или изменение критериев numeric/privacy.

[Cleanup](reviews/domain-rev-20260909/resource-cleanup.json): удалён только принадлежащий задаче контейнер по точному ID и временные файлы задачи. Raw evidence, source snapshots, handoffs и reports сохранены; [32 файла trial-копий](reviews/domain-rev-20260909/trial-copy-verification.json) совпали с исходными manifests. Архивы trial-packages — ненормативные свидетельства конкретной экспозиции, не дополнительные действующие навыки. Worktree оставлен для приёмки. Старые абсолютные /tmp пути в журналах обозначают место выполнения; текущие доступные копии находятся в этой supporting-папке.

## Итоговая контрольная точка

**Результат:** разрешённая доработка двух навыков завершена в отдельном worktree; оба независимых CHANGE review — PASS. Scope delta: `unchanged`; Unauthorized additions: `none`. Изменены только две цели и связанные supporting-записи. Соседние навыки использованы по принятым прямым контрактам, их исходники не менялись.

**Capability:** агенты в зафиксированных сценариях корректно разделяют предметные правила и полномочия, выполняют локальные расчёты/оценки и передают ограничения до реального service/PostgreSQL исполнения с возвратом доказательств. **Substrate:** source/generated, версии, шаблоны, журнал, trial snapshots и raw evidence. **Anti-claims:** нет доказательства универсальной надёжности, host auto-loading, HTTP/browser/production, всех отказов/конкуренции, реального GDPR compliance, налоговой применимости или бухгалтерской политики. Baseline уже проходил самостоятельные случаи; измеренное улучшение success rate не установлено.

- `accepted now`: предмет этой приёмки — GDPR 0.2.2 и finance 0.3.1 на указанном стабильном снимке, два независимых PASS и ограниченные доказательства выше. Это предложение оператору принять результат, не утверждение, что он уже его принял.
- `not accepted`: коммит, push, PR, merge, установка в основной checkout/каталог; непроверенные runtime и правовые claims. Узкий GDPR quick_validate остаётся documented compatibility limit, не PASS этого инструмента; owning validation пройдена.
- `blocking decision`: `none` — технических блокеров и неразрешённых P1/P2 нет. Формальная приёмка оператора ещё ожидается.
- `next autonomous action`: `none` до приёмки этой контрольной точки. Git/publication требуют отдельного разрешения.

Ключевые решения и влияние:

1. Условные consent/probe/reference правила и конкретный implementation owner устраняют противоречия без расширения полномочий агента. В результате downstream получает выполнимое ограничение и ожидаемые наблюдения, а существующие read-only/security/legal границы сохраняются.
2. Фактический API/DTO либо локальная формула заменяют обязательность профильного примера; rounding/sign проверяются по принятому режиму. Это сохраняет проектные контракты и не создаёт общий engine, адаптер или миграцию ради навыка.
3. Ограниченные evidence и независимый re-check определяют силу результата. Runtime fixtures остаются временными, guided исправления и исключённый contaminated run обозначены явно; статистический или production успех не выводится из положительных samples.

Обязательные проверки: owning compiler lint/check/isolated compile, ссылки/переносимость, source/generated readback, `git diff --check`, объявленный `pnpm test:ci` — 108 passed. У целей нет package/runtime, отдельные package commands неприменимы; искусственный harness не создавался. System quick_validate и оркестрационные ограничения изложены выше. Дополнительная SQL проверка выполнена по конкретному обнаруженному дефекту, после исправления повторён применимый набор. После итоговых PASS изменялись только административные supporting-записи и cleanup, не target snapshot или интерпретация вердикта.

### Recovery ledger

Снимок: 2026-09-09T12:26:45.015243+00:00. Задание/источник: принятый оператором DOMAIN-REV-20260909-v1; owning repository AGENTS.md и docs/skill-standard.md; execution checkpoint — `/home/kostysh/.codex/PLANS.md`.

Repository: `/home/kostysh/.codex/skills/custom`; worktree: `/home/kostysh/.codex/skills/custom/.worktrees/domain-rev-20260909`; branch: `codex/domain-rev-20260909`. HEAD и base: `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`; ahead/behind base `0/0`; upstream не настроен. Staged: none; unstaged: 21 tracked files в двух целях; untracked: общий журнал и `docs/reviews/domain-rev-20260909/`. Главный checkout чист. [Фактический readback](reviews/domain-rev-20260909/final-local-readback.json).

Target manifest: `reviews/domain-rev-20260909/final-target-manifest.json`, SHA256 `5354de2ff05fc1117ea991c09ec1db1f92dc274499c2ecad2f72ddb4a765496e`, 33 файла. Verdict покрывает этот снимок; добавленные итоговые отчёты/cleanup не включаются в старый hash. Evidence locators — ссылки выше.

External tracking/publication: отдельный issue не создавался по плану; новых commits, push, PR, merge или GitHub CI run нет. Remote CI не относится к этой непубликуемой контрольной точке; локальный обязательный test:ci завершён. Последний принятый checkpoint — план, реализация сейчас предъявляется впервые. Следующее разрешённое автономное действие: none; после ответа оператора сначала сверить перечисленные mutable surfaces и определить отдельно разрешённую Git-операцию.

Остановка обязательна по PLANS.md: “stop until explicit operator approval.” Результат подготовлен полностью до запроса приёмки; дополнительные разрешения не запрашивались для уже авторизованных действий.

## Ответ оператора после контрольной точки

2026-09-09T12:32:21.610025+00:00: сообщение «продолжай» принято как подтверждение итоговой приёмки. Все 33 target hashes и HEAD сверены, изменений снимка нет. Реализация принята; конкретная граница дальнейшей Git-публикации уточняется отдельно согласно принятому плану.

2026-09-09: оператор ответил «да, делай все что нужно» на явный запрос полного цикла «коммит → push → PR → CI → merge». Публикация принятых изменений разрешена полностью. Используется обычный merge commit по истории репозитория; CI проверяется до merge и на итоговом master. Target snapshot не менялся.

Проверка staged diff обнаружила только сохранённую пустую строку EOF в frozen trial-packages/candidate/gdpr-compliance/references/audit-methodology.md:226. Исторический пакет сохранён byte-for-byte для воспроизводимости hash; рабочие инструкции проходят diff --check. Это ограничение форматирования evidence, не изменение принятого снимка.
