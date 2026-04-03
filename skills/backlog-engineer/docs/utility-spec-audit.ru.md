# Аудит спецификации утилиты `backlog-engineer`

## Scope

- Источник истины по продуктовой концепции: `skills/backlog-engineer/docs/process-cli.ru.md`
- Аудируемый документ: `skills/backlog-engineer/docs/utility-spec.ru.md`

## Verdict

**PASS**

Текущая версия `utility-spec.ru.md` уже выглядит implementation-safe относительно текущей концепции:
- прошлые blocking issue по rebuild/query semantics закрыты;
- replay rebuild теперь жёстко привязан к тем же mutation pipelines, что и live-команды;
- patch identity checks симметричны для `patch-item` и `remove-item`;
- `queue` снова согласован с продуктовой моделью;
- `target_item_keys` стал жёстким scope guard;
- referential-integrity pass после mutation формализован;
- `template patch` больше не противоречит своему error contract.

Новых blocking findings в спецификации не обнаружено.

## Findings

Blocking findings отсутствуют.

## Residual non-blocking notes

Дополнительных non-blocking замечаний по самой спецификации не осталось.

## Conceptual gaps

Ниже перечислены не проблемы спецификации, а вопросы, которые сама концепция всё ещё оставляет не до конца зафиксированными. Они не блокируют реализацию текущей спецификации, потому что в самой спецификации уже выбрана последовательная трактовка.

### 1. Hidden maintenance rebuild для query-команд остаётся решением спецификации, а не концепции

Спецификация последовательно разрешает hidden maintenance rebuild `state.json` перед query-командами.

В концепции это явно не описано:
- `status`, `items`, `search`, `queue`, `attention` подаются как read-side UX;
- не сказано, что query-команда может сначала молча восстановить runtime snapshot.

Это уже не contradiction внутри спецификации, а незакрытый продуктовый выбор.

### 2. В концепции всё ещё смешаны `id` и `source_id`

Концепция показывает source records с top-level `id`, но текстом инструктирует агента использовать `source_id`.

Спецификация выбрала working contract:
- source record = `id`
- embedded links = `source_id` / `source_ids`

Но сама концепция это правило пока не формулирует явно.

### 3. Mutability правил для context entities в концепции всё ещё нет

Спецификация закрепляет текущее правило:
- существующие `claims`, `contracts`, `data_domains`, `quality_attributes`, `policy_decisions` не мутируются in-place;
- конфликтующее переопределение = semantic conflict.

Концепция этого правила явно не утверждает. Это остаётся продуктовым gap.

### 4. Stage-aligned readiness остаётся решением спецификации

Концепция говорит только:
- `ready_for_next_step = true` означает, что задачу можно брать дальше;
- блокируют `gaps`, `todo` и зависимости.

Спецификация добавляет точную модель:
- stage ranks;
- правило `dependency.delivery_state >= current.delivery_state`.

Это полезная формализация, но она пока не закреплена как продуктовый контракт концепции.

### 5. `attention_reason_codes` остаются добавлением спецификации

Концепция описывает в основном человекочитаемые `attention_reasons`.
Спецификация ввела двухслойную модель:
- machine-readable `attention_reason_codes`
- human-readable `attention_reasons`

Это не блокирует реализацию, но продуктовый CLI contract теперь чуть богаче самой концепции.

## Concrete recommendations

### Для концепции

1. Явно решить, является ли hidden maintenance rebuild частью пользовательского контракта read-команд.
2. Явно закрепить source naming contract: `id` vs `source_id`.
3. Явно закрепить, mutable или immutable существующие context entities.
4. Явно решить, становится ли stage-aligned readiness частью продуктовой модели.
5. Явно решить, входят ли `attention_reason_codes` во внешний CLI contract.

## Итог

Спецификация в текущем виде согласована с концепцией достаточно, чтобы считать её готовой к реализации.

Дальнейшие вопросы остаются уже не на уровне implementation safety, а на уровне доуточнения самой продуктовой концепции.
