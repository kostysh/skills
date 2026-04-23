# Improvement Proposal: явно зафиксировать правила исполнения внешнего независимого аудита

Issue ID: `ISS-01`

Primary owner skill: `unified-dossier-engineer`

## Проблема

Активный workflow `unified-dossier-engineer` требует внешний review перед truthful closure стадии, но недостаточно операционно определяет, что именно считается действительно независимым внешним аудитом.

Текущий контракт сохраняет:

- обязательный внешний review перед closure;
- persist review artifacts и проверки review policy;
- разделение между прогрессом stage-controller и truthful closure.

Но он недостаточно явно фиксирует:

- что reviewer delegation с forked context или full-history не является допустимой заменой внешнего независимого аудита;
- что runtime не должен создавать более сильное впечатление независимости, чем он реально может доказать по записанному provenance;
- какой именно execution pattern агент обязан использовать, когда workflow требует `external independent audit`.

Эта неоднозначность уже позволила стартовать review cycle методом, который позже пришлось признать некорректным и перезапустить.

## Почему это важно

Это не только проблема формулировки. Если метод независимости описан неоднозначно:

- workflow может создавать ложное ощущение audit independence;
- blocking reviews могут требовать поздних rerun;
- retrospective analysis не сможет понять, соответствовал ли фактический метод declared policy;
- будущие агенты могут повторять ту же ошибку, потому что контракт остается недоопределенным.

## Текущая активная поверхность

Релевантные active references:

- [Audit policy](../../references/audit-policy.md)
- [Delivery workflow layer](../../references/delivery-workflow-layer.md)
- [Commandized stage control](../../references/commandized-stage-control.md)
- [Telemetry and closure](../../references/telemetry-and-closure.md)

## Требуемое исправление

Добавить явное execution rule для `external independent audit`.

Активный контракт должен по сути фиксировать следующее:

- `external independent audit` требует reviewer execution mode, который не наследует полный рабочий контекст authoring agent;
- reviewer delegation с forked context или full-history не удовлетворяет этому требованию;
- provenance, записанный runtime, является доказательством только того, что runtime реально наблюдает, а не доказательством более глубокой независимости, которую он не может установить.

## Что должно измениться

### 1. Формулировка policy

Обновить active review-policy guidance так, чтобы требуемый метод независимости был операционно явным, а не выводился по косвенным признакам.

Policy должна различать:

- `external review` как обязательный workflow class;
- допустимый execution method для удовлетворения этого класса;
- недопустимые substitute-паттерны, которые выглядят внешними, но слишком сильно сохраняют авторский контекст.

### 2. Формулировка workflow

Обновить guidance по delivery workflow так, чтобы stage closure нельзя было прочитать как “любой внешне выглядящий reviewer run достаточен”.

Workflow должен явно описывать:

- когда требуется rerun из-за недопустимого метода review;
- что позднее обнаружение некорректного review method считается process miss, а не валидным PASS.

### 3. Agent launch guidance

Обновить active guidance в месте, где агент фактически инициирует внешний reviewer run.

Guidance должен прямо фиксировать:

- blocking external reviewer нельзя запускать с forked/full-history context authoring agent;
- reviewer launch должен использовать execution mode без наследования полного рабочего контекста authoring agent;
- если audit уже получен через forked/full-history launch, он не удовлетворяет policy и должен быть rerun корректным способом.

Эта часть обязательна: иначе implementation может ограничиться описанием provenance/runtime boundary и не устранить исходную ошибку запуска reviewer с форком истории сессии.

### 4. Формулировка runtime и artifact boundary

Сохранить честную границу runtime.

Runtime и artifact contract могут записывать только тот review provenance, который действительно наблюдаем, но не должны утверждать, что алгоритмически доказывают независимость, если это выходит за пределы доступных сигналов.

## Внешний Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `sufficient`

Ключевой результат review:

- существенного overreach не обнаружено;
- единственное requested tightening: привязать уточненное правило к существующим durable surfaces review mode и closure evidence, а не только к общей docs coverage.

## Acceptance Criteria

Issue считается исправленным только когда:

- активный review contract явно определяет, что удовлетворяет `external independent audit`;
- active guidance явно запрещает reviewer delegation с forked/full-history как замену этому требованию;
- active guidance содержит launch-time правило для агента: blocking external reviewer запускается без forked/full-history context, а audit, полученный через такой запуск, требует rerun;
- workflow guidance объясняет, что некорректный review method требует rerun, а не тихого принятия;
- runtime-facing wording не обещает automatic proof of reviewer independence beyond recorded provenance;
- уточненное правило отражено в durable contract surfaces review mode / closure evidence, которые управляют truthful closure;
- docs-contract coverage защищает эти operative rule surfaces.

## Обязательное ограничение для последующего planning и implementation

Любой будущий planning или implementation по этому issue должен оставаться строго в границах неоднозначности independence rule, описанной здесь.

Обязательные границы:

- вносить только минимальные documentation, contract, runtime-help и test changes, которые нужны, чтобы определить и защитить это правило;
- не redesign-ить broader audit lifecycle;
- не добавлять unrelated review telemetry, artifact-schema expansion или retrospective improvements в рамках этого issue;
- если implementation вскрывает отдельную проблему, завести новый follow-up issue вместо расширения текущего.

## Non-Goals

- Не добавлять runtime session-trace scraping или скрытые heuristics для “доказательства” reviewer independence.
- Не redesign-ить storage review artifacts больше, чем требуется для корректного документирования правила.
- Не смешивать с этим issue улучшения stage-log schema или retrospective parser.
