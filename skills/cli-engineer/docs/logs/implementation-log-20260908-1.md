# CLI: сохранение существующего tooling и точный interop

Основание: прямой запрос оператора и принятый FOUR-SKILLS-20260908-v2. Версия 0.2.0 → 0.2.1. Изменения только в принятом worktree; commit/push/merge не разрешены.

- P2 CLI-SCOPE-01: baseline C20 исправил JSON, но до проверки заменил рабочий `tsx` test runner и переписал enum. Причина — root, overview, references и UI повторяли абсолютный запрет, исключая сохранение test tooling даже при обычном repair. Каноническая Standard CLI toolchain policy теперь сохраняет поддерживаемый runner/loader/build; defaults действуют для новой настройки и разрешённой замены. Исправлены все активные повторения, scope quality-gate setup и supporting eval expectations. Исторический запрет из записи 20260716 остаётся историей; актуальный операторский план прямо требует избежать незапрошенной миграции.
- P3 CLI-TEL: краткий CLIG совет ссылается на единственное конкретное consent-правило Telemetry And Updates.
- Interop: уточнены конкретные входы/выходы и границы потребления TS, Node, testing, review, security, Git/GH; добавлены условные documentation, product/spec/architecture и delivery передачи. Отсутствующий специалист ограничивает зависимое заключение.

Compiler и авторская проверка подтверждают только структуру и согласованность. Независимые candidate trials и формальные вердикты фиксируются в [общем журнале](../../../../docs/logs/implementation-log-20260908-1.md) и [evidence](../../../../docs/reviews/evidence/engineering-skills/author-cli.md). Пакет не добавляет runtime или постоянный испытательный framework.
