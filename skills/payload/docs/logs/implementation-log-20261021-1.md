# Удаление compatibility — payload

Прямое поручение оператора от 2026-10-21; отдельные issue/plan не создавались. Baseline: `01c662e836f5bdf2adecbd7e56e6dd043f01f3f8`.

Поле `skill.compatibility` удалено через `skill.yaml`; его точный текст перенесён в существующий `sections.portability.rules`. Остальные инструкции сохраняются. Skill content version: `0.1.1` → `0.1.2`; runtime/package version не меняется.

Перенесённый текст:

> Portable documentation-only skill based on the upstream payloadcms/skills Payload guidance. Use alongside framework, TypeScript, testing, and security skills for non-Payload concerns.

Авторская проверка: `ready-to-regenerate`. Scope, проверки, rationale отсутствия новых blind trials, стабильный snapshot, независимый verdict и интеграционный маршрут ведутся в [общем журнале](../../../../docs/reviews/implementation-log-20261021-remove-compatibility.md). Self-check и compiler result не заменяют independent PASS.

[Исходный текст, hashes и source inventory](../../../../docs/reviews/evidence/remove-compatibility-20261021/source-transformation.json). Изменение ограничено источником, необходимыми generated artifacts и supporting records; новых требований и runtime side effects нет.
