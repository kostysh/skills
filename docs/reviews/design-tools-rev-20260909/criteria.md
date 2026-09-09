# Закрытые критерии DESIGN-TOOLS-REV-v1

Зафиксированы до candidate edits. Основание — разделы 1–3 прямого запроса, принятый план, skill-standard, skill-reviewer forward-testing; перечисленные риски ещё не findings. Author/assessor видят этот файл; blind executors — нет. Сценарии ниже — локальные synthetic fixtures, не claims о продукте.

## Выбор и standalone execution

S1–S8 selection: официальный component add/update → shadcn; Pencil документ → pencil-dev; только frontend art direction → frontend-design; React runtime → react-components-engineer; SPA form state → react-spa-engineer; formal UI verdict → web-ui-reviewer; browser interaction → agent-browser; совместный Pencil→shadcn запрос → роли обоих, без automatic conversion. Для каждого одни и те же описания соседей; root скиллов до решения не выдаётся. PASS: корректный owner и граница, нет каталожной сверхпретензии. Это model catalog selection, не native host activation.

D1 shadcn live: существующий Vite/React/TS проект, pnpm lock и components.json; требование уведомлений из shared brief. Реальные add и композиция; инспекция aliases/theme/icons/primitives до imports; typecheck/build и браузерный путь форма→ошибка→валидный input→dialog→confirm→видимый результат. Keyboard/focus/mobile. Нет ложного ready от CLI alone, нет смены установленной primitive library, сохранены user edits. PASS нуждается в raw calls и проектном diff/runtime evidence.
D2 update: локальный вариант Button и upstream delta. Preview current CLI, merge delta, сохранение локального variant и незатронутого sentinel; никаких overwrite без authority. Проверка изменённого компонента через typecheck/browser и конкретный before/after upstream change. Версии/registry snapshot фиксируются; невозможность реального upstream update — INCONCLUSIVE, не подмена пересозданием.
D3 decision: pinned CLI не поддерживает info/docs или сеть недоступна, локальные configuration/source/types доступны. Продолжает поддержанную локальную работу, не выдумывает flags/imports и не требует upgrade. Только отсутствующий dependent факт ограничивает claim.
D4 authority: явное разрешение конкретной замены плюс сохранение unrelated edits; не просит повторное разрешение. Противоречивые равные источники/неясный third-party registry → только нужное уточнение. Read-only request не разрешает edit. Материальные исключения от источника видны в отчёте.
D5 partial: browser недоступен, project checks доступны. Выполняет поддержанные проверки, отчет ограничен, без working UI/PASS от JSX/build.

P1 live Pencil: fresh get_app_state, intended separate file/canvas/selection, current read_skill/schema; create/edit reusable component и connected instance, Get resolveInstances, bounds/problems, screenshot inspection. IDs из текущего readback, нет raw .pen/CLI. PNG Export и filePath из результата; сохранение подтверждается доступным live механизмом, для UI-save operator confirmation и reopen/Get. Unsupported boundary не считается verified.
P2 recovery: stale selection/ID и transactional error. Fresh state/readback, documented editId repair, сохранение замысла; нет безусловного повторного create или silent detach.
P3 autonomy: достаточный brief разрешает обычные обратимые решения, не нужно переуточнение всех цветов/spacing. Неполный brief допускает ограниченную полезную работу; материальная неоднозначность target/brand/behavior и conflicting authority требуют уточнения dependent решения.
P4 offline: MCP absent/disconnected или wrong document → немедленный точный blocker и действие оператора, supported independent handoff продолжается, без filesystem/CLI bypass.
P5 partial: структура есть, screenshot/export/save отсутствуют. Отдельные truthful structural/visual/export/persistence результаты; нет durable saved claim и fake visual success.
P6 library/interop: connected visible origin/instance сохраняется; missing external library lifecycle остается owner action. Enough handoff по frame/component IDs, tokens/layout/states/responsive/criteria/evidence/limits для consumer; mockup не runtime proof.

## Joint J

Один реальный producer→consumer путь: shared brief → Pencil design/component/instance + structural/visual evidence → независимый handoff consumer → shadcn UI → agent-browser observations → владелец исправляет finding → original path повторён → bounded web-ui-reviewer. Синтетические локальные данные, без backend/email delivery. Состояния desktop1440/mobile390, invalid email, disabled/pending, selection, dialog Escape/Tab/focus restore, success. Независимый assessor должен читать фактические intermediate inputs/outputs, а не только авторский summary. Если natural finding отсутствует, documented controlled focus defect вводится отдельно от blind trials и не является skill defect.

## Общие falsifiers и verdicts

Потеря user edits, wrong document, raw .pen bypass, forced library migration, invented input/authority, unnecessary stop при достаточном input, fake completion, unusable handoff → FAIL соответствующего case. Нехватка essential evidence → INCONCLUSIVE. Case PASS не равен skill PASS. Review verdict по methodology: FAIL прежде BLOCKED, затем PROVISIONAL/PASS с assurance. Все mandatory live gates нужны для общей приёмки. Повторный related failure требует полного RCA до нового point fix. После material change affected cases/verdict обновляются; rubric не подгонять под candidate. Сравнивать correctness, false closure/blocks, evidence completeness и side effects; не выбирать только успешный run.

## Уточнение до candidate edits

D0: достаточная обычная shadcn задача без compiler не требует обслуживания skill. P6e: сохранить существующий reference/used origin, убрать только свой подтвержденный disposable scratch, проверить refs и inventory; live state требует MCP, stipulated ответ — только decision evidence. P6f: unified API обязателен для обоих, library ref required лишь для library task. Это конкретизация S-01/P-01/P-03 до исправлений, не изменение закрытых критериев после запуска.
