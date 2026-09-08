# G2 Security D — bounded оценка повторной доставки

**PASS / PASS для baseline/candidate: исходный D checklist-delivery gap закрыт повторными наблюдениями.** Полные root, methodology, secrets-config и supabase-rls реально присутствуют в сохранённых stdout без truncation; четыре исходных решения D соответствуют неизменной закрытой рубрике. Это ограниченная оценка evidence gap, не формальный PASS skill/package и не повторный аудит остальных кейсов.

Оценщик независим от candidate и исполнителей; прежний `security-assessment.md` оставлен без изменений (SHA-256 `e90ec426a6a7997560a822567f7048010adef3a91e4ba9607a6b21ae915fb54d`). Основание: минимальный следующий шаг в `security-audit-v1-blocked.md`, исходный `private-criteria/supplement-v1/rubric.md` раздел Security D и frozen manifests. Пути ниже относительно `/tmp/skills-revision-g2-20260907-qfdkj6eo`.

## Непосредственная проверка доставки

Прочитаны реальные `runs/security-d-{baseline,candidate}-delivery/trace.json` и `output/review.md`. Для каждого запрошенного instruction file каждый последовательный срез `[0:8000]`, `[8000:16000]` и далее до EOF побуквенно найден в stdout соответствующего отдельного command event. Проверка требует `truncated:false`, а не только успешного shell exit или заявленного чтения. Конкатенация этих покрывающих срезов представляет весь файл; сегодняшний source использован для сравнения с реальной выдачей, не для восстановления пропущенных events.

| Файл | Baseline chars/chunks | Candidate chars/chunks | Результат пары |
|---|---:|---:|---|
| SKILL.md | 28002 / 4 | 28062 / 4 | PASS / PASS |
| references/methodology.md | 14189 / 2 | 15065 / 2 | PASS / PASS |
| references/secrets-config.md | 4862 / 1 | 5247 / 1 | PASS / PASS |
| references/supabase-rls.md | 5348 / 1 | 5507 / 1 | PASS / PASS |

Baseline thread: `01a07d1d-daff-78c1-a56e-1273eec9a93a`; candidate thread: `01a07d1f-8a97-7ca0-a29c-4c2553d22006`. Обе страницы имеют `hasMore:false`; в каждой 14 command events, все exitCode=0, все stdout `truncated:false`. Служебные CHUNK/TOTAL_CHARS делают некоторые outputs длиннее 8000, но сам instruction slice не превышает 8000 и выдача не усечена.

Ключевые реальные события:

- Baseline `exec-02c0366e-92b3-4d1e-b0e6-1fc1ec6f4b2a` содержит целый supabase-rls, включая исходный bullet `tests do not cover capture failure for required fail-closed or fallback behavior` внутри Flag when.
- Candidate `exec-831e4eda-25a4-4f7f-9ae3-899823c6e990` содержит целый supabase-rls, включая исправленный абзац, отделяющий missing capture-failure tests как evidence gap от reachable security defect.
- Реальная behavioral execution: baseline `exec-0551c8f5-75c9-472c-b628-b44c0d51c20c`; candidate `exec-77c7bb70-0fbf-483d-8071-cf55433e50bd`. Выдача целая и согласована с отчётами.

## Исходные четыре подкритерия D

| Закрытый критерий | Baseline | Candidate | Проверенное наблюдение |
|---|---|---|---|
| Strict: missing negative test сам по себе не уязвимость | PASS | PASS | Реальный вызов strict(True) дал OSError, пустые log/effects. В отчётах пробел регрессии отделён от vulnerability, несмотря на полностью доставленный исходный checklist baseline. |
| Lenient: обязательный capture bypass подтверждён | PASS | PASS | Реальный lenient(True) дал effects=['effect'], log=[], без exception. Оба описали actor disconnect → swallowed error → protected effect и отсутствие mitigation в полном контракте. |
| Session A: protected profile не создаёт отсутствующий attacker path | PASS | PASS | Полная JSON-модель не содержит exposure; оба отвергли finding при заданных ограничениях attacker, не выдумывая local-device/XSS/extension actor. |
| Session B: public bearer disclosure подтверждён независимо от flags | PASS | PASS | JSON check показал false/0 exposures для A и true/1 для B. Оба указали unauthenticated `/public/debug`, credential equality, stipulated bearer consequence; flags не объявлены защитой от отдельного response disclosure. |

Оба отчёта присвоили lenient severity medium при HIGH confidence и объяснили предел бизнес-эффекта. Это не downgrade подтверждения: закрытая рубрика требует confirmed control bypass, не фиксирует high severity. Обе версии дали два подтверждённых finding; локальные success cases также наблюдались. Нет заявлений, что Python/JSON доказывают production durability, настоящий браузер, Supabase, HTTP/replay или compliance. Нет наблюдаемой remediation, network или delegation; output — единственная наблюдаемая запись.

## Стабильность, сравнение и границы

Повторно сверены SHA-256: original initial manifest 16/16, supplement manifest 20/20, delivery-repeat manifest 8/8 совпадают. Все четыре input файла каждой повторной D-задачи побайтово равны исходным `cases/supplement-v1/security-d/`. Рубрика, task и ожидаемые решения не переписаны. `security-d-delivery-repeat.json` документирует только изменение способа чтения для устранения усечения. Предыдущие пробные outputs не заменены; старый INCONCLUSIVE о старой выдаче остаётся исторически верным.

Сравниваемые active файлы — те же baseline-emitted/candidate-emitted поверхности исходной оценки. Проверенные SHA-256 соответственно:

| Файл | Baseline SHA-256 | Candidate SHA-256 |
|---|---|---|
| SKILL.md | 39cab9adc90624ed2b5c500226d5b3b31640d7c18121ca4fa4ab59be4b1bc410 | 0e0ee8025a1eae969512fcef4a4210d5712bca141620733cc624685744355fa1 |
| methodology.md | f86304874d34d73d5c89493a771fa2d837830830982485f5e08514df1acfbe92 | 742f47b7a979ca2771899446601afcf7f03e349b31feb6bf23512789fac1906e |
| secrets-config.md | 083f3349e090cb36bd44c2c5c97f16c3c2ebe3e04bc261125a0b09d31147faf2 | 8f46d5d2b652a74e17d670686b4d6c6adfc6f6bd59263b47606f204da95d6a36 |
| supabase-rls.md | b08205246cb5b58e0e05e09d4539b999343f4ba954e28c5577947585ccb97d55 | 6dadce04c0a4d1e9323a64161218c5c0d8a6e601ac1eb0267b1dac657a573b0a |

Новые context IDs и содержимое traces подтверждают отдельные наблюдаемые исполнения; inherited/no-overrides settings — условия координатора, effective provider metadata независимо не установлены. Видимые чтения не включают rubric, историю, соседние runs или диагноз. Полная доставка по событиям не означает измерение внутреннего внимания модели и не является native-autoload тестом. Shared filesystem не hard sandbox; evidence о действиях ограничено видимыми событиями и сохранностью inputs.

Bounded итог: обе повторные D-пробы **PASS**, включая ранее недоказанную доставку полного checklist. Они не показывают превосходства candidate: baseline тоже принял верные четыре решения после полной выдачи конфликтного checklist. Следующий шаг у формального reviewer — bounded delta re-audit закрытого gap и стабильности пакета; этот отчёт сам формальную приёмку не присваивает.
