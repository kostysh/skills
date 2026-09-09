Контролируемая модификация нарушает возврат фокуса после закрытия диалога.

Status: `findings`.
Browser execution status: `completed`.

## Review basis

Независимая read-only bounded delta review `/tmp/design-tools-rev-20260909/joint-controlled-project`. Исходные authority и методика сохранены из `joint-ui-review/result.md`: original `raw-joint-consumer-task.txt`, producer handoff с его visual/save limits, `web-ui-reviewer` с обязательными локальными Web Interface Guidelines и agent-browser 0.27.3. Handoff прямо требует возврат фокуса на Review changes после Cancel/Escape; platform focus continuity также применима.

Это явно **контролируемая fixture mutation**, подготовленная координатором после clean initial result; не естественный дефект исходной реализации, не оценка blind success rate скилла. `provenance.json` не читался. До любых сведений из него собственные наблюдения записаны в `observations-before-provenance.md`.

31 файл зафиксирован в `identity-before.json`. Из них изменился только `src/App.tsx`: initial SHA-256 `0a5cacbb934b782d671a6395e17996147165d76994acd18f1686bcc9aff95080` → controlled `19e033b13f67a14452c5b3667bd088611de48a1f4dfcb89ae377ca74fd73cb19`. Единственная строка delta — `finalFocus` в line 125. Source unchanged после проверки (`identity-after.json`).

Runtime: declared `pnpm dev --host 127.0.0.1 --port 43868 --strictPort`; отдельная browser session `dtr-joint-controlled`; desktop1440×960; реальные keyboard events в Chromium, без network interception. Унаследованные проверки исходной формы/layout не повторялись, так как строка меняет только завершение dialog focus.

## Finding

`src/App.tsx:125` — **P2, focus restoration disabled**. `finalFocus={false}` отключает возврат фокуса после dialog unmount. Поддержанные пути:

1. Focus Review changes → Enter → initial focus Cancel → Escape → дождаться закрытия: dialog отсутствует, `document.activeElement.tagName === "BODY"`; следующий Tab попадает в email, вместо Review changes.
2. Повторное keyboard-open → Enter на Cancel → закрытие: focus BODY. Draft alex@example.test / On / Weekly сохранён, но keyboard position потеряна.
3. Повторное keyboard-open → Tab на Confirm changes → Enter: результат корректно применён и виден, status существует, но focus BODY. На исходном snapshot фокус переходил на heading Changes applied.

Наблюдения DOM выполнены после 350 ms ожидания; это не промежуточное состояние closing animation. Screenshots фиксируют видимые terminal states, а факт focus loss поддержан отдельными DOM readbacks в raw transcript. UI finding относится к этой строке controlled fixture, а не ко всем Base UI Dialog либо к Pencil.

## Handoff владельцу реализации

Восстановить управляемое назначение final focus: при Cancel/Escape — существующая кнопка Review changes, при Confirm — новый заголовок результата. Минимальный repair может вернуть прежний callback. Не менять черновик, semantics/validation, visual tokens или unrelated components. Reviewer ничего не исправлял.

На новом frozen snapshot проверить те же три исходных keyboard paths и смежный повторный edit/review/cancel после apply, подтверждая actual activeElement после dialog removal. Не ограничиваться чтением кода или screenshot. Это запрос на remediation owner; текущая проверка не является merge/overall code-review verdict.

## Coverage limits и evidence

Не повторялись unaffected initial email/switch/radio/layout checks; текущий delta проверен на desktop viewport, отдельная mobile delta/browser/device/assistive-technology certification не заявляется. Предыдущие Pencil visual/save gaps и существующий lint failure остаются отдельными ограничениями исходной работы. Backend, physical mobile, WCAG и performance не входят в вывод.

Raw commands, stdout/stderr/exit codes: `/tmp/design-tools-rev-20260909/joint-controlled-review-evidence/browser-transcript.jsonl`. Там же `source-delta.diff`, identity files, `observations-before-provenance.md`, screenshots, `server.log` и cleanup evidence. Assigned gpt-6-astra/high; actual serving identity independently unavailable.

Cleanup: session `dtr-joint-controlled` закрыта, session list не содержит dtr-joint-controlled; чужая dtr-joint-fix оставлена без изменений. Завершён только собственный Vite PID 344962; проверка отсутствия его launcher/child PIDs и listener 43868 сохранена отдельно в `cleanup-after.txt`. No source edits, subagents, remediation or publication.
