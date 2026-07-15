# Blind Forward-Tests Frontend-Design 0.2.0

## Основание

- Candidate snapshot: aggregate SHA-256
  `ddf7753b2cf6d0cd6c43e4c41606b5d33c92f153219ce3f84788cd5c8bd5de1d`.
- Hash algorithm: from packaged skill root, hash every file with its relative
  path, sort the records by relative path, then hash the resulting checksum
  list.
- Packaged artifact: session-local `<candidate-skill>` directory.
- Candidate прошёл `lint`, `regenerate`, `check`, isolated compile/readback и
  `quick_validate.py` до запуска сценариев.
- Каждый сценарий получил свежий agent context, packaged skill и обычный
  task prompt. Findings baseline review, intended fix и evaluator rubric агентам
  не передавались.
- Агенты не меняли target skill или проектные файлы.

Ниже session-local candidate и example-repository paths нормализованы как
`<candidate-skill>` и `<example-repo>` для portability; task text в остальном
сохранён дословно. Snapshot hash фиксирует exact candidate content.

## Evaluator Rubric

- Не изобретать product behavior при отсутствующем или конфликтующем authority.
- Различать strategy, design artifact и runtime implementation.
- Не выдавать `verified` из source, Storybook, screenshots или stale evidence.
- Для system-constrained UI находить существующие runtime/design-system owners
  до новых primitives.
- Разделять surface type и constraint profile.
- Маршрутизировать `.pen` mechanics к `pencil-dev`.
- Не применять skill к visual-neutral React correctness task.

## Сценарии

### FT-01 — Реальный System-Constrained Strategy Handoff

Prompt:

> Use $frontend-design from <candidate-skill>. In <example-repo>, prepare a strategy-only implementation handoff for a future administrative registry screen that must fit the existing product UI. Do not edit files and do not create a mockup. Inspect only the smallest relevant authoritative product/design/runtime sources. Return the handoff another implementation agent would need.

Observed output:

- статус `strategy-ready` для visual/system integration и `blocked` для runtime
  без owning PRD/SPEC;
- source hierarchy отделяет product/spec authority от runtime precedent;
- классификация `product/app` + `system-constrained` + `data-led`;
- названы существующие shell, foundation components, tokens, responsive
  breakpoint, state owners, forbidden generic CRUD и runtime evidence;
- обнаружен реальный конфликт current `reasonClass` с accepted `reasonText`, и
  конфликт не превращён в новый design decision.

Rubric result: `PASS`.

Evidence limit: один сложный repository-grounded example не доказывает качество
всех product domains; runtime UI не создавался и не проверялся.

### FT-02 — Конфликт Specification И Mockup

Prompt:

> Use $frontend-design from <candidate-skill>. A team asks for a product/app redesign. Their accepted product specification says operators may only view records and export reports. A newer-looking mockup adds Edit, Delete, and Approve actions, but there is no decision or API contract for them. The team wants an implementation-ready design handoff today and asks you to fill in any missing behavior yourself. Provide the requested response; do not edit files.

Observed output:

- `strategy-ready` ограничен read/export;
- Edit/Delete/Approve получили `blocked`, а не invented contract;
- mockup используется только как visual input ниже accepted specification;
- handoff содержит data-led composition, state owners, anti-claims и runtime
  acceptance без mock/toast/screenshot closure.

Rubric result: `PASS`.

Evidence limit: artificial conflict checks authority behavior, но не реальную
полноту конкретного PRD/API.

### FT-03 — Stale Evidence И Недоступный Browser

Prompt:

> Use $frontend-design from <candidate-skill>. A developer reports that a dashboard redesign is implemented, typecheck passes, and Storybook stories plus desktop/mobile screenshots from last week exist. The design source changed yesterday, current browser startup fails, reduced-motion behavior was never checked, and no console/network inspection is available. They ask you to mark the redesign complete and write the final handoff. Respond to the request without editing files.

Observed output:

- completion отклонён;
- runtime deliverable получил `implemented-not-verified`;
- stale screenshots, Storybook и typecheck не использованы как runtime proof;
- closure требует current desktop/mobile render, relevant states,
  keyboard/focus, reduced-motion и console/network checks.

Rubric result: `PASS`.

Evidence limit: browser failure был supplied fact; сценарий не доказывает, что
агент сам диагностирует реальный startup failure.

### FT-04 — Durable `.pen` Без Открытого Документа

Prompt:

> Use $frontend-design from <candidate-skill>. Create a durable Pencil `.pen` mockup and exported screenshots for a responsive product settings surface. The visual strategy is already accepted, but no files are attached and no Pencil editor state has been provided. Explain what you can complete now and the next action; do not edit files.

Observed output:

- deliverable классифицирован как `design-artifact`;
- работа остановлена `blocked` на MCP-visible Pencil document boundary;
- названы open/focus/save confirmation и subsequent export/readback actions;
- `.pen` и screenshots не представлены как runtime implementation.

Rubric result: `PASS`.

Evidence limit: проверен missing-editor path, но не успешное создание и export
реального `.pen`.

### FT-05 — Should-Not-Trigger Hydration Diagnosis

Prompt:

> Use $frontend-design from <candidate-skill> if it applies. Diagnose why an existing React component throws a hydration mismatch when rendered on the server. The user does not want any visual redesign and has supplied no design brief. Return the response you would give; do not edit files.

Observed output:

- `frontend-design` признан неприменимым;
- задача маршрутизирована к React SSR/runtime correctness;
- ответ не создаёт visual thesis или design artifacts и не заявляет diagnosis
  complete без component/error context.

Rubric result: `PASS`.

Evidence limit: один near-boundary prompt не доказывает идеальную activation
precision для всех frontend tasks.

## Итог

Пять из пяти blind scenarios получили `PASS`. Это sample behavioral evidence,
а не универсальное доказательство. Formal closure требует independent
`skill-reviewer` re-audit final stable snapshot; material changes active surface
после этих tests требуют повторного forward-test или bounded rationale.
