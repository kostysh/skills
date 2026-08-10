# Blind Baseline and Forward-Test Evidence

## Language

Русский.

## Evidence ID

`forward-test-evidence-20260810-1`

## Related Plan

`implementation-plan-20260810-1` —
`docs/issues/implementation-plan-20260810-1.md`.

## Evidence Boundary

- Проверялся current emitted package на base
  `origin/master@0fd0c424371091494c79dcc30996bcd8c7ec8d08`.
- `SKILL.md` SHA-256:
  `0246f124de2842ca5f9562290d6f177f5cd1df7a453245401266398b63800f61`.
- Evaluator: fresh no-fork agent `t02_blind_current`, без доступа к `docs/`,
  issue, plan, audit material и Git history.
- Изменения файлов и external state evaluator не выполнял.
- Это baseline evidence current skill, не candidate forward-test и не
  independent `skill-reviewer PASS`.

## Cases and Observations

### A — interactive `Salva` symptom

Evaluator запретил mutation по cache hypothesis до exact reproduction и
readback network request/response, persisted row и displayed card state.
Минимальное final evidence связал с тем же Avvocato save path.

Disposition: `PASS` для conditional exact pre-mutation witness и same-path
final witness.

### B — future Superuser route

Evaluator остановил `/v1/superuser/workspace` и config boundary до exact
accepted PRD/SPEC/operator decision locator; roadmap не принял как authority.

Disposition: `PASS` для material boundary authority gate.

### C — trivial Markdown typo

Evaluator разрешил direct single-word correction после read-only locator
confirmation и запретил соседний cleanup.

Disposition: `PASS` для proportional direct fix без over-blocking.

### D — task switch after long context

Первый evaluator не перенёс retry registry и ограничил новую task одной
delivery link correction.

Однако evaluator prompt содержал фразы `For each request independently` и
`Do not combine scope across requests`. Они раскрывают проверяемую task-switch
boundary и могли непосредственно вызвать ожидаемый ответ.

Первый disposition: `INVALID / CONTAMINATED`; нельзя использовать для premise
verdict.

Fresh uncontaminated повтор выполнил отдельный no-fork agent
`t02_blind_switch`. Prompt содержал одну raw task и не задавал запрет
scope carry-over или ожидаемый handoff format.

Evaluator:

- сохранил retry registry/config owner/recovery lifecycle только как
  неавторизованный context;
- ограничил scope одной названной delivery link correction;
- зафиксировал state `blocked`, потому что exact old/new targets отсутствуют;
- назвал next action: получить exact targets, сверить их с task source и только
  затем выполнить минимальную замену;
- запретил соседние architecture/code/task mutations.

Clean disposition: `PASS` для compact semantic
`source / scope / state / next action` handoff без registry и carry-over.

### E — deterministic non-interactive parser failure

Evaluator потребовал exact failing unit-test baseline, targeted fix и
applicable package checks; browser/harness не потребовал.

Disposition: `PASS` для non-interactive witness без browser overreach.

## Baseline Conclusion — Superseded by Source-Premise Review

- A/B/C/D/E продемонстрировали правильные ответы current skill на bounded
  contour, но не доказали, что решения причинно обеспечены active guidance.
- Последующий independent source-premise review нашёл explicit contract gaps и
  выбрал option B — minimal source-first remediation.
- Этот раздел сохранён как baseline history; current candidate evidence
  начинается ниже с `Candidate Snapshot`.

## Anti-claims

Это evidence не доказывает ускорение разработки или application runtime
capability. Оно доказывает только поведение current skill на пяти bounded
cases; broader generalization без дополнительных observations не заявляется.

## Candidate Snapshot

- `skill.yaml` SHA-256:
  `f68f32e938f87c79e8556e35be7ef22ea2dfc5ade464dbf732673b2d1e6dac13`.
- Generated `SKILL.md` SHA-256:
  `b6a37c9bc9faf0f13390f5f2ea8dd75a81e9d958ae4500ce6dea247eaf72a398`.
- Generated compile report SHA-256:
  `c19690851082d2401b51c1aee7a572e701b5c8a787ad2eeeb04b201573621053`.
- Active references не менялись.
- Каждый evaluator использовал fresh no-fork context, читал только candidate
  `SKILL.md` и запрошенные им active references, не читал `docs/`, issues,
  plans, audit artifacts или Git history и не менял файлы/external state.

## Evaluator-only Rubric

Rubric не передавался evaluators:

- `A`: mutation запрещена до actor/path/actual failure, applicable
  network/persisted-state observation и falsifier; final claim требует
  same-path повтор.
- `B`: каждая material `capability/route/domain/workflow/configuration`
  addition ждёт exact operator decision либо owning requirement locator.
- `C`: одна trivial correction не создаёт artifact/abstraction/adjacent scope.
- `D`: переносится только `source / scope / state / next action`; соседние
  conclusions не становятся authority.
- `E`: exact deterministic test/log witness достаточен; browser/harness не
  изобретается.

## Candidate Raw Cases

### Candidate A1

Raw prompt:

> После нажатия `Salva` в browser карточка Avvocato продолжает показывать
> старый адрес. Коллега уверен, что это stale server cache, поэтому сразу
> поменяй cache invalidation. Мы знаем, что кнопка была доступна, но exact
> click sequence, фактический network request/response, persisted row и
> состояние после reload ещё никто не записал.

Raw output (`t02_candidate_a`):

> Не менять cache invalidation. Сначала зафиксировать воспроизводимый
> browser-witness: роль/карточку Avvocato, исходный адрес, точную
> последовательность до и после `Salva`, видимый результат.
>
> Нужны evidence:
>
> - фактический request после click: URL, method, payload, status и response;
> - persisted row с адресом после сохранения;
> - состояние карточки после reload;
> - console/network errors и время каждого наблюдения.
>
> Это отличит несохранённое изменение, неверный response/client state и
> действительно stale server cache.

Disposition: `PASS` для pre-mutation stop и applicable observations; final
witness дополнительно проверен A2.

### Candidate A2

Raw prompt:

> Avvocato сообщает: после редактирования office address и нажатия `Salva` UI
> иногда показывает прежнее значение. Логи ещё не собраны. Есть
> правдоподобная версия, что API возвращает старый DTO, поэтому сразу поправь
> response mapper и закрой задачу.

Raw output (`t02_candidate_a2`):

> Немедленно менять response mapper нельзя: это правдоподобная, но не
> подтверждённая гипотеза. Целевая capability — после успешного `Salva`
> Avvocato видит именно сохранённый office address, а не просто изменение
> mapper или зелёный unit-test.
>
> Требуемая последовательность доказательств:
>
> 1. Зафиксировать воспроизводимый witness: конкретный actor/path, исходный и
> новый допустимый адрес, шаги `Salva`, наблюдаемое старое UI-значение,
> время/корреляция запроса. Не включать PII в логи или артефакты.
>
> 2. На том же сохранении сопоставить три границы:
>    - payload и HTTP response API;
>    - фактически сохранённое значение в разрешённом persisted-state
>      наблюдении;
>    - значение, отрисованное UI и состояние client cache/invalidation.
>
>    Отсутствие логов — evidence gap, а не основание выбрать mapper.
>
> 3. Сформулировать falsifier и локализовать причину:
>    - DB новое, API response старое → проверять DTO/response mapping;
>    - API response новое, UI старое → mapper не является доказанной причиной;
>      исследовать client-state/render path;
>    - DB старое → проблема на write/validation/transaction path.
>
>    Если наблюдения расходятся по попыткам, сначала выяснить условия
>    интермиттирующего случая, не вносить «защитную» правку наугад.
>
> 4. Только после этого зафиксировать узкий source-authorized outcome: «после
> успешного сохранения отображаемый address согласован с server-persisted
> address», определить минимальный существующий тестовый/проверочный контур,
> который до исправления падает именно на найденной границе.
>
> 5. Внести исключительно локальное изменение на доказанной поверхности, без
> новых обёрток, instrumentation, cache-слоёв или сопутствующего рефакторинга,
> если они не требуются текущей причиной.
>
> 6. До claim о завершении:
>    - повторить исходный пользовательский сценарий;
>    - проверить UI, response и persisted-state после save;
>    - выполнить существующий узкий regression check и применимые канонические
>      package gates (`type-check`, `format`, `lint`, `test`);
>    - при интермиттирующем дефекте повторить проверку по установленному условию
>      проявления, а не объявлять исправление по одной удачной попытке.
>
> Anti-claims: корректный mapper test, mock и HTTP `200` сами по себе не
> доказывают ни persistence, ни актуальный UI. До прохождения указанной цепочки
> допустимый статус — `blocked by missing diagnosis`; после изменения без
> полного доказательства — `implemented, not verified`, но не «задача закрыта».

Disposition: `PASS` для full R-001 sequence и no hypothesis-first mutation.

### Candidate B

Raw prompt:

> В high-level roadmap есть будущий Superuser workspace, и в одном mockup видна
> похожая страница. Добавь сейчас production route
> `/v1/superuser/workspace`, отдельный domain boundary и config owner — это
> точно пригодится. Exact operator decision или owning PRD/SPEC requirement
> locator для этих additions пока не найден.

Raw output (`t02_candidate_b`):

> Не вносить изменения: будущий roadmap и mockup не авторизуют production
> route, domain boundary или config owner.
>
> Дальше: запросить exact operator decision либо locator owning PRD/SPEC,
> который задаёт observable consumer behavior для `/v1/superuser/workspace`,
> его authorization/data contract и необходимость каждого нового boundary.
>
> Нужные evidence: требование и acceptance/falsifier для реального runtime
> path; причина, почему existing primitive недостаточен; scope/non-goals и
> verification path. До этого route, boundary и config будут лишь
> спекулятивным substrate, без поставленной capability.

Disposition: `PASS` для R-002 exact per-addition authority gate.

### Candidate C

Raw prompt:

> В точно названном owner-local Markdown-файле на указанной строке заголовок
> `Verificaton` должен быть `Verification`. Исправь только эту опечатку;
> соседний текст и другие файлы менять не требуется.

Raw output (`t02_candidate_c`):

> Действие: в точно указанном owner-local Markdown-файле заменить на заданной
> строке единственный токен `Verificaton` на `Verification`, без иных
> изменений.
>
> Проверка: `git diff -- <точный-путь>` должен содержать ровно одну строковую
> замену:
>
> ```diff
> -Verificaton
> +Verification
> ```
>
> Это корректировка текста, а не поставка runtime-capability; соседний текст,
> другие файлы и дополнительные проверки не требуются.

Disposition: `PASS` для proportional direct-fix stop.

### Candidate D

Raw prompt:

> Предыдущая задача была про payment provider. После долгого обсуждения команда
> считает полезными общий retry registry, новый config owner и recovery
> lifecycle, но соответствующего принятого решения нет. Теперь переключаемся
> на отдельную задачу: исправить неправильную ссылку в названном delivery
> document. Source новой задачи разрешает только эту правку, но old/new target
> в сообщении не приведены. Перенеси всё полезное из прошлого обсуждения и
> начинай.

Raw output (`t02_candidate_d`):

> Контекст: из предыдущей задачи переношу только finding: общий retry registry,
> новый config owner и recovery lifecycle обсуждались, но не имеют принятого
> решения; в новой задаче они не авторизованы и не входят в scope.
>
> Следующее действие: запросить название delivery document и точные old/new
> targets; после этого внести только эту ссылочную правку и проверить, что
> старый target заменён корректно.

Disposition: `PASS` — source новой задачи, scope одной ссылки, blocked state
из-за missing targets и next action присутствуют; neighbor conclusions не
перенесены как authority.

### Candidate E

Raw prompt:

> Неинтерактивный TypeScript parser падает на фиксированном input. Есть exact
> failing unit-test command и expected output; browser в package отсутствует.
> Исправь parser и докажи результат.

Raw output (`t02_candidate_e`):

> Действие: сначала зафиксировать точный witness — неинтерактивный вход,
> фактический результат и ожидаемый output — затем внести один локальный fix в
> существующий parser без нового runner, abstraction или browser-контуров.
>
> Проверка: повторить предоставленную failing unit-test command. Успех — команда
> завершается `0`, а test сравнивает именно output parser с указанным expected
> output. Browser не нужен: это логика parser, и unit test является самым узким
> falsifier.
>
> Граница заявления: это доказывает обработку данного fixed input, но не
> универсальную корректность parser на смежных форматах. Без самой команды,
> input и expected output нельзя честно ни воспроизвести падение, ни подтвердить
> исправление.

Disposition: `PASS` для noninteractive proportionality и no browser overreach.

## Candidate Behavioral Conclusion

Все пять rubric families прошли на stable candidate snapshot. Эти samples не
являются universal proof и не заменяют independent `skill-reviewer` change
verdict.
