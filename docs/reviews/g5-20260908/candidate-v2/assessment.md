# Candidate-v2 — оценка фактических ответов

Ассессор — основной агент, автор исправлений и критериев; это не independent verdict. Прочитаны полные raw answers четырёх исполнителей. Snapshot compiled `6ab6ffe4b3646630d01c775c629212fc6af57c7a4e6d5c64e18e305499f6ffbc`; source `14e896ffa04c5641919487e370f0331bf2c3c94a4a88822a0deb277afdfece37`. Manifest hashes после исполнения совпадают, исходники worktree совпадают с frozen source.

| Cases | Trial result по прежним критериям | Наблюдение |
| --- | --- | --- |
| P1/P2 | PASS | Достаточный draft выполнен; v3 без текущего approval не ready; endpoint не подменяет результат пользователя. |
| P3 | PASS — отдельный isolated run | Draft выполнен локальным методом, недоступный helper явно отмечен без вымышленного исполнения его gate. Общий product P3 — только simulation, в изолированное свидетельство не включён. |
| A1/A2/F | PASS | Вопрос подготовлен, решения и workflow различены, Q-18 не блокирует передачу Q-17, уточнение языка применено; F static replay. |
| C1/C2 | PASS | Есть прямое безопасное упрощение и ограниченный verdict; подтверждённый off-by-one не скрыт из-за отсутствующего файла. |
| C3/C4 | PASS | Accepted fix остаётся bounded, unrelated E2 требует scope decision; best-effort B1 не блокируется, durable B2 даёт blocker. |
| R1/R2/R3 | PASS | Короткий targeted вывод; отсутствующее подтверждение причин/эффективности не выдумывается, full matrix не навязана. |
| R4 | PASS | N1/N2 counts верны, D/M отклонены. В baseline N1/N2 не получили count PASS из-за source contradiction. |
| S | PASS — reuse unchanged boundary | Names/descriptions неизменны по catalog-parity; отдельный baseline catalog trial сохранён. Это не новый candidate run и не native activation. |

Модель candidate executors явно назначена `gpt-6-astra`, `fork_turns=none`, reasoning override отсутствовал; фактическая runtime metadata не предоставлена API. P3 isolated: agent `g5_candidate_prd_isolated`, отдельный inline input P1 и только PRD package, без casebook/criteria/diagnoses/соседних bodies. Другие agents: `g5_candidate_product_trials`, `g5_candidate_code_trials`, `g5_candidate_retro_trials`. Product и code по ошибке прочитали все raw inputs casebook, но не критерии/диагнозы/результаты; это отклонение изоляции назначенных входов, не доказательство answer-key exposure. Оба ограничения сохранены в raw answers. Несколько случаев одного пакета выполнены в общем свежем контексте, не по агенту на каждый случай. Доступ ограничен инструкцией на общем filesystem, не физической sandbox изоляцией. Полная внешняя telemetry действий отсутствует; сохранены фактические ответы, сообщения экспозиции и snapshot readback.

Сравнение с baseline: кроме R4 положительные результаты сохраняются; утверждение об улучшении каждого кейса или универсальной надёжности не делается. Эти sample PASS не закрывают остаточный source-contract RA-1, найденный независимым reviewer в targeted task handoff. Supplementary J1/J2/J3 проверяют прямые handoff контракты отдельно и не подменяют baseline comparison. Email/GitHub/runtime, действительная publication и native activation не проверялись.
