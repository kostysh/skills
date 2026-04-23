# Improvement Proposal: восстановить портируемый контракт session provenance для stage artifacts

Issue ID: `ISS-02`

Primary owner skill: `unified-dossier-engineer`

## Проблема

Текущее поведение stage-controller записывает `trace_locator_kind: session_id`, при этом все еще допускает `session_id: null`.

Более глубокая проблема не в том, что runtime не умеет auto-discover session id. Проблема в том, что skill больше не предоставляет ясный, portable, explicit contract для session provenance в момент записи stage artifacts.

Это создает сразу три сбоя:

- stage artifacts заявляют session-based locator, но реально не несут session id;
- контракт неявно привязывается к одному runtime-specific env assumption;
- у агента нет канонического способа передать известный session provenance в CLI.

## Почему это важно

Portable skills не должны зависеть от скрытых runtime discovery rules.

Если stage artifacts нужен session provenance, контракт должен быть явным и agent-controlled. Иначе:

- provenance может молча деградировать в `null`;
- skill начинает зависеть от env layout одного конкретного runtime;
- downstream retrospective tooling получает broken linkage и вынужден компенсировать это ручной реконструкцией.

## Текущая активная поверхность

Релевантные active references:

- [Commandized stage control](../../references/commandized-stage-control.md)
- [Runtime and command boundary](../../references/runtime-and-command-boundary.md)
- [Telemetry and closure](../../references/telemetry-and-closure.md)
- [Unified artifact topology](../../references/unified-artifact-topology.md)

## Требуемое исправление

Вернуть explicit, portable provenance input contract для stage artifacts.

Ожидаемая модель:

- агент сам определяет session provenance;
- агент явно передает его в CLI/runtime;
- runtime записывает только то, что было явно передано;
- runtime не должен молча писать `trace_locator_kind: session_id` при отсутствии session id.

Для границ этого issue canonical no-session branch должен быть fail-closed для обычных stage-controller writes:

- если stage-controller path требует session provenance, а агент не передал `--session-id`, shipped path должен блокироваться, а не эмитить contradictory session metadata.

## Что должно измениться

### 1. Явный stage-controller input

Добавить explicit input для session provenance в stage-controller, как минимум `--session-id`.

Если понадобятся дополнительные provenance fields, они тоже должны оставаться portable и передаваться явно, а не выводиться из session store одного конкретного runtime.

### 2. Fail-closed semantics для provenance

Artifact contract должен перестать производить противоречивую комбинацию:

- `trace_locator_kind: session_id`
- `session_id: null`

Для ограниченного scope этого issue требуемое поведение такое:

- bootstrap и update paths stage-controller, которые пишут stage log или stage-state, должны fail-closed, если `--session-id` обязателен, но не передан;
- они не должны подставлять silent null fallback;
- минимальная downstream compatibility work для lifecycle/session-index входит в scope только в той мере, в какой она нужна, чтобы authoritative readers правдиво обрабатывали исправленный контракт.

### 3. Граница portability

Active guidance должна явно сказать, что runtime-specific env variables могут быть только convenience inputs, но не canonical contract.

Контракт должен оставаться рабочим, даже если оператор использует skill под другим agent runtime.

### 4. Затронутая shipped surface

Explicit provenance contract должен применяться единообразно ко всем shipped stage-controller paths, которые bootstrapping или updating stage logs и stage-state.

Недостаточно исправить только одну команду или один write path.

## Внешний Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `mixed`

Ключевой результат review:

- направление было верным, но draft требовал один точный no-session branch вместо открытого either/or;
- scope shipped surface нужно было распространить на все stage-controller write paths, а не на подразумеваемое подмножество;
- implementation boundary нужно было ослабить ровно настолько, чтобы разрешить минимум lifecycle/session-index compatibility work, необходимой для truthful contract.

## Acceptance Criteria

Issue считается исправленным только когда:

- help stage-controller и active guidance определяют explicit input contract для session provenance;
- каждый shipped stage-controller path, который bootstrapping или updating stage logs/state, использует этот explicit provenance contract;
- stage artifacts больше не эмитят `trace_locator_kind: session_id` вместе с `session_id: null`;
- когда `--session-id` обязателен, но отсутствует, stage-controller write path fail-closed вместо тихой записи degraded session metadata;
- documented contract сохраняет session resolution на стороне агента, а не внутри runtime-specific session-store discovery;
- authoritative readers lifecycle/session-index правдиво обрабатывают исправленный provenance contract;
- docs и tests защищают portable explicit-input model;
- runtime-specific convenience inputs, если они сохраняются, явно документированы как optional и non-canonical.

## Обязательное ограничение для последующего planning и implementation

Любой будущий planning или implementation по этому issue должен оставаться строго в границах explicit stage-artifact provenance.

Обязательные границы:

- менять только CLI contract, artifact semantics и минимальный набор tests/docs, нужный для truthful и portable provenance;
- не добавлять Codex-specific trace-store lookup или любой другой runtime-specific auto-discovery как primary behavior;
- не расширять этот issue до broader artifact-schema cleanup, artifact-link arrays, skill linkage или retrospective-tool redesign;
- разрешать только минимум authoritative lifecycle/session-index compatibility work, который нужен для truthful handling исправленного контракта provenance;
- если потребуются дополнительные provenance fields, добавлять только действительно необходимые и фиксировать остальные идеи отдельными follow-up issues.

## Non-Goals

- Не реализовывать automatic lookup session ids из Codex-local session store.
- Не привязывать skill к private file layout или env contract одного runtime.
- Не смешивать с этим issue general stage-log schema expansion.
