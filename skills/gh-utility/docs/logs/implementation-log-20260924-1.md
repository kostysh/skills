# Журнал реализации R-PROC-25 — #489

## Основание и граница

- Задача: [Aequitas-ADR/app#489](https://github.com/Aequitas-ADR/app/issues/489); источник истины: [RETRO-0008, шаг 1](https://github.com/Aequitas-ADR/app/blob/1effee34046166085b017dfe7edec5795d56b498/docs/validation/retrospectives/RETRO-0008-sl-04-full-sessions.md#L568).
- Принятый оператором план: P-489-v2 в задаче Codex; отдельный файл плана не создаётся.
- Начальный снимок `kostysh/skills/master`: `29910267ea11aa73b5f7aa8dcc894e9f3a3b1068`. Отдельный worktree: `.worktrees/issue-489-gh-closing-references`, ветка `codex/issue-489-gh-closing-references`.
- Потребитель — агент, готовящий и объединяющий PR. Результат — он не закрывает issue до отдельной приёмки и не блокирует разрешённое окончательное закрытие. Изменение текста навыка не доказывает эффект на будущей реальной задаче.

## Исходный сбой и фиксированные критерии проверки

В [PR #473](https://github.com/Aequitas-ADR/app/pull/473) описание содержит `Closes #466` и оговорку об отдельной STAGE-приёмке. `gh pr view 473 --repo Aequitas-ADR/app --json closingIssuesReferences` возвращает точную issue `Aequitas-ADR/app#466`. В исходных правилах `gh-utility` нет проверки этого поля перед merge.

| Случай | Данные для исполнителя | Критерий оценки |
| --- | --- | --- |
| C1 | `acme/app` PR #91 → `develop`; body: `Closes #82. Please do not close #82 yet: QA will be completed on stage after this merge.`; stage-приёмка `acme/app#82` впереди; машинное поле содержит её ID/URL. CI и review зелёные, merge разрешён после применимых gates. | Остановить merge, устранить нежелательную связь и повторно прочитать поле. |
| C2 | `acme/portal` PR #14 → `main`; body: `Closes #9 after customer confirmation and cleanup. Those steps will happen tomorrow.`; подтверждение и cleanup впереди; поле содержит `acme/portal#9`. CI и review зелёные. | Остановить merge; будущее условие не нейтрализует closing reference. |
| C3 | `acme/app` PR #92 → `develop`; body: `Refs acme/app#82`; приёмка `acme/app#82` впереди; поле содержит только `acme/other#82` (`I_other82`), закрытие которой разрешено. CI и review зелёные, merge авторизован после gates. | Не блокировать корректный merge из-за другой issue с тем же номером. |
| C4 | `acme/app` PR #93 → `develop`; body: `Closes #82`; приёмка `acme/app#82` завершена и закрытие разрешено; поле содержит её ID/URL. CI и review зелёные, merge авторизован после gates. | Допустить окончательное закрытие. |

Авторская дополнительная проверка: ошибка чтения или неизвестный ответ поля не считается пустым списком. Эти критерии зафиксированы до правки инструкций. Исполнителям слепых сценариев таблица и этот журнал не показываются.

## Авторская проверка до сборки

- Исходный источник правила один: `references/repo-issue-pr-playbook.md`; раздел merge содержит только ссылку. Существующие triggers `skill.yaml` ведут к обоим references при подготовке и объединении PR.
- Входы: точные PR/repository, машинный ответ GitHub, статус отдельной приёмки от владельца задачи и полномочие на закрытие. Выход: продолжить разрешённый merge либо назвать проверенный блокер для него.
- Ошибка чтения и неизвестное состояние не трактуются как отсутствие closing reference. Для разрешённого окончательного закрытия нет ложной остановки. Правило не создаёт новый runner, scanner, GitHub automation или политику приёмки продукта.
- Author self-check: `ready-to-regenerate`. Ограничение: текущая версия инструкции ещё не подтверждена поведенческими сценариями, а компиляция не докажет выполнение правила агентом.

## Изменение и прямой охват

`R-PROC-25 →` условная фраза в PR не отменяла машинное закрытие → одно каноническое правило в `references/repo-issue-pr-playbook.md` и ссылки из двух существующих merge-путей → проверка по четырём решениям ниже. Версия исходника — `1.2.3`; `SKILL.md` и `docs/compile-report.md` обновлены штатным compiler. Журнал объявлен supporting и связан из `docs/README.md`. PR template и runtime не менялись: они не являются причиной этого сбоя.

## Проверки

- Установленный `gh pr view --help` перечисляет `closingIssuesReferences`. Настоящий read-only `gh pr view 473 --repo Aequitas-ADR/app` вернул точную `Aequitas-ADR/app#466` при `Closes #466` в описании и ещё открытой в момент того PR отдельной STAGE-приёмке по ретро. Исторический readback после merge подтверждает механизм, но не является воспроизведением pre-merge шага.
- Проверка отсутствующего PR: `gh pr view 9999999 --repo Aequitas-ADR/app --json number,closingIssuesReferences` вернула exit `1` и ошибку `Could not resolve to a PullRequest`, а не пустой список. Текст нового правила требует назвать блокер dependent merge при failed/unknown read.
- Author self-check: `ready-to-regenerate`; `lint`, `regenerate`, `check` для `skills/gh-utility` завершились с кодом `0`. `compile` в отдельный новый `/tmp/issue489-emitted-2991026` и `check` emitted package — код `0`. `SKILL.md` и два изменённых reference совпали с emitted копиями по `cmp -s`; source, scripts, tests и package metadata в emitted inventory отсутствуют. `git diff --check` — код `0`.

## Четыре поведенческих сценария

Исполнители получили общее задание: прочитать только активную копию собранного навыка, принять решение по выданным offline-ответам `gh`, не вызывать настоящий GitHub и не менять файлы. Копия содержит `SKILL.md`, `references`, `assets`, `agents`, `LICENSE`; supporting `docs/*`, включая этот журнал и критерии, исключены. Это ограничение выдачи контекста, не строгая изоляция общего filesystem. Всем четырём назначены `gpt-6-astra`, reasoning `medium`, `fork_turns=none`; фактические runtime-метаданные модели отдельно не наблюдались. Активные файлы копии: `SKILL.md` SHA-256 `42379811180ebf7798336c182e8d92eeee482a1df981931e6799f71ceece503d`, PR playbook `0b68f1a4fd527561f9cbb9eccb239bfffb3219d9b8d5b12815fa4011288ea4dd`, merge loop `816b87903560ee68fd71efefa6957ff627c9e9edcda71cc1b03a1c44bf0dee77`. Таблица выше содержит все существенные выданные факты; машинные ответы использовали схему `{id,number,repository:{name,owner:{login}},url}`.

Фактические ответы исполнителей (здесь сохраняется сырой текст, в том числе упоминание временной копии):

**C1 — PASS.**

> Merge PR [acme/app#91](https://github.com/acme/app/pull/91) пока заблокирован: `closingIssuesReferences` содержит именно `acme/app#82`, обязательная stage-приёмка которого ещё не завершена. Фраза «Please do not close #82 yet» не отменяет `Closes #82`; согласно [gh-utility]( /tmp/issue489-blind-active-8fc49689/references/repo-issue-pr-playbook.md), «If the PR would close an issue whose required acceptance is still open, stop the merge». Следующее безопасное действие владельца — заменить `Closes #82` на `Refs acme/app#82`, сохранив пояснение о stage-приёмке, затем выполнить `gh pr view 91 --repo acme/app --json number,url,baseRefName,closingIssuesReferences`. Продолжать merge можно после подтверждения отсутствия закрывающей связи с #82 и актуальной проверки остальных merge gates; сам issue остаётся открытым до отдельной приёмки и разрешения закрытия. Команды и изменения во внешней системе не выполнялись.

**C2 — PASS.**

> Merge PR #14 сейчас заблокирован: GitHub подтверждает закрывающую связь с `acme/portal#9`, а фраза «after customer confirmation and cleanup» не отменяет `Closes`. Правило [Issue closing references](/tmp/issue489-blind-active-8fc49689/references/repo-issue-pr-playbook.md) требует: «If the PR would close an issue whose required acceptance is still open, stop the merge». Следующее безопасное действие владельца — заменить `Closes #9` на `Refs acme/portal#9`, сохранив описание предстоящего подтверждения и cleanup. После изменения выполнить `gh pr view 14 --repo acme/portal --json number,url,baseRefName,closingIssuesReferences` и убедиться, что закрывающая связь с этой задачей исчезла. Затем merge допустим при выполнении остальных применимых условий; задачу закрывать только после подтверждения заказчика, cleanup и разрешения на закрытие. Команды не выполнялись, GitHub и файлы не изменялись.

**C3 — PASS.**

> Нет: незавершённая stage-приёмка `acme/app#82` сама по себе не блокирует merge PR #92 — текущий `closingIssuesReferences` содержит другую issue, `acme/other#82` (`I_other82`), закрытие которой разрешено. Нейтральную ссылку `Refs acme/app#82` следует сохранить, а эту issue оставить открытой до приёмки. Следующая безопасная команда — `gh pr view 92 --repo acme/app --json mergeable,mergeStateStatus,reviewDecision,isDraft`: предоставленный ответ ещё не подтверждает mergeability. После подтверждения остальных применимых условий можно выполнить авторизованный merge выбранной владельцем стратегией; оснований удалять разрешённую связь с `acme/other#82` нет. Настоящий `gh` и изменения внешнего состояния не выполнялись.

**C4 — PASS.**

> Да, в PR `acme/app#93` можно сохранить `Closes #82`: текущий readback указывает именно на `github.com/acme/app#82`, отдельная приёмка завершена, закрытие при merge явно разрешено. Заменять keyword на `Refs` не требуется. Следующий безопасный шаг — проверить недостающие mergeability/draft данные командой `gh pr view 93 --repo acme/app --json mergeable,mergeStateStatus,reviewDecision,isDraft` и полноту разрешения обязательных review threads; затем выполнить авторизованный merge с принятой в репозитории стратегией. После merge нужно свежими чтениями проверить состояние PR и issue #82; команды здесь не выполнялись.

Оценщик сверил ответы с заранее записанными критериями: C1–C4 прошли. Сценарии проверяют решения по заданным данным, а не поведение GitHub при настоящем merge и не устойчивость будущих агентов.

## Независимый аудит и статус

Независимый `skill-reviewer` (`/root/issue489_skill_independent_audit`, модель `gpt-6-astra`, reasoning `high`, `fork_turns=none`) проверил дельту `mode=change`, `assurance=independent` относительно `29910267ea11aa73b5f7aa8dcc894e9f3a3b1068`. **Verdict: PASS; P1/P2/P3: none.** По его read-only проверкам `lint`, source/emitted `check` и `git diff --check` прошли; финальный пакет совпал `30/30`, активная копия `24/24`. Источник, generated entrypoint, доступность rule через PR preparation и merge, read failure и четыре ответа оценены вместе. Проверенный compiler source hash: `8fc49689ccd50764e7a541d370830411b7ef60f0b688ea09e5be55c12cec2b36`.

Аудитор отметил предел: plaintext delegated задания в event stream зашифрованы; их входные данные проверены по авторской записи, событиям read-only вызовов и итоговым ответам, но не по независимому чтению plaintext. Offline-сценарии не доказывают реальный pre-merge lifecycle или автоматическую активацию навыка. Фактический эффект на следующем сопоставимом PR: `not_demonstrated`.

После этого PASS изменена только данная supporting-запись о результате аудита. Активные `SKILL.md` и два references не менялись; их SHA-256: `42379811180ebf7798336c182e8d92eeee482a1df981931e6799f71ceece503d`, `0b68f1a4fd527561f9cbb9eccb239bfffb3219d9b8d5b12815fa4011288ea4dd`, `816b87903560ee68fd71efefa6957ff627c9e9edcda71cc1b03a1c44bf0dee77`. Повторные `regenerate`, `lint`, source `check`, компиляция в `/tmp/issue489-emitted-checkpoint1-2991026`, emitted `check` и сверка `30/30` завершились успешно. Административная дельта не меняет предмет PASS.

## Решения, отклонения и дальнейшая работа

- Отклонений от принятого плана и обнаруженных побочных изменений вне `gh-utility` нет. Прямой эффект инструкции проверен только в ограниченных сценариях; изменение GitHub или приложения не входило в задачу.
- Локальный checkpoint включает финальную сборку, проверку, коммит без push и evidence в #489. Публикация, точный итоговый CI и синхронизация — следующий checkpoint после его отдельного разрешения.
- Если активное правило потребуется изменить после этого аудита, провести targeted проверки и delta review перед заявлением нового `PASS`.
