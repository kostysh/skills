# UI-REV-v1 — baseline agent-browser

**PASS в границе независимого source-grounded baseline и readback команд установленного CLI. P1: 0; P2: 0; P3: 0.** Это не verdict о фактически выполненном browser flow, fresh behavioral generalization или текущем STAGE. Эти claims данным запуском не проверялись.

## Основание и снимок

- Mode: `baseline`; assurance: `independent`. Reviewer `/root/ui_baseline_browser` не автор и не remediator проверенного снимка. Проверяемый consumer — агент, выполняющий запрос оператора через agent-browser и передающий честный `completed | partial | blocked` результат.
- Target: `/home/kostysh/.codex/skills/custom/.worktrees/ui-revision/skills/agent-browser`.
- Git HEAD: `ef47c805624f77ad0b1febb9604f160e72eca441`. Source, generated active instructions, reference и UI совпадают с HEAD. Единственная исходная локальная дельта — supporting `docs/README.md`, добавляющая ссылку на общий журнал UI-REV-v1; она включена в snapshot и не повышена до runtime authority.
- 12 файлов, aggregate SHA-256: `32919783a42541f9ab328190d29b252b258102e5858f245a7d81007a2c67b801`. Manifest: `/tmp/ui-rev-browser-snapshot.sha256`. Convention: все обычные файлы target рекурсивно, сортировка по POSIX relative path от корня skill; строка `SHA256(bytes) + two spaces + relative-path + LF`; aggregate = SHA256 UTF-8 manifest. Никаких абсолютных путей внутри hash input.
- Прочитаны repository AGENTS.md (root и worktree идентичны), skill standard, reviewer root/methodology/forward-testing, target AGENTS.md, весь `skill.yaml`, `fragments/overview.md`, generated `SKILL.md`, единственная active reference, UI metadata, compile report, README и четыре historical logs. Исторические PASS не приняты за результаты этого запуска.

## Подтверждённая граница

| Claim | Прямое основание | Результат и предел |
| --- | --- | --- |
| Version-matched command syntax | `SKILL.md:18-20,38-59,93,124,132`; source `skill.yaml`; installed `--version`, `--help`, `skills get core --full`, `doctor --help` | Installed 0.27.3; все локально названные runnable команды и флаги присутствуют в supplied help/core. Browser commands не запускались. |
| Terminal state вместо substrate-only closure | `SKILL.md:61-74,95-101,107-114`; соответствующий overview полностью присутствует в generated root | Требуется наблюдать запрошенный URL/visible state; скриншот, snapshot и успешная команда сами по себе не достаточны. Это проверка инструкции, не наблюдение выполнения будущим executor. |
| Extraction completeness | `SKILL.md:65-66,96` | Поля, pagination/lazy-loading scope должны быть проверены; недоказанная полнота означает partial. Нет требования автоматически считать один snapshot полным dataset. |
| Real/intercepted distinction и domain boundary | `SKILL.md:67-70,97,108,118-120` | Mock UI и backend/provider acceptance разделены; formal E2E и backend RCA переданы владельцам. |
| Authority и secrets | `SKILL.md:78-84,92-93,109,127,132`; `references/cloudflare-access-otp.md:8-18,22-50,67-71` | Governing policies остаются authority, CLI поставляет синтаксис. Нет полномочий из allowed-tools; другие доступные host tools не обязаны совпадать с metadata. OTP reference явно требует identity/freshness/confidential input и разделяет human/application/infrastructure auth. |
| Cleanup ownership | `SKILL.md:110,126`; Access reference `:24-28,50-53` | Cleanup ограничен сессиями/процессами задачи; допускается явная передача владельца оставленного процесса. Access требует уникальную непостоянную сессию и подтверждение закрытия. |
| Progressive disclosure/package | `SKILL.md:20,137-143,150-154`; manifest/source/UI readback | Название Optional references не скрывает условие: root дважды явно требует чтение перед Access flow. Все перечисленные локальные файлы присутствуют. История не normative. |

## Проверки и наблюдения

Выполнены read-only CLI `agent-browser --version`, `agent-browser --help`, `agent-browser skills get core --full`, `agent-browser doctor --help`. Все завершились кодом 0; core прочитан полностью (2444 строки), durable copy `/tmp/ui-rev-browser-core.txt`; doctor help `/tmp/ui-rev-browser-doctor-help.txt`. Измеренный текстовый readback не доказывает runtime семантику всех команд внешнего CLI.

Source/generated проверены отдельным чтением; Python подтвердил полное включение overview fragment в generated root. Compiler check/regeneration не запускались: изменений target нет; это не новая compiler parity certification. Raw external CLI guidance содержит широкие workflow/security советы и шаблоны, но локальные `SKILL.md:93,132,143` ограничивают его роль синтаксисом. Его `close --all`, auth-template cleanup или советы по повторному auth не создают авторизации закрыть чужие сессии либо обойти локальный Access contract.

Проверен потенциальный failure path диагностики: `doctor --offline --quick` **автоматически очищает stale socket/pid/version sidecar files**, даже без `--fix` (doctor help, строки 8–10; core строки 348–350). Локальный текст не называет эту команду read-only и в той же строке `SKILL.md:93` ограничивает mutating repair уже имеющейся авторизацией; `:80,92,132` сохраняют эту границу. Поэтому установленный факт не образует подтверждённый P1/P2. Сам doctor не запускался. При отдельном будущем behavioral case существенный falsifier — executor вызывает doctor в явно read-only задаче, не учитывая auto-clean; до такого доказательства не предлагается менять skill только ради изменения.

Новые browser sessions, installation, authentication, mailbox access, network requests и external side effects не запускались. Target не редактировался. Созданы только reviewer evidence/report в `/tmp`.

## Findings и limits

Материальные findings отсутствуют; нет достаточного request-to-wrong-output пути для P1/P2 и нет необходимости вводить косметический P3. Source inspection не обнаружил системного ложного closure, подмены human identity, обязательного installation, закрытия чужого browser state или неявной передачи authority внешнему core.

Fresh blind execution/selection trials не проводились; reviewer видел весь source и supporting history, поэтому собственное мысленное применение правил нельзя назвать blind evidence. Actual UI, extraction на paginated сайте, confidential OTP channel, cleanup runtime и поведение при runtime failure не проверены. Historical logs описывают старые bounded trials/live rehearsal, но raw traces и их соответствие нынешнему снимку здесь не переаудировались.

Таким образом, PASS относится к независимому baseline inspection и установленному command-guidance contract. Он не закрывает acceptance material behavior changes UI-REV-v1 и не является универсальным capability PASS. Владелец ревизии может использовать этот baseline вместе с отдельно полученными proportionate trials; отсутствие fresh UI trials не превращено в дефект документации. Необходимых исправлений по этому baseline не установлено.

## Independent addendum — applicability и classification

Повторная source-grounded оценка до remediation. Дополнительно прочитан полный `skills/skill-source-compiler/references/source-language.md`, сверены manifest/generated строки и supplied raw decision result `/tmp/ui-rev-20260908/results-baseline-decisions/browser-limits.md`. Reviewer target не менял. **Уточнённый итог: прежний bounded PASS сохраняется; P1: 0, P2: 0, P3: 1.** Предыдущие нулевые counts описывают первоначальную оценку до обнаружения compiler classification rule; это addendum её уточняет.

### Ordinary task → package maintenance

`SKILL.md:145-148` действительно содержит portability checklist в активном root, но команда в `:147` — `Run the skill-source-compiler check command after regeneration`. Условия regeneration нет в ordinary browser task, skill не требует регенерировать пакет перед browser flow. Следовательно, само наличие заголовка «before finishing» не отменяет явно указанное условие конкретного пункта. Правило нельзя считать unconditional compiler dependency, аналогичной другой skill, без доказательства, что агент обязан сначала инициировать regeneration.

Второй пункт `:148` просит подтвердить understandable copied skill и честный blocked/handoff при отсутствии CLI. Он не требует создать копию, проверить compiler или выполнить package portability test в каждом browser task. Формулировку можно сделать более точно ориентированной на maintainer при очередной правке, но source-grounded material wrong action из неё сейчас не следует. Raw browser-limits result завершил два объяснения границ без browser/CLI/compiler запуска; проверку CLI отложил до реального исполнения команд. Это bounded decision evidence против unconditional maintenance reading, не доказательство universal behavior.

P1 screen: нет подтверждённого invented authority, false completion или опасного действия. P2 path также не установлен: предложение «after regeneration» нельзя без дополнительного основания трактовать как требование произвести regeneration. Finding по этому пути не заведён. Возможный falsifier для будущего trial: ordinary navigation task с достаточными данными и доступным CLI завершается blocked только из-за отсутствия skill-source-compiler или запускает package check, хотя regeneration не запрошена и не происходила.

### AB-P3-01 — conditional mandatory reference неверно классифицирована как optional

**Basis: direct; severity P3.** `skill.yaml:17` задаёт `required: false`, `:48-50` помещает Access reference в optionalReferences; generated `SKILL.md:137-138` называет раздел Optional references, а compile report перечисляет Required references: none. Однако `skill.yaml:18,58` и generated `SKILL.md:20,138` прямо требуют прочитать reference перед human Cloudflare Access flow. Действующий compiler `references/source-language.md:30-32` однозначно требует required classification для conditionally mandatory reference, сохраняя conditional reading trigger. Это установленное несоответствие source contract, пропущенное первоначальным readback.

Наблюдаемое следствие — metadata/heading/compile-report неверно представляют обязательность reference для наступившего условия. Consumer-maintainer получает неоднозначную классификацию; root executor всё ещё получает ясное обязательное чтение в Start here и рядом со ссылкой. Все references, включая optional, по source-language:30 должны существовать; файл здесь есть и заявлен в package. Поэтому нет основания превращать эту несогласованность автоматически в потерю файла, скрытый prerequisite или успешный обход OTP.

P1 screen: пропуск identity/freshness или ложное human-login completion был бы P1, но такой путь текущими наблюдениями не подтверждён: root прямо требует reference и содержит отдельный prohibition infrastructure substitution. Для P2 понадобился бы материальный packaging/retrieval сбой либо demonstrated failure применения reference. Сейчас проблема ограничена ясностью структурной классификации. Supplied browser-limits case применяет содержимое reference и корректно возвращает blocked для недоступного human OTP пути; это поддерживает ограниченную severity, не исключает все будущие failures.

Bounded fix: в source поставить `required: true`, перенести id из `optionalReferences` в `requiredReferences`, сохранить точный trigger для human Access OTP, регенерировать только compiler-owned output. Не делать reference unconditional для прочих browser tasks и не расширять auth rules. Verification/falsifiers: source/compiled required classification совпадает, reference включена в emitted package; ordinary unauthenticated case не читает её без причины; human Access case читает её до действий и сохраняет отдельные human/application/infrastructure boundaries. Если изменение заставит читать CF guidance при любом browser task либо потеряет conditional trigger, исправление не проходит.

Это P3 не оправдывает самостоятельное расширение scope и не требует invent отдельного issue. Remediation решает владелец авторизованной ревизии. Actual browser trial, обозначенный владельцем как выполняющийся, ещё не получен и в этот verdict не включён.
