# Исходный аудит financial-calculations-engineer

**Вердикт: FAIL.** Подтверждены три материальных противоречия инструкций уровня P2. Это независимый исходный аудит текста и источников; поведение исполнителя ещё не проверено. Наличие будущих поведенческих проб не требуется, чтобы сохранить уже установленные дефекты, но потребуется для проверки исправлений и общего PASS.

## Основание и границы

- Режим: `baseline`; assurance: `independent`. Reviewer не создавал и не исправлял оцениваемый snapshot. Новые агенты и trials не запускались.
- Потребитель: ведущий автор изменений группы domain skills; конечный потребитель скила — агент, выполняющий design, implementation или review финансовой арифметики по принятому контракту.
- Репозиторий: `/home/kostysh/.codex/skills/custom/.worktrees/domain-rev-20260909`.
- HEAD до и после проверки: `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`; target-specific `git status --porcelain=v1 -- skills/financial-calculations-engineer` пуст. При последнем readback появились соседние untracked supporting records ведущего агента; target не изменён и они не входят в snapshot review. Версия target: `0.3.0`; generated source hash: `9e9d156dcab083f150591d0d68c5e843b1e00eb400c55493be4f6083e3897b37`.
- Все относительные локаторы ниже отсчитываются от этого worktree; `target/` означает `skills/financial-calculations-engineer/`.
- Прочитаны repository AGENTS, target AGENTS, `docs/skill-standard.md`, `skills/skill-reviewer/SKILL.md`, methodology и forward-testing, целиком source/generated/fragment/UI target, все шесть активных references, supporting navigation, compile-report и три maintenance logs.
- Соседи проверены только для прямых контрактов: `code-reviewer` и его domain-routing, `spec-engineer`, а также релевантные выдержки TypeScript, testing, Supabase и architecture owners. Это не самостоятельный аудит соседей.
- Target и Git не изменялись. Запись ограничена данным отчётом в `/tmp`. Команды компиляции, установки, unit/runtime/SQL/browser tests не запускались.

Заявленная способность: преобразовать принятые денежные правила в точный calculation contract, безопасную целочисленную арифметику и честные доказательства для реально затронутых границ. Скил не устанавливает применимость налога, ставки, правила бухгалтерских проводок, currency metadata или FX policy; скил и его supporting logs не доказывают работу приложения.

## F-FIN-01 — P2: обязательный API-профиль противоречит обнаружению и локальному fallback

**Основание: conflicting; высокая уверенность в конфликте инструкций, без утверждения о наблюдавшемся неверном исполнении.**

Источники:

- `target/skill.yaml:100-101,135-139,152,156,161`; emitted `target/SKILL.md:20-21,107-111,127,131,136,190-197`.
- `target/references/server-backend.md:19-20` — для generic DTO разрешены только конкретные `parseDto`/`serializeDto`.
- Ограничивающие правила: `target/references/money-library-usage.md:7-15,28` допускают discovery, локальную формулу при отсутствии engine и условность EUR profile; `target/SKILL.md:213-218` объявляет API names и project profiles примерами до подтверждения.
- Нормативный критерий: `docs/skill-standard.md:58-62,66-75` — единый владелец решения, согласованные fallback и доступный portable local method.

Root требует EUR facade, конкретные DTO и generic factory даже после обнаружения иного пригодного API. При отсутствии canonical engine одновременно предписаны локальная формула и обязательный verified generic engine. Текст не определяет согласованный переход «другой публичный API с теми же финансовыми гарантиями» и не связывает все требования профиля с условием его обнаружения. Безусловная конфигурация process-global settings распространяется и на библиотеки с per-instance configuration.

**Путь отказа:** оператор предоставляет принятые code/scale/формулу, а проект имеет корректный immutable money API с другими именами DTO/методов либо одну локальную формулу без shared engine. Discovery подтверждает нужные гарантии; затем обязательные profile instructions требуют отсутствующий facade/factory/parser. Исполнитель должен либо блокировать достаточную задачу, либо придумывать переименование/обёртку, не необходимую контракту. Это материально ухудшает переносимость и пригодность handoff, даже если числа не меняются.

**P1 screen:** перенос профиля мог бы привести к нежелательной миграции денежных DTO, но source-authority, verify-before-use и запрет менять policy ограничивают этот путь. Наблюдавшейся миграции, финансового искажения или систематически неверной маршрутизации нет. Подтверждённый здесь эффект — неоднозначный fallback и лишний blocked/interop, поэтому P2.

**Ограниченное исправление:** оставить code/scale/unit/rounding/range/parser guarantees в общем методе; один условный профиль с `MoneyCents`, factory, DTO shapes и global settings применять только при подтверждённом совпадении публичного контракта. Явно разрешить обнаруженный эквивалентный API и определить локальный no-engine путь отдельно от missing-authority пути. Не создавать новый engine или адаптер только ради названий из примера.

**Фальсификатор и закрытие:** одинаковая достаточная финансовая задача проходит через (а) совместимый существующий профиль, (б) другой подтверждённый публичный профиль, (в) авторитетную локальную формулу без shared engine. Результат сохраняет существующие денежные контракты, не требует отсутствующих имён и не создаёт speculative package. Отдельный недостаточный case с неизвестным scale остаётся заблокированным. Это критерии будущих проб, а не выполненные тесты.

## F-FIN-02 — P2: правило остановки не отличает разрешённый приоритет источников от неразрешённого конфликта

**Основание: conflicting; высокая уверенность.**

Источники:

- `target/skill.yaml:121,126`; emitted `target/SKILL.md:90,95`.
- Первая инструкция устанавливает precedence specification → project contract → engine → application → examples. Вторая требует stop, если material rule `conflicting` или `lower-authority than another source`, без исключения для уже разрешённого приоритета.
- `target/SKILL.md:25-30,88` включает implementation/remediation и review.
- `AGENTS.md` раздел Authority допускает блокировку неразрешённых конфликтов; `docs/skill-standard.md:16-22,58-60,100` различает входные пробелы и требует проверять ненужную блокировку достаточной работы.

**Путь отказа:** оператор прямо просит привести старый расчёт к принятой новой спецификации. Версии, effective period и применимость заданы; engine/application сохраняют прежнюю формулу. Precedence однозначно определяет целевое правило, но наличие lower-authority conflicting implementation снова запускает stop и authority question. Оператор получает blocked вместо авторизованного исправления либо конкретного review finding; это обычная задача conformance/remediation, а не случай неясной налоговой политики.

**P1 screen:** правило консервативно останавливает работу, а не выбирает неверную ставку. Подтверждённого опасного действия, ложного closure или silent authority invention нет. Ошибка ограничена остановкой достаточной задачи и противоречием маршрута, поэтому P2.

**Ограниченное исправление:** при установленной применимости и precedence разрешать расхождение как implementation defect, применяя уже авторизованный режим работы; stop только для действительно неразрешённых ownership/precedence/applicability/version/effective-date вопросов. Не превращать каждое отличие кода от specification в новый запрос налогового решения.

**Фальсификатор и закрытие:** sufficient case с принятой новой формулой и устаревшим кодом приводит к исправлению/финансовому finding согласно режиму; одновременные противоречащие спецификации одинаковой силы без решения владельца блокируют только зависимую часть. Параметры пробы должны отличаться именно наличием разрешимого precedence, а не подсказывать исполнителю диагноз.

## F-FIN-03 — P2: знак результата обязан быть симметричным даже для принятого направленного округления

**Основание: conflicting; математическая несовместимость direct, путь поведения inferred.**

Источники:

- `target/skill.yaml:154`; emitted `target/SKILL.md:129`: обязательное `preserve sign symmetry` без условия.
- `target/SKILL.md:69,91,193-194` требует принятую sign/rounding policy; `target/references/database-sql.md:23` требует совпадения положительного и отрицательного поведения named mode.
- `target/references/vat-iva.md:18` содержит более точное условие: sign symmetry сохраняется, когда authority её требует; это условие не перенесено в общий workflow.
- Официальное описание `floor` и `ceil`: [PostgreSQL 18 mathematical functions](https://www.postgresql.org/docs/18/functions-math.html). Они направлены соответственно вниз и вверх, поэтому не обеспечивают нечётность функции округления.

**Путь отказа:** принятый контракт требует floor до целой minor unit для положительного и отрицательного результата. Для ±1.5 minor units правильные значения: 1 и −2; требование `R(-x) = -R(x)` одновременно выполнить нельзя. При следовании контракту executor нарушает blanket invariant скила; при проверке уже корректного кода может выдать ложный finding или blocked из-за отсутствующей симметрии. Отдельно reversal ранее зафиксированной суммы и новый отрицательный расчёт не обязаны использовать одинаковую policy: их различает владелец контракта.

**P1 screen:** замена −2 на −1 ради симметрии была бы материально неверной финансовой арифметикой, однако authority-first rules и условная VAT reference запрещают молча менять принятую policy. На source evidence подтверждён конфликт, способный вызвать ложный finding/stop; обход этих защит исполнителем ещё не наблюдался. Поэтому P2, без неподтверждённого P1.

**Ограниченное исправление:** требовать точного воспроизведения принятой sign/refund/reversal semantics; symmetry проверять только для mode и операции, которые её обещают. Не выбирать sign policy за владельца финансового контракта.

**Фальсификатор и закрытие:** sufficient directed-rounding case принимает 1/−2 без симметризации и ложного finding; symmetric half-away/half-even case сохраняет требуемую симметрию; reversal зафиксированного результата проверяется по отдельному принятому контракту. SQL и backend должны использовать одну fixture identity, если заявлена их parity.

## Что подтверждено и что пока ограничено

В reviewed surface не найден другой подтверждённый P1/P2. В частности:

- Наличие трёхбуквенного кода и scale `0..20` явно не приравнивается к ISO validity; code и scale имеют source/effective-period boundary. ISO отдельно описывает связь minor units и поддержание данных через SIX: [ISO currency codes](https://www.iso.org/iso-4217-currency-codes.html). Эта проверка подтверждает разделение структуры и currency authority, а не любую конкретную валютную ставку или профиль.
- EUR не разрешено переименовывать в другую валюту. FX требует самостоятельной authority и реализованной границы; factory не выдаётся за FX или registry.
- VAT/scorporo examples параметризованы принятой ставкой и fixation, residual policy не выбирается автоматически. Бухгалтерская корректность не выводится из суммы целых чисел.
- Unit-bearing human input и integer-minor-unit DTO разделены. Range, overflow, отрицательные значения, смешение currency/scale, allocation zero/ties и widened intermediates явно включены в риски.
- Диапазон int64 и необходимость точного widened intermediate согласованы с [PostgreSQL 18 numeric types](https://www.postgresql.org/docs/18/datatype-numeric.html). Это проверка общих PostgreSQL фактов; ни один частный `nodejs`/`postgresql` engine preset внешней библиотеки этим не проверен.
- Parity reference запрещает fixture/helper self-oracles, требует одинаковые фиксированные ожидания и реальные заявленные границы. Package tests/browser bundle/SQL text не закрывают application, persistence, PostgreSQL или ledger contour. `verified/partial/blocked` различены; общая runtime parity не заявлена данным аудитом.
- Direct ownership с `code-reviewer` согласован: financial skill поставляет числовую предметную оценку, reviewer владеет formal findings/recommendation. `spec-engineer` может оформить принятые правила и не создаёт налоговую/бухгалтерскую authority. Доступность отсутствующих соседей в standalone установке и достаточность design-only handoff ещё требуют поведенческой проверки; отсутствие этой проверки само по себе не объявлено дополнительным дефектом.

Прочитанные maintenance logs содержат исторические PASS и hashes прежних trials, но не заменяют сырые результаты на текущем basis. Новые catalog-selection и forced-execution trials не выполнялись; author/executor exposure текущих будущих кейсов этим отчётом не подтверждается. Полный compiler drift check, изолированная установка, SQL/browser/backend runtime и real financial integration в этом review не выполнялись. Имён ссылок и generated readback достаточно для текущих source findings, но не для поведенческого PASS.

## Передача

Ведущему автору: включить три finding в согласованную remediation boundary; сохранить независимые raw cases и критерии до изменения candidate; затем предоставить stable delta, source/generated evidence и полные результаты проб. Сокращение текста без закрытия этих путей не считается исправлением. Данный reviewer target не исправлял и общую готовность группы не оценивал.
