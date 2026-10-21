# Сокращение повторов — delivery-planner

Прямое поручение оператора от 2026-10-21: убрать предупреждение размера без повышения лимита и потери требований, перегенерировать, проверить и интегрировать. Baseline: `ce19ba418e1671167254c260e4617564335489ae`. Отдельные issue и plan не создавались.

Изменены только записанные prose chunks исходных fragments и patch content version. Все остальные поля skill.yaml, reading triggers, workflows, policies, stop rules, references/assets, runtime и лимит сохраняются. Generated SKILL.md и compile report получены компилятором.

Авторский self-check: `ready-to-regenerate`. [Точная карта замен и сохранённых требований](../../../../docs/reviews/evidence/skill-size-20261021/author-self-check.json). Проверка обратным применением записанных замен подтверждает сохранность остального тела SKILL.md; semantic equivalence изменённых абзацев оценивается отдельно.

[Общий evidence и результаты](../../../../docs/reviews/evidence/skill-size-20261021/README.md), [стабильный snapshot](../../../../docs/reviews/evidence/skill-size-20261021/snapshot.json), [raw structural checks](../../../../docs/reviews/evidence/skill-size-20261021/structural-commands.json). Обязательная suite — 110/110, exit 0; creator validation — 37/37. Исходные данные и rubric закреплены до edits; baseline/candidate получают одинаковый task в разных свежих контекстах. Принудительный вызов и instruction-only изоляция не доказывают natural activation или универсальную эквивалентность решений.

Размер SKILL.md: 23842 → 23493 bytes при прежнем лимите 23500. [Независимый bounded review](../../../../docs/reviews/evidence/skill-size-20261021/independent-review.md) — **PASS**, findings отсутствуют. Delivery trials — PASS/PASS; source ownership, три specialist routes, dependent readiness и scope сохранены. Общий score четырёх trials не заявлен как «4/4 PASS»: ограничение architecture rubric записано в общем evidence.

Самопроверка и compiler success не заменяют независимый skill-reviewer. Commit/push/PR, CI на точном head, merge и local sync разрешены поручением и выполняются после обязательных gates. Нового runtime и иных side effects нет; откат ограничен коммитом скила.
