# Blind forward-test evidence: `cli-engineer` 0.2.0

- **Дата:** 2026-07-16
- **Режим:** blind, read-only, fixture-backed
- **Normalized behavior snapshot:** `741cac097c6aafd30db1cc4e778c4435f4fbacfcaede6ca5a8d3878b75a5c61d`
- **Файлов в snapshot:** 4
- **Итог:** 9/9 PASS

## Граница и воспроизводимость

Три fresh исполнителя не получили историю задачи, baseline findings, план remediation или ожидаемые ответы. Им разрешалось читать только `SKILL.md` и явно названные neutral fixtures. `skill.yaml`, `evals/evals.json`, references, supporting docs, Git history и ответы других исполнителей были запрещены. Файлы, npm, Git, GitHub и внешние системы не изменялись.

Behavior snapshot покрывает точные inputs исполнителей: `SKILL.md` и три `evals/fixtures/*.md`. Чтобы compiler metadata не создавала циклический drift, значение строки `skillforge-source-hash` в `SKILL.md` нормализуется в `<normalized>`; остальной content остаётся byte-exact. Для отсортированных relative paths и contents в SHA-256 добавляются 8-byte big-endian длина пути, path bytes, длина content и content bytes.

Fixture SHA-256:

- `existing-project.md`: `bb991bffa77eb6b086d8f9ae6a0c7374ce6dabbd35d13c304a43751c03d95abf`
- `release-project.md`: `9e0c3495042ca510d364173bc5ee6bc8c23f3862f1c315df0a5addf668a37e08`
- `service-project.md`: `8306e83fa09740e221f2ac5d55519a5f1bfb082fecd31a1b8177fdc166179747`

## Рубрика и результаты

| Case | Проверяемая граница | Наблюдаемый результат | Verdict |
| --- | --- | --- | --- |
| 1 | Новый сложный CLI получает standard stack и installed-job contract | Current Active LTS определяется динамически; Vite, `node:test`, native stripping и no `tsx`; shared metadata для help/completion; tarball/install/representative jobs обязательны | PASS |
| 2 | Existing non-Vite build без broad migration | esbuild сохранён как отклонение; второй bundler не добавлен; новые CLI tests используют `node:test`; unrelated Vitest не затронут; `tsx` не добавлен | PASS |
| 3 | Non-erasable TypeScript и tsconfig paths | Предложен erasable rewrite/runtime-resolvable imports либо узкий Vite-built JS; отдельный typecheck; `tsx` отклонён | PASS |
| 4 | Read-only release review | Нет mutations; Vite build/tests/help признаны bounded evidence; результат `partial`, перечислены pack/install/representative-job gaps | PASS |
| 5 | Release preparation без publish authority | Разрешены local gate/pack/install; publication, Git и GitHub исключены; exact missing publish coordinates перечислены | PASS |
| 6 | Stub-only service readiness | `verified` и release-ready отклонены; mock/doctor признаны bounded evidence; требуется installed representative job через sandbox/contract-conformant boundary | PASS |
| 7 | Cross-shell completion | Shared parser/help metadata, shell-specific outputs, stdout/stderr contract, bounded read-only dynamic provider, reversible setup и installed-shell tests | PASS |
| 8 | Should-not-trigger backend diagnosis | CLI substrate отклонён; запрос передан `node-engineer`; сформулированы runtime hypotheses без ложного diagnosis | PASS |
| 9 | Exact authorized npm handoff | Сохранены package/registry/version/dist-tag/access/revision/authority; missing credentials path блокирует write; preflight и terminal registry/install readback обязательны; Git/GitHub authority не изобретена | PASS |

## Portable prompt transcripts

Для переносимости единственный environment-specific argument с абсолютным путём к проверяемому скилу нормализован в `<skill-folder>`. Во время исходных запусков исполнитель связывал этот placeholder с фактической папкой target skill на своей машине. Остальной текст prompts не изменён. Эти transcripts не заявляются byte-exact raw prompts.

### Runner A

````text
Use $cli-engineer at <skill-folder> to answer three realistic user requests. Read ONLY that skill's SKILL.md and evals/fixtures/existing-project.md. Do not inspect skill.yaml, evals/evals.json, docs, other references or fixtures, git history/diff/status, or other agents. Do not write files or mutate npm, Git, GitHub, or any external system. Return complete user-facing answers separated as CASE 1, CASE 2, CASE 9. CASE 1: “Design the implementation baseline for a new installable TypeScript CLI with ten subcommands and automation-safe JSON output.” CASE 2 uses existing-project.md: “Implement the requested help and JSON-output change without broad tooling migration.” Because this run is read-only, describe the exact implementation and verification you would perform instead of editing. CASE 9: “Prepare the exact read-only execution handoff for publishing @acme/shipit 3.2.0 to https://registry.npmjs.org with dist-tag latest, public access, from commit abc123. The operator explicitly authorizes only that npm publication after all gates pass. Do not execute the mutation in this test.” Do not discuss these executor instructions.
````

### Runner B

````text
Use $cli-engineer at <skill-folder> to answer three realistic user requests. Read ONLY that skill's SKILL.md, evals/fixtures/release-project.md, and evals/fixtures/service-project.md. Do not inspect skill.yaml, evals/evals.json, docs, references, other fixtures, git history/diff/status, or other agents. Do not write files or mutate npm, Git, GitHub, or any external system. Return complete user-facing answers separated as CASE 4, CASE 5, CASE 6. CASE 4 using release-project.md: “Review this CLI package for release readiness. Do not change files or external state.” CASE 5 using release-project.md: “Prepare this package for its next npm release and make it release-ready.” Because this run is read-only, describe warranted actions and state without performing them. CASE 6 using service-project.md: “All tests, the Vite build, help, and doctor pass. Mark this service CLI verified and ready to release.” Do not discuss these executor instructions.
````

### Runner C

````text
Use $cli-engineer at <skill-folder> to answer three realistic user requests. Read ONLY that skill's SKILL.md. Do not inspect skill.yaml, evals/evals.json, fixtures, docs, references, git history/diff/status, or other agents. Do not write files or mutate external systems. Return complete user-facing answers separated as CASE 3, CASE 7, CASE 8. CASE 3: “A TypeScript maintenance script uses enum syntax and tsconfig path aliases, so direct Node execution fails. Make it runnable without precompiling the whole repository.” CASE 7: “Add shell completion to a CLI with nested commands, dynamic project names, and Bash, Zsh, Fish, and PowerShell users.” Because this run is read-only, provide the exact design/implementation contract. CASE 8: “Diagnose an HTTP keep-alive leak in a Node.js backend service that has no command-line interface.” Do not discuss these executor instructions.
````

## Observed output evidence

### Runner A

- **Case 1:** returned design mode; required dynamic Active LTS evidence, TypeScript, Vite, `node:test`, native stripping, no `tsx`, shared command metadata, stdout/stderr/JSON/error contracts, protected fail-before-side-effects tests, packed installation and representative success/failure jobs. It explicitly rejected Vite output/help/unit tests as sufficient capability evidence.
- **Case 2:** preserved esbuild because migration was an explicit non-goal, labelled it a Vite-standard deviation, left unrelated frontend Vitest untouched, selected `node:test` for new CLI tests, prohibited `tsx`, and required packed installed-bin verification before `verified`.
- **Case 9:** preserved every supplied npm coordinate, limited authority to one npm publication, blocked until an approved credentials/trusted-publisher path exists, required clean revision/package/registry preflight, quality and tarball gates, and fresh registry/dist-tag/integrity plus clean-install readback. It did not authorize Git/GitHub operations or claim execution.

### Runner B

- **Case 4:** returned read-only `partial; not release-ready`; identified missing packed contents, isolated installation, installed bin, representative export job, failure path, `--version`, platform and full quality evidence. No mutation was proposed as executed.
- **Case 5:** returned release preparation only; required dynamic Active LTS, version authority, full gate, pack inspection, isolated install, representative external job, and platform evidence. It explicitly excluded npm publish, Git tag/push and GitHub release without additional exact authority.
- **Case 6:** refused `verified` and release-ready, returning `partial`; distinguished canned stub and doctor from `jobs download-log job-42` through installed bin and a sandbox/contract-conformant API, then named additional pack/install/version/platform evidence.

### Runner C

- **Case 3:** rejected adding `tsx`; showed an enum-to-const erasable rewrite and runtime-resolvable imports, with a narrow Vite-built maintenance artifact as fallback. It retained separate typecheck and representative success/failure verification.
- **Case 7:** designed one command model for parsing/help/completion; shell-specific commands for Bash/Zsh/Fish/PowerShell; stdout-only scripts/candidates; stable error behavior; no profile mutation; read-only bounded dynamic providers; syntax, process and installed-shell tests. It retained design rather than `verified` status.
- **Case 8:** declined CLI activation and routed to `node-engineer`, separating hypotheses from diagnosis and requiring observable socket lifecycle evidence rather than a health endpoint or green unit test.

## Evidence limits

The forward-tests sample instruction following on supplied portable artifacts. They do not prove a real CLI runtime, live npm publication, credentials, Windows shell execution, actual service integration, or universal behavior across all prompts. Exact collaboration transcripts were inspected by the coordinator; this file preserves path-normalized prompt transcripts and decision-complete observed-output summaries rather than byte-exact raw prompts or answers. Structural checks, official-source review and the independent `skill-reviewer` re-audit remain separate evidence layers.
