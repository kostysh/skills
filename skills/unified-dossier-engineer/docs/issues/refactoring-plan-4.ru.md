# План очистки active surface от stale split-skill wording

## Назначение

Этот план реализует [issue про stale split-skill / merge-era wording](improvement-proposal-20260422-2.md).

Цель:

- убрать из active surface все transitional формулировки, как будто split skills все еще существуют;
- сделать `unified-dossier-engineer` полностью self-contained и present-tense;
- привести source bundle, generated skill, active references и operator-facing wording к одному canonical identity model.

## Подтвержденная проблема

В active surface сейчас есть формулировки вроде:

- `This skill is the code-backed home of the merged dossier-engineer.`
- `The task only changes the split backlog-engineer or dossier-engineer skill without affecting the merged skill.`

Эти формулировки:

- описывают current skill через deleted identities;
- создают ложное впечатление, что split skills still matter operationally;
- противоречат уже принятому решению `no legacy support`.

## Фиксированные решения

- Active surface должен описывать только текущий canonical unified skill.
- Active wording должен быть self-contained и present-tense.
- Под stale surface понимаются не только deleted split-skill names, но и merge-era identity phrases:
  - `merged skill`
  - `merged runtime`
  - `merged architecture`
  - `canonical merged runtime`
  - `merged target`
  - и аналогичные формулировки, которые описывают current skill как transitional merged variant
- Historical context допустим только в non-normative docs, не в active instruction surface.
- Cleanup делается в source bundle first; generated `SKILL.md` меняется как следствие регенерации, а не через one-off edits.
- Runtime/help/operator-facing cleanup обязателен в том же change set, а не optional follow-up.
- При редактировании prose/contract surface этого skill-а разрешено вносить только изменения, прямо входящие в scope данного плана.
- Запрещено попутно улучшать, переписывать, дополнять или “подчищать” другие части skill-а, если эти правки не были явно запланированы в этом плане.

## Package 1. Провести inventory stale wording и зафиксировать canonical replacement language

### Цель

Сначала найти все user-facing места, где unified skill все еще говорит языком merge/split narrative, и определить canonical replacement wording.

### Что входит

- inventory по source bundle:
  - `skill.yaml`
  - fragments / source texts, если они используются
  - active `references/*`
- inventory по generated/operator-facing surface:
  - `SKILL.md`
  - help text / runtime wording
  - init-generated operator-facing files/guidance
- для каждого найденного места определить canonical replacement wording:
  - current unified skill
  - current unified runtime
  - current source bundle / active refs
  - no deleted split-skill references
  - no merge-era identity framing

### Acceptance

- есть полный список stale phrases в active and operator-facing surface
- для каждой stale phrase есть agreed replacement wording
- replacement wording описывает настоящее состояние, а не историю merge-а

## Package 2. Очистить source bundle identity language

### Цель

Убрать stale split-skill wording из источника генерации skill-а.

### Что входит

- обновить `skill.yaml`
- обновить source texts/fragments, если они кормят generated `SKILL.md`
- обновить все active references из `skill.yaml.surfaces.active.requiredReferences`, если они still use stale identity wording
- привести wording к модели:
  - canonical unified skill
  - canonical unified runtime
  - canonical unified source bundle

### Acceptance

- source bundle больше не говорит про split `backlog-engineer` / `dossier-engineer` как про live operational entities
- source bundle больше не описывает current skill как merged/transitional variant
- active source bundle можно читать без знания про удаленные split skills
- wording описывает только current canonical model

## Package 3. Перегенерировать emitted skill и выровнять active navigation

### Цель

Сделать generated `SKILL.md` чистым следствием source-bundle cleanup.

### Что входит

- регенерировать `SKILL.md`
- проверить root sections:
  - `When to use`
  - `When NOT to use`
  - `Overview`
  - `Start here`
  - interop / gotchas / policies
- убедиться, что generated surface:
  - не упоминает deleted split skills как live entities
  - не строит identity unified skill через “merged X”
  - не требует от агента знать историю merge-а

### Acceptance

- generated `SKILL.md` самодостаточен
- generated `SKILL.md` не содержит stale split-skill identity wording
- generated navigation и overview written in canonical present-tense terms

## Package 4. Выровнять help/runtime/operator-facing wording

### Цель

Убедиться, что stale wording не осталось в shipped operator-facing surface.

### Что входит

- обновить runtime/help surface в обязательном порядке, включая:
  - `src/unified-cli.ts`
  - `src/shared/process-root.ts`
  - любые другие operator-facing strings в source runtime
- rebuild `scripts/dossier-engineer.mjs`
- проверить `--help` output
- проверить operator-facing text в `init`-materialized files/guidance
- убрать stale identity wording из user-facing output и generated side effects

### Acceptance

- operator-facing help/runtime text consistently describes only the canonical unified skill/runtime
- user-facing wording не подталкивает агента искать deleted skills
- init-generated operator-facing artifacts не содержат stale identity wording
- help/tests parity сохраняется

## Package 5. Поставить regression guards

### Цель

Не дать stale split wording вернуться в active surface позже.

### Что входит

- добавить docs-contract checks на:
  - generated `SKILL.md`
  - `skill.yaml`
  - все active references из `skill.yaml.surfaces.active.requiredReferences`
- обновить help-surface assertions в CLI tests
- добавить assertions на `init`-materialized operator-facing text, если он содержит identity wording
- обновить `docs/README.md`
- записать implementation log после выполнения

### Acceptance

- tests/docs-contract падают, если:
  - generated `SKILL.md` снова говорит языком deleted split skills
  - source bundle снова вводит stale split identity wording в user-facing fields
  - source bundle или active refs снова вводят merge-era identity phrases
  - runtime/help/init-generated surface снова описывает unified skill через obsolete merge language

## Порядок реализации

1. Package 1
2. Package 2
3. Package 3
4. Package 4
5. Package 5

Причина:

- сначала нужно определить полный stale surface;
- потом чистится source bundle;
- затем регенерируется emitted skill;
- только потом выравнивается runtime/help wording;
- в конце ставятся regression guards.

## Основные риски

### 1. Заменить stale wording на другую transitional prose

Риск:

вместо чистого canonical wording можно написать maintainer-ish prose, которая снова будет звучать не как self-contained skill.

Сдерживание:

- replacement wording должен быть normal present-tense operational prose;
- никакого meta-языка про deleted identities внутри active surface.

### 2. Подчистить generated `SKILL.md`, но забыть source bundle

Риск:

stale wording исчезнет временно, но вернется при следующей регенерации.

Сдерживание:

- source bundle правится первым;
- generated `SKILL.md` меняется только через regeneration.

### 3. Забыть operator-facing help/runtime strings

Риск:

active docs станут чистыми, но help/runtime output продолжит говорить stale merge language.

Сдерживание:

- отдельный Package 4 на operator-facing wording;
- tests на help surface, если wording действительно меняется.

## Validation

План считается выполненным, когда одновременно верны все условия:

- source bundle больше не содержит stale split-skill identity wording в user-facing fields;
- generated `SKILL.md` self-contained и present-tense;
- active references описывают только current canonical unified skill;
- runtime/help/operator-facing wording, если затрагивается, согласован с canonical unified identity;
- banned stale surface включает и deleted split-skill wording, и merge-era identity wording;
- docs-contract/tests защищают результат от возврата stale merge-era prose.
