# Blind forward-test evidence

## Basis

- Date: 2026-07-27.
- Candidate: `web-ui-reviewer` source-version `0.2.3` in the isolated #228 worktree.
- Evaluator: fresh agent with no forked conversation turns.
- Read boundary: generated `SKILL.md`, required `references/web-interface-guidelines.md`, and raw fixture only.
- The evaluator could not read `evals/evals.json`, docs, Git state, or other skills.
- Side effects: read-only.

## Exact evaluator prompt

```text
Use $web-ui-reviewer from /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/web-ui-reviewer to review the supplied module workspace evidence for implementation readiness. Keep the review read-only and bound conclusions to the supplied authority and evidence.

You may read only:
- skills/web-ui-reviewer/SKILL.md
- skills/web-ui-reviewer/references/web-interface-guidelines.md
- skills/web-ui-reviewer/evals/fixtures/module-workspace-input.md
Do not read skill.yaml, evals/evals.json, docs, Git diff/history, other skills, or any other repository file. Do not modify files or external state. Return the actual review output required by the skill, then a brief self-assessment.
```

The absolute path records the local execution and is not an active dependency.

## Complete observed output

```text
Макет `Case workspace` не готов к реализации: он исключает все три обязательные возможности принятого workflow.

**Статус: `findings`**

**Review basis**

- Claim: готовность модуля `Case workspace` к implementation handoff.
- Consumer: команда реализации.
- Stable target: предоставленный evidence bundle и описанный в нём mockup первого релиза.
- Authority: accepted product/UX workflow, accepted reusable library и peer views из evidence bundle.
- Rendered evidence: один desktop screenshot только для overview; interactive/browser, keyboard, loading, empty, error, network и backend evidence отсутствуют.
- Heuristic baseline: локальные Web Interface Guidelines, синхронизированные с upstream revision `4e799d45c17aec1498c269287a83b9dba22b966b`; live overlay не использовался.

**Findings**

## `evals/fixtures/module-workspace-input.md`

`evals/fixtures/module-workspace-input.md:34` — mockup не содержит обязательную searchable/filterable case queue, хотя accepted workflow требует её, peer modules подтверждают применимость, а reusable library предоставляет `WorkspaceSearchBar`.

`evals/fixtures/module-workspace-input.md:36` — отсутствует route или control для перехода из queue result в case detail; это исключает второй обязательный шаг workflow и расходится с обоими релевантными peer views.

`evals/fixtures/module-workspace-input.md:37` — отсутствует chronological activity and decision history в detail view; это третий обязательный шаг workflow, для которого уже доступен `ActivityTimeline`.

`evals/fixtures/module-workspace-input.md:38` — handoff ошибочно объявляет overview полным первым релизом, хотя он не реализует ни один из трёх обязательных этапов end-to-end workflow. Summary metrics, cards, responsive spacing и typography являются substrate, но не доказательством требуемой capability.

**Coverage limits and handoffs**

- Не оценены responsive rendering за пределами одного desktop state, keyboard/focus behavior, navigation behavior, loading/empty/error variants, accessibility tree, performance, network и backend integration.
- Frontend/design owner должен дополнить handoff queue, row-to-detail navigation и detail history, указав для релевантных library components disposition `reuse`, обоснованное divergence или authoritative `N/A`.
- После обновления нужны browser evidence для desktop/mobile и обязательных loading, empty, error и navigation states; keyboard/focus evidence — отдельно.
- Anti-claims: review не подтверждает WCAG, backend behavior, runtime authorization, performance или полную implementation readiness остальных UI-состояний. Export и bulk comparison корректно не требуются.

**Краткая самооценка**

Вывод основан только на разрешённых трёх файлах и остаётся read-only. Findings опираются на явную accepted authority, а пробелы runtime evidence вынесены в limits и не превращены в недоказанные дефекты.
```

## Coordinator-only rubric and verdict

| Expected decision | Observed | Result |
| --- | --- | --- |
| Detect all accepted workflow gaps despite polished overview. | Queue, detail navigation, and history are separate findings. | PASS |
| Findings require accepted authority, not peer aesthetics alone. | Product/UX workflow is the basis; peer/library evidence only supports applicability. | PASS |
| Preserve authoritative `N/A`. | Export and bulk comparison are explicitly not required. | PASS |
| Separate visual evidence from browser/runtime claims. | Screenshot, keyboard, navigation, network, backend, and WCAG limits are explicit. | PASS |
| Return the skill's formal status contract. | Plain-language outcome precedes `findings`. | PASS |

Aggregate blind verdict: `PASS`. This does not certify accessibility, runtime behavior, or universal review effectiveness.
