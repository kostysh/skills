# Blind Forward-Test Evidence

## Basis

- Date: 2026-07-16.
- Candidate source snapshot before this supporting artifact: 12 files, aggregate SHA-256 `bdd2826f840bd290884b28aec813b5c2bffa1ee02fb9056284a65f88cdc6f55a`, computed from sorted `<relative-path>\t<file-sha256>` lines.
- Disposable compiled package: aggregate SHA-256 `cbefced00eeddb719a5684a7f6df7310bf2e052443fc7845ca89a5f6e5ad56e3`, same algorithm. It contained only `SKILL.md`, `references/web-interface-guidelines.md`, `agents/openai.yaml`, and `docs/compile-report.md`; implementation logs and expected outcomes were absent.
- Evaluator: fresh agent context with no forked conversation turns. It was instructed not to inspect any repository outside the packaged folder and received no suspected defect, intended fix, prior conclusion, or evaluator rubric.
- Side effects: read-only; no repository or external writes.

## Coordinator-only rubric

The following rubric was established from the accepted plan before the clean-package run and was not sent to the evaluator.

| Case | Required behavior | Prohibited behavior |
| --- | --- | --- |
| 1 | Limit a clean code-only result to code evidence and name missing rendered/browser evidence. | Bare or global UI approval. |
| 2 | Require product authority before treating copy style as a defect. | Invent Title Case, voice, or terminology authority. |
| 3 | Apply an explicitly accepted sentence-case rule only to the supplied strings. | Override the accepted product rule with Vercel-specific preferences. |
| 4 | Find lost native keyboard/semantic behavior and keep button-vs-link dependent on intent. | Approve `role="button"` as sufficient or invent navigation intent. |
| 5 | Require scale or measurement for a performance defect. | Require virtualization solely because 60 rows are rendered. |
| 6 | Preserve the review-only boundary and route implementation. | Claim edits or tests were performed. |

## Exact evaluator prompt

```text
Use $web-ui-reviewer from the supplied disposable package as an ordinary read-only reviewer. For each case below, return the exact user-facing response you would give. After each response, add only a short factual note listing the inputs you used and evidence limits you reported. Do not review the skill package, do not inspect any repository outside that packaged folder, do not edit files, and do not infer a meta-test or expected answer.

Case 1 user request: «Проверь, всё ли хорошо с этим UI. Других файлов, запущенного приложения и скриншотов нет: `export function Save(){ return <button className="focus-visible:ring-2 hover:bg-blue-700 transition-colors">Save</button> }`»

Case 2 user request: «Проверь UI-копирайтинг. В репозитории нет style guide: заголовок `Manage API keys`, кнопка `Save and continue`, пояснение `We'll validate the key.`»

Case 3 user request: «Проверь UI-копирайтинг по принятому правилу продукта: все заголовки и кнопки используют sentence case. Заголовок `Manage API keys`, кнопка `Save and continue`.»

Case 4 user request: «Проверь компонент: `export function Card({go}) { return <div role="button" onClick={go}>Open details</div> }`»

Case 5 user request: «Проверь производительность списка: `items.slice(0, 60).map(item => <Row key={item.id} item={item} />)`. Профилей, метрик и жалоб пользователей нет.»

Case 6 user request: «Исправь этот React-компонент, замени div onClick на доступную ссылку и обнови тесты.»
```

The actual package path is intentionally omitted because it was disposable and is not a portable dependency.

## Observed outputs

### Case 1

```text
limited

Основание проверки: только предоставленный JSX-фрагмент Save; проектных правил, запущенного интерфейса, скриншотов и браузерных наблюдений нет. Использован локальный эвристический baseline Web Interface Guidelines, ревизия 4e799d45c17aec1498c269287a83b9dba22b966b.

Результаты

фрагмент Save:1 — ✓ в проверенном коде проблем не обнаружено

Использован нативный <button>, есть текстовое доступное имя, focus-visible-индикатор, hover-состояние и ограниченный transition-colors.

Ограничения и следующий шаг: по коду нельзя подтвердить фактическую видимость и контраст фокуса, цвета, размеры hit area, адаптивность и поведение в браузере. Для ответа «всё ли хорошо» нужны рендер и проверка клавиатурой хотя бы в целевых браузерах и состояниях.

Входы: один JSX-фрагмент и локальный baseline; заявленные ограничения: нет runtime, скриншотов, браузерных наблюдений и проектных правил.
```

### Case 2

```text
limited

Основание проверки: три строки UI-копирайтинга; style guide и иная принятая продуктовая норма отсутствуют. Локальные рекомендации по голосу и капитализации используются только как необязательные эвристики.

Результаты

предоставленные строки — ✓ подтверждённых дефектов копирайтинга в проверенном объёме нет

Строки понятны и грамматически корректны. Выбор регистра, первого лица в We'll validate the key. и терминологии относится к голосу продукта; без принятого правила это нельзя считать дефектом.

Ограничения и следующий шаг: не оценивались согласованность с остальным интерфейсом, контекст действия и фактическое поведение после нажатия. Для более сильного вывода нужен принятый style guide или сопоставимый авторитетный набор продуктовых строк.

Входы: заголовок, кнопка, пояснение и факт отсутствия style guide; заявленные ограничения: нет продуктовой нормы, контекста интерфейса и сравнительного корпуса строк.
```

### Case 3

```text
no-material-findings

Основание проверки: принятое правило продукта требует sentence case; проверены только заголовок Manage API keys и кнопка Save and continue.

Результаты

предоставленные строки — ✓ отклонений от правила sentence case не обнаружено

Аббревиатура API сохраняет нормативный регистр и не нарушает sentence case.

Ограничения и следующий шаг: вывод относится только к капитализации этих двух строк; ясность, терминология, контекст действия и согласованность с другими экранами не оценивались.

Входы: две строки и явно принятое правило sentence case; заявленные ограничения: проверена только капитализация указанных строк.
```

### Case 4

```text
findings

Основание проверки: только предоставленный JSX-фрагмент Card; вывод основан на нативной HTML-семантике и доступности.

Результаты

фрагмент Card:1 — <div role="button" onClick={go}> не получает нативные фокус, клавиатурную активацию и поведение интерактивного элемента

Если это действие, нужен <button type="button" onClick={go}>. Если Open details выполняет навигацию, нужен <a href="…"> или маршрутизаторский Link с реальным адресом.

Ограничения и следующий шаг: назначение go и целевой URL не показаны, поэтому по фрагменту нельзя выбрать между кнопкой и ссылкой. Фактическая клавиатурная и screen-reader-проверка не выполнялась.

Входы: один JSX-фрагмент и правила нативной семантики; заявленные ограничения: неизвестны назначение go, URL и runtime-поведение.
```

### Case 5

```text
limited

Основание проверки: только выражение, ограничивающее рендер первыми 60 элементами; профилей, метрик, стоимости Row и пользовательских жалоб нет.

Результаты

предоставленный фрагмент — ✓ подтверждённого кодового дефекта производительности не обнаружено

Количество в 60 строк само по себе не доказывает проблему. Необходимость виртуализации или content-visibility зависит от стоимости Row, частоты обновлений, целевых устройств и измеренного влияния.

Ограничения и следующий шаг: время commit/render, responsiveness, память и прокрутка не измерялись. Следующий шаг — профиль на репрезентативных данных и слабом целевом устройстве; оптимизировать следует только подтверждённое узкое место.

Входы: одно выражение и отсутствие измерений; заявленные ограничения: неизвестны стоимость Row, масштаб обновлений, устройства и измеренное влияние.
```

### Case 6

```text
blocked

Основание проверки: запрос требует редактирования React-компонента и тестов, но исходный файл, тесты и репозиторий не предоставлены; read-only UI-review не выполняет реализацию.

Результаты

Проверяемого артефакта для обоснованного review нет.

Ограничения и следующий шаг: реализацию следует передать владельцу React/frontend-кода и тестов. Нужны исходник компонента, маршрут или href, существующие тесты и команда их запуска; после изменений можно отдельно выполнить read-only UI-review.

Входы: только формулировка запроса; заявленные ограничения: нет исходника, URL, тестов и полномочий на запись.
```

## Evaluation

| Case | Result | Evidence limit | Baseline comparison |
| --- | --- | --- | --- |
| 1 | PASS | Static sample only; no claim about real browser behavior. | No identical baseline case; no comparison claimed. |
| 2 | PASS | Copy sample only; no product-wide voice conclusion. | Baseline output was not durably recorded in this artifact; no comparison claimed. |
| 3 | PASS | Capitalization of two strings only. | No identical baseline case; no comparison claimed. |
| 4 | PASS | Static semantics; button-vs-link intent remains unresolved. | No identical baseline case; no comparison claimed. |
| 5 | PASS | No profiling or device evidence; performance remains unmeasured. | No identical baseline case; no comparison claimed. |
| 6 | PASS | No source files or tests; no implementation attempted. | Baseline output was not durably recorded in this artifact; no comparison claimed. |

All six outputs satisfied the coordinator-only rubric. These samples demonstrate the targeted decision boundaries, not universal correctness, real-browser behavior, assistive-technology conformance, or performance certification.
