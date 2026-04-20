# Предложение по улучшению 20260420-2: обязательный pre-close / DoD readiness gate до final-like review

## Контекст

Связанный план: [../refactoring-plan-13.ru.md](../refactoring-plan-13.ru.md)

Поводом стали несколько retrospective findings, где implementation технически почти завершалась, но process bundle догонял closure truth слишком поздно.

Повторяющийся паттерн:

- локальные проверки уже зелёные;
- агент считает scope “почти готовым”;
- первые final-like reviews начинают ловить не product-level дефекты, а process gaps:
  - backlog actualization ещё не готова;
  - AC coverage traceability неполная;
  - real-usage evidence ещё не оформлена;
  - closure artifacts ещё не готовы к truthful closeout;
  - freshness assumptions остаются неявными.

Это не просто logging issue. Это методическая проблема closure discipline в `dossier-engineer`.

Затронутые поверхности:

- `SKILL.md`
- `references/workflow-stage-implementation.md`
- `references/workflow.md`
- implementation checklists и step closure contract
- возможно, отдельный utility-side preflight command / artifact

Связанные предложения:

- `backlog-engineer`: [improvement-proposal-20260420-1.md](../../../backlog-engineer/docs/issues/improvement-proposal-20260420-1.md) — backlog actualization readiness является одной из обязательных проверок pre-close gate.
- `dossier-engineer`: [improvement-proposal-20260420-1.md](improvement-proposal-20260420-1.md) — logging redesign должен уметь фиксировать pre-close readiness и различать closure-readiness findings от product findings.
- `dossier-engineer`: [improvement-proposal-20260420-3.md](improvement-proposal-20260420-3.md) — heavy-runtime discipline влияет на то, какие verification и usage-evidence checks pre-close gate должен ожидать.

## Наблюдаемая проблема

Текущая методика уже требует:

- `dossier-verify`;
- independent review;
- `dossier-step-close`;
- backlog actualization before stage closure.

Но она всё ещё недостаточно явно отделяет:

- “локально выглядит готовым”;
- “готово к первому final-like review”;
- “truthfully process-complete”.

Из-за этого final-like review слишком часто становится местом, где впервые проверяется closure readiness.

## Почему это проблема

Final-like review должен в первую очередь ловить:

- spec/code/security проблемы;
- residual product risks;
- реальные boundary defects.

Если вместо этого review системно находит process incompleteness, значит closure discipline сдвинута слишком поздно.

Это создаёт:

- лишние rerounds;
- размытие разницы между product findings и process findings;
- operator confusion, потому что реализация вроде готова, но closure снова откладывается по организационным причинам.

## Предлагаемое изменение

## P1. Добавить обязательный `pre-close` / `DoD readiness` gate внутри implementation workflow

Нужен буквальный промежуточный gate между:

- “локальные проверки и код готовы”
- и “можно запускать первый final-like spec/code/security review cycle”

Этот gate должен быть обязательным для truthful closure target и не должен считаться опциональным polish step.

Он не обязательно должен быть новой top-level stage, но должен быть нормативно оформлен как отдельный closure boundary.

## P2. Определить минимальный состав pre-close readiness checks

Этот gate должен проверять как минимум:

- backlog actualization readiness:
  - ясно ли, нужен patch, refresh или оба шага;
  - нет ли известного backlog-side blocker для closure;
- AC / coverage readiness:
  - все closure-critical AC имеют явный proof path;
  - coverage traceability не зависит от post-factum backfill;
- usage evidence readiness:
  - если feature имеет meaningful operator-facing / agent-facing / machine-facing behavior, real-usage or equivalent audit evidence path уже спланирован и не остаётся “на потом”;
- closure artifact readiness:
  - scope готов к `dossier-verify`, review artifact, `dossier-step-close`;
- freshness readiness:
  - intended final tree определён достаточно чётко, чтобы не начинать closure вокруг ещё двигающейся цели.

## P3. Сделать pre-close gate обязательным входом в final-like review

Нужное правило:

- без прохождения pre-close readiness gate первый final-like review запускать нельзя.

Это важно не как бюрократия, а как методический фильтр:

- review не должен тратить дорогой attention на predictable closure incompleteness;
- process findings, которые можно было отловить preflight-ом, не должны засорять final review loop.

## P4. Явно разделить product findings и closure-readiness findings

Даже когда final-like review находит проблемы, методика должна различать:

- `product/risk finding`
- `closure-readiness finding`

Идеальная target model:

- closure-readiness findings максимально вымываются pre-close gate;
- final review predominantly ловит product/risk issues;
- retrospective может отдельно видеть, где сорвался pre-close discipline, а где действительно не хватило spec/implementation rigor.

## P5. Снизить ручную нагрузку через mechanical preflight support

Этот gate не должен превращаться в prose-heavy ritual.

Если возможна utility support, она должна быть mechanical only:

- проверить наличие required artifact links and fields;
- проверить наличие expected AC-to-proof mappings;
- проверить, что backlog actualization path определён;
- зафиксировать `pre_close_ready: true | false` и причины non-ready.

CLI не должен:

- анализировать prose dossier content семантически;
- сам решать, достаточно ли хороши доказательства по смыслу;
- подменять собой agent judgment.

Semantic verdict по readiness остаётся за агентом, но deterministic field/structure checks можно и нужно механизировать.

## Что не должно меняться

- Не превращать pre-close gate в замену внешним reviews.
- Не считать зелёные локальные тесты достаточным substitute для closure readiness.
- Не дублировать полный dossier content в отдельном pre-close artifact.
- Не переносить backlog-side mutation logic внутрь `dossier-engineer`.

## Acceptance criteria

- В implementation workflow есть explicit pre-close / DoD readiness gate.
- Первый final-like review нельзя запускать, пока pre-close readiness не подтверждена.
- Pre-close checklist явно включает backlog readiness, AC/proof readiness, usage evidence readiness, closure artifact readiness и freshness readiness.
- Guidance явно разделяет product findings и closure-readiness findings.
- Если вводится utility support, она остаётся mechanical и не анализирует prose semantically.
- Retrospective после внедрения может отличать “review found real product risk” от “review found late closure incompleteness”.

## Preferred implementation order

1. Добавить explicit pre-close readiness gate в `workflow-stage-implementation.md`.
2. Обновить implementation checklist и step closure contract в `SKILL.md`.
3. При необходимости спроектировать mechanical preflight artifact/command.
4. Провести narrow review того, не стал ли gate бюрократически тяжёлым по сравнению с выигрышем в reround reduction.
