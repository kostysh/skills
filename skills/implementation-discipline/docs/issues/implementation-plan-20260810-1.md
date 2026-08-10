# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260810-1`

## Related Issue

`issue-20260810-1` — `docs/issues/issue-20260810-1.md`.

## Planning Status

- Статус: `execution authorized`, `P1 audit pending`.
- Исполнение T02 разрешено оператором; active skill mutation остаётся
  заблокирована до independent `PASS` exact current issue/plan snapshots.
- Риск: `high`.
- Issue и plan являются supporting planning artifacts; их публикация и audit не
  являются behavioral capability.
- Commit, push, создание PR и integration требуют отдельных approvals.
- Integration route: `PR-before-integration`.

## Source Artifacts

- `docs/issues/issue-20260810-1.md`.
- `AGENTS.md` и `skills/implementation-discipline/AGENTS.md`.
- Frozen planning candidate `T02.md`, SHA-256
  `83f9606ac105fbf0cd2648fb2f87aedad0ac0f4c5555ca4242bdd79e4bfa4d63`.
- Внешний provenance:
  `Aequitas-ADR/app@c4dea5920e29526bd10a1694c440537db2fc27b2:docs/delivery/plans/DP-0010-project-remediation-and-development-acceleration-plan.md`,
  SHA-256
  `e7160b9de52e30a60f90a4762e363fe0a48fb701eab45bf469525ecb816da3f2`.
- Внешний provenance:
  `Aequitas-ADR/app@c4dea5920e29526bd10a1694c440537db2fc27b2:docs/validation/retrospectives/RETRO-0004-issue-272-session-analysis.md`,
  SHA-256
  `0a14845e512cd4f4b8ed211038891207d3b379be717d5a61c7d48c4281dd78a6`.
- Planning base `origin/master@0fd0c424371091494c79dcc30996bcd8c7ec8d08`;
  execution обязан получить fresh remote read.
- Target source `skills/implementation-discipline/skill.yaml`, SHA-256
  `8da779643196790f383ea8c41af1d041d684f7c6ef5c819c826d015134b12f49`.
- Generated `skills/implementation-discipline/SKILL.md`, SHA-256
  `0246f124de2842ca5f9562290d6f177f5cd1df7a453245401266398b63800f61`.
- `references/core-principles.md` SHA-256
  `fa8a312bb8f580a1224f049f2480605d474b399f14627a55c292b28bbcec5cde`.
- `references/verification-loop.md` SHA-256
  `3d04bfd223e8ac42f97ed7c18bd3dbad1b7c54a24d29696aef77d3d0e49a801c`.

## Objective

Поставить portable behavioral contract, который предотвращает
hypothesis-first bug mutation, material unsourced expansion и cross-task scope
carry-over, сохраняя direct non-interactive work и proportional evidence.

Completion claim ограничен поведением skill: compiler, files или review logs не
являются самостоятельной capability.

## Capability, Substrate и Anti-claims

- Capability: exact pre-mutation failure witness; exact owning locator до
  material addition; bounded task-switch handoff; stop после direct proof.
- Substrate: source/generated files, owner-local docs, disposable fixtures,
  compiler/review evidence.
- Anti-claims: active guidance не содержит Aequitas semantics; universal
  registry отсутствует; browser не обязателен для non-interactive tasks;
  runtime/harness/telemetry не добавляются; speed improvement не заявляется.

## Skills

- `delivery-planner` + current accepted `implementation-discipline` — scope,
  plan и self-expansion gate.
- `skill-source-compiler` — source-first authoring, regeneration и author
  self-check; не independent verdict.
- Свежие blind evaluators — baseline/candidate behavior без diagnosis/fix rubric.
- `skill-reviewer` — independent stable-snapshot verdict.
- Текущий принятый `git-engineer` — branch/worktree/commit/push/integration по
  отдельным approvals.
- `gh-utility` — exact GitHub locators только после approval.

## Assumptions

- `skill.yaml` остаётся source of truth; generated `SKILL.md` вручную не
  редактируется.
- Текущий planning base подтверждён read-only, но будет перечитан при execution.
- Изменение documentation-only; runtime/package version не меняется.
- Mandatory gate помещается в root generated guidance без active-reference edit.
- Baseline blind case способен опровергнуть premise; если current skill уже проходит
  exact rubric, implementation останавливается как potentially stale.
- Оператор выбрал `PR-before-integration`; commit, push, создание PR и
  integration остаются отдельными checkpoints.

## Scope

Входит:

- `R-001`, `R-002`, `R-006` в одном coherent skill change;
- conditional exact witness и same-path final witness;
- exact owning locator для material boundary additions;
- compact `source/scope/state/next action` handoff;
- direct-fix stop;
- patch source-version bump;
- generated parity, blind forward-tests и independent review.

Не входит:

- другие skills, CI/branch policy и dependencies;
- изменения project PRD/SPEC;
- registry, tracker, runtime, CLI, harness, telemetry;
- обязательный browser для non-interactive tasks;
- active reference edits без отдельного scope-change approval.

## Owner-local Publication Paths

- `skills/implementation-discipline/docs/issues/issue-20260810-1.md`;
- `skills/implementation-discipline/docs/issues/implementation-plan-20260810-1.md`;
- `skills/implementation-discipline/docs/logs/implementation-log-20260810-1.md`;
- `skills/implementation-discipline/docs/logs/forward-test-evidence-20260810-1.md`;
- `skills/implementation-discipline/docs/README.md` update.

Эти issue/plan paths являются planning surface по root `AGENTS.md`. Их
owner-local publication и independent audit составляют P1 gate. Execution T02
уже разрешён, но до exact-snapshot `PASS` active skill mutation запрещена.

## Bounded Write Set

Source:

- `skills/implementation-discipline/skill.yaml`.

Generated:

- `skills/implementation-discipline/SKILL.md`;
- `skills/implementation-discipline/docs/compile-report.md`.

Supporting:

- owner-local paths выше.

Любая необходимость менять active reference, another skill, root workflow,
package manifest или dependency является hard stop и требует plan revision.

## Proposed Changes

1. В structured workflow/start contract добавить conditional exact witness,
   сохраняя browser только для interactive failure path.
2. Добавить exact authority locator gate для названных material boundary
   additions и stop при missing/conflicting authority.
3. Добавить compact task-switch handoff без registry/new-session mandate.
4. Убедиться, что direct-fix stop не дублирует current surgical/simplicity rules,
   а конкретизирует adjacent-scope failure path.
5. Поднять `skill.source-version` на patch.
6. Regenerate compiler-owned outputs и обновить supporting evidence/navigation.

## Implementation Steps

1. Активировать #325, fresh-read remote `master` и создать отдельные branch
   `fix/dp-0010-t02-implementation-discipline` и repository-local worktree
   `.worktrees/dp-0010-t02-implementation-discipline` от fresh
   `origin/master`.
2. Опубликовать owner-local issue/plan/README candidates и провести independent
   exact-snapshot audits до `PASS`; это P1 gate, не behavioral capability.
3. После P1 `PASS` зафиксировать baseline hashes и выполнить blind run current
   emitted package. Если
   baseline passes exact rubric, остановиться для source-premise review.
4. Изменить только approved source file и поднять patch source version.
5. Выполнить author self-check на precedence, duplication, portability,
   conditional browser и отсутствие registry/harness.
6. Выполнить `lint → regenerate → check` canonical compiler contour.
7. Проверить diff, source/generated parity, size, portability и isolated package.
8. Выполнить blind candidate tests на stable emitted content hash.
9. Заполнить implementation log и remediation matrix.
10. Получить independent `skill-reviewer change PASS`.
11. После отдельного approval создать scoped commit и проверить exact paths/SHA.
12. После отдельного approval push exact task ref и получить matching-SHA
    workflow `test`.
13. После отдельного GitHub approval создать PR и опубликовать locators в named
    issues.
14. После отдельного integration approval применить `PR-before-integration`.
    После rebase повторить
    affected checks; content delta invalidates blind/review evidence.
15. После integration fresh-read remote `master` и получить successful workflow
    `test` на exact accepted remote-master OID.
16. Выполнить safe fast-forward local `master`: сначала проверить exact local
    master worktree, absence in-progress Git operation, foreign ownership,
    staged/unstaged/untracked state и divergence. При dirty, foreign или
    diverged state остановиться без stash/reset/clean. Только из safe clean
    checkout выполнить fast-forward к `origin/master`.
17. Выполнить closure readback:
    `local master = origin/master = accepted OID`, clean status и отсутствие
    in-progress operation. Только после этого публиковать final evidence и
    переводить task в `Done`.

## Integration Route

- Task branch/worktree принадлежат только T02.
- Выбрано оператором: pushed task branch → reviewed PR → `master`.
- PR creation, push и integration пока не разрешены; для них сохраняются
  отдельные checkpoints.
- Commit approval не разрешает push; push approval не разрешает PR/integration;
  integration/master push требуют отдельного named approval.
- До integration: fresh target, rebase, affected local gates и branch-SHA CI.
- После integration: fresh remote master read и successful master-SHA workflow.
- Затем local master closure: dirty/foreign/divergence stop, safe
  fast-forward-only update и exact readback
  `local master = origin/master = accepted OID`.
- `Done` и final evidence запрещены до этого local readback.
- Parallel T03 implementation допустим в отдельном worktree; master integration
  последовательна, вторая branch rebases на current master.

## Verification Plan

Канонические команды:

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/implementation-discipline`;
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/implementation-discipline`;
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/implementation-discipline`;
- `git diff --check`;
- isolated package compile/readback;
- scan active portability и absolute paths;
- `pnpm test:ci`, когда environment позволяет;
- workflow `test` на exact pushed SHA.

Blind cases:

1. interactive symptom + plausible backend hypothesis;
2. ambiguous future workspace without exact locator;
3. trivial direct fix;
4. task switch after long neighboring context;
5. non-interactive deterministic failure.

Обязательное поведение: exact witness/locator/handoff, direct stop без browser
overreach. Запрещено: hypothesis-first mutation, unsourced boundary, scope
carry-over, new registry/harness.

## Independent Reviews

1. Внешний audit issue `PASS` до active mutation.
2. Внешний audit plan `PASS` до active mutation.
3. Author self-check compiler; максимальный claim `ready-to-regenerate`.
4. Независимый `skill-reviewer change PASS` на stable package, source/generated
   parity, original failure paths and blind evidence.
5. Любая material active delta после `PASS` делает verdict недействительным.

## Blockers and Stop Conditions

- missing commit/push/GitHub/integration approval для соответствующего
  checkpoint;
- moving remote base or foreign branch/worktree ownership;
- issue/plan audit not `PASS`;
- baseline already closes exact defect class;
- missing/conflicting source authority;
- required write outside approved set;
- compiler conflict/drift or mandatory check non-zero;
- blind failure or behavior overreach;
- independent review `FAIL/BLOCKED`;
- two same-root review/forward failures without RCA;
- active snapshot movement;
- dirty/foreign/diverged local master или in-progress Git operation на closure.

## Checkpoints

| Checkpoint | Evidence | Next authority |
| --- | --- | --- |
| `T02-P0` | #325 active; route `PR-before-integration`; fresh worktree from `origin/master` | P1 exact-snapshot audits |
| `T02-P1` | Owner-local issue/plan each independently audited `PASS` | Baseline falsifier run |
| `T02-P2` | Baseline demonstrates residual | Candidate authoring |
| `T02-P3` | Compiler/self-check/blind green | Independent skill review |
| `T02-P4` | Stable `skill-reviewer PASS` | Commit approval |
| `T02-P5` | Approved commit | Push approval |
| `T02-P6` | Branch-SHA workflow and locators | PR approval |
| `T02-P7` | Reviewed PR | Integration approval |
| `T02-P8` | Accepted remote master OID и successful matching-SHA workflow | Safe local-master closure |
| `T02-P9` | Dirty/foreign/divergence preflight green; safe fast-forward выполнен; `local master = origin/master = accepted OID`, clean/no-operation readback | `Done` и evidence return to DP-0010/CP1 |

## Risks and Side Effects

- Over-blocking без browser: mitigation — witness, подходящий failure path.
- Бюрократия для trivial edits: locator gate применяется только к material boundary
  additions.
- Размножение handoff artifacts: compact conversation handoff достаточен;
  no registry.
- Рост/дублирование root instructions: одна canonical rule и size self-check.
- CI workflow does not itself run target compiler check; preserve local compiler
  evidence and independent review.
- Data/runtime migration отсутствует; rollback относится только к instructions.

## Rollback Plan

- До integration сохранить branch/worktree для review; cleanup отдельно
  authorized.
- Stop при conflict/rebase сохраняет state и не чинит neighbor paths.
- После master integration использовать отдельно approved `git revert` exact task
  commit; no reset/force-push.
- После revert выполнить regenerate/check и exact-SHA workflow; prior evidence
  `stale/revoked`.

## Handoff

Финальный handoff содержит source/active hashes, task/master SHAs, compiler, blind,
review and workflow locators, remaining limits and anti-claim: skill remediation
не доказывает application runtime или speed improvement.

## Independent Audit

Audit status: `PASS`

Auditor: independent no-fork agent `t02_p1_artifact_audit`, 2026-08-10.

Scope: соответствие accepted T02/related issue, source coverage, bounded write
set, blind-baseline falsifier, approvals, integration/closure safety и
capability/substrate/anti-claims.

Exact snapshot SHA и durable verdict locator принадлежат owner-local
implementation log и `Aequitas-ADR/app#325`, чтобы не создавать самоссылочный
audit hash внутри проверяемого файла.

Final status: `PASS`; execution разрешено; commit, push, PR и integration
остаются отдельными checkpoints.
