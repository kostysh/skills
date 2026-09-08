## implementation-discipline 0.2.7
Source: skills/implementation-discipline/SKILL.md


- **product intent, users, scope, non-goals, success metrics, and product acceptance:** prd-engineer. prd-engineer owns product semantics; implementation-discipline supplies source-authority, simplicity, self-expansion, and evidence constraints.
- **architecture boundaries, ASRs, pattern decisions, trade-offs, and ADRs:** architecture-engineer. architecture-engineer owns architecture semantics; implementation-discipline supplies source-authority, simplicity, self-expansion, and evidence constraints.
- **implementation behavior, edge cases, falsifiers, and verification maps:** spec-engineer. spec-engineer owns specification semantics; implementation-discipline supplies source-authority, simplicity, self-expansion, and evidence constraints.
- **slices, tasks, dependencies, sequencing, and delivery handoff:** delivery-planner. delivery-planner owns delivery semantics; implementation-discipline supplies source-authority, simplicity, self-expansion, and evidence constraints.
- **language, framework, and platform specifics:** The relevant domain skill. This skill governs behavioral discipline and complexity, not APIs or platform rules.
- **formal review workflow, severity, and evidence format:** code-reviewer. This skill contributes the simplicity and evidence lenses, while code-reviewer owns the read-only review process and findings output; remediation starts only with explicit change authority.

## security-reviewer 0.1.13
Source: skills/security-reviewer/SKILL.md


- **security threat model, exploitability, confidence thresholds, and vulnerability reporting:** security-reviewer. This skill owns security findings and reporting discipline.
- **framework/runtime facts and remediation detail:** the relevant domain skill. Domain skills own framework behavior and remediation implementation, while this skill decides whether the issue is exploitable and reportable and later re-audits the result.
- **non-security review flow and general merge-risk findings:** code-reviewer. Move non-security findings and every overall merge recommendation to code-reviewer when both skills are active.
- **mapping implementation to an explicit security standard or versioned control set:** spec-conformance-reviewer. spec-conformance-reviewer owns requirement coverage and compliance status; security-reviewer owns exploitability and vulnerability classification.
- **Git-backed diff scans, repository scans, deep multi-pass scans, and durable scan artifacts when a dedicated orchestrator is available:** security-diff-scan, security-scan, or deep-security-scan. The scan skill owns traversal and canonical scan artifacts; security-reviewer must not run a parallel scan or issue a competing scan verdict.

## git-engineer 0.2.1
Source: skills/git-engineer/SKILL.md


- **GitHub repositories, issues, pull requests, checks, labels, Actions, platform merges, and other GitHub resource state:** gh-utility. git-engineer owns local history semantics and branch/ref facts; gh-utility owns GitHub execution, targeting, and fresh platform-state verification.
- **Code-review findings, severity, approval, and merge-readiness judgment:** code-reviewer. git-engineer may execute an authorized Git action but does not issue a review verdict.
- **Diagnosis and remediation of failing GitHub pull-request checks:** gh-fix-ci when available, otherwise an available implementation/domain owner. Follow Interop handoff for available-owner selection, gh-utility provider evidence, and the exact Git facts and missing inputs to pass; git-engineer does not decide the CI fix.

## gh-utility 1.2.2
Source: skills/gh-utility/SKILL.md


- **Local Git history, worktrees, commits, rebases, and push policy:** git-engineer. gh-utility covers native GitHub CLI use; git-engineer owns local Git decisions.
- **Review findings and feedback remediation:** code-reviewer or gh-address-comments when available. gh-utility may fetch or post GitHub state but does not decide code findings or fixes.
- **Failing pull-request checks:** gh-fix-ci when available, otherwise the implementation owner. Follow references/pr-ci-review-loop.md for the evidence handoff; gh-utility owns GitHub inspection, not diagnosis or remediation.
- **Security findings and policy judgment:** security-reviewer. gh-utility operates gh and does not issue security verdicts.

## architecture-engineer 0.1.9
Source: skills/architecture-engineer/SKILL.md


- **source-authorized scope, simplest sufficient architecture, self-expansion prevention, complexity exceptions, and proportional evidence:** implementation-discipline. implementation-discipline supplies the scope and simplicity gate; architecture-engineer owns ASR, patterns, ADRs, and handoff.
- **product requirements, success metrics, scope, non-goals, rollout, and product-level acceptance:** prd-engineer. architecture-engineer consumes PRD material and extracts ASR; it does not own product discovery or product scope.
- **ASR extraction, architecture forces, pattern selection, boundaries, trade-offs, ADRs, design notes, and routed architecture handoff:** architecture-engineer. this skill owns architecture frames and constraints before behavior-level specs are written.
- **behavior-level implementation specifications, atomic normative requirements, edge cases, falsifiers, and verification maps:** spec-engineer. architecture-engineer hands off constraints and obligations; spec-engineer turns them into implementation-ready behavior specs.
- **framework, security, data, ML, infrastructure, regulatory, or product-domain facts:** the relevant domain skill. domain skills own specialized technical facts; architecture-engineer uses them to choose patterns and constraints.
- **implementation backlog, sequencing, estimates, and ticket structure:** delivery-planner. architecture-engineer may identify handoff obligations or spec candidates, but delivery-planner owns executable decomposition and sequencing.

## spec-engineer 0.2.14
Source: skills/spec-engineer/SKILL.md


- **source-authorized scope, simplest sufficient specification, self-expansion prevention, and proportional evidence:** implementation-discipline. implementation-discipline supplies the cross-cutting authoring gate; spec-engineer remains the owner of behavior, edge cases, falsifiers, and verification maps.
- **product scope, users, scenarios, success criteria, and product acceptance framing:** prd-engineer. prd-engineer owns product intent and gaps; this skill consumes accepted product basis when producing implementation-ready behavior.
- **architecture boundaries, ASRs, pattern decisions, ADRs, quality scenarios, and architecture drift:** architecture-engineer. architecture-engineer owns architecture decisions and handoff; this skill inherits those constraints and routes drift back instead of deciding architecture inside a spec.
- **vertical slices, task briefs, sequencing, dependencies, and risk routing:** delivery-planner. delivery-planner owns decomposition and sequencing; this skill may specify a slice or task but does not create the delivery plan.
- **checking implementation evidence against an existing spec:** spec-conformance-reviewer. spec-conformance-reviewer owns conformance review after a spec exists; this skill owns authoring or revising the spec.
- **independent design-time concept alignment and false-capability risk:** concept-conformance-reviewer. concept-conformance-reviewer owns the independent verdict; this skill owns repairing the specification requirements and acceptance criteria.
- **framework, security, data, financial, regulatory, infrastructure, or other specialized technical facts:** the relevant domain skill. domain skills own specialized facts and constraints; this skill records accepted facts without inventing them.

## delivery-planner 0.2.13
Source: skills/delivery-planner/SKILL.md


- **source-authorized scope, simplest sufficient delivery path, self-expansion prevention, support-task exceptions, and proportional evidence:** implementation-discipline. implementation-discipline supplies the cross-cutting authoring gate; delivery-planner remains the owner of slices, tasks, dependencies, sequencing, and delivery handoff.

## typescript-test-engineer 0.1.10
Source: skills/typescript-test-engineer/SKILL.md


- **TypeScript language and type-system rules:** typescript-engineer. This skill owns testing strategy and runner behavior, while TypeScript language semantics belong to typescript-engineer.
- **Stable diff scope, finding severity, and merge guidance:** code-reviewer. code-reviewer owns the formal read-only review process; this skill supplies test-strategy and runner-domain judgments.
- **Authorized code and test remediation:** implementation-discipline. implementation-discipline owns mutation discipline and minimal changes; this skill owns the test behavior and evidence contract.
- **Browser smoke sessions and interaction diagnostics:** agent-browser. Use agent-browser when available for sampled browser interaction evidence; formal repository E2E remains owned by the project test suite and its framework tooling.
- **CI permissions, secrets, and untrusted inputs:** security-reviewer. security-reviewer owns permissions, secrets, untrusted-input, and exploitability judgments; this skill owns tests that exercise the sourced security contract.
- **Framework, platform, and domain behavior used as the test oracle:** the relevant framework or domain skill. Specialized owners define the behavior contract; this skill converts that contract into proportionate test evidence without inventing domain rules.

## concept-conformance-reviewer 0.2.4
Source: skills/concept-conformance-reviewer/SKILL.md


- **product intent, users, scope, success metrics, non-goals, and product acceptance:** prd-engineer. This skill identifies concept drift or false acceptance; prd-engineer owns product-source revisions.
- **architecture-significant requirements, boundaries, patterns, trade-offs, and ADRs:** architecture-engineer. This skill may detect an unsupported claim; architecture-engineer owns decisions and handoff.
- **vertical slices, module increments, task decomposition, dependencies, and sequencing:** delivery-planner. This skill identifies misleading task boundaries; delivery-planner owns decomposition and sequencing.
- **implementation-ready behavior, atomic requirements, acceptance criteria, falsifiers, and verification maps:** spec-engineer. This skill identifies defective requirements; spec-engineer owns specification revisions.
- **implementation discipline:** implementation-discipline. After concept alignment, implementation-discipline owns changes, verification, and reporting.
- **written specification compliance:** spec-conformance-reviewer. It owns normative compliance; this skill owns higher-level concept alignment.
- **general code defects, regressions, maintainability, and merge risk:** code-reviewer. It owns non-concept defects and merge-risk reporting.
- **threat modeling, exploitability, vulnerability confidence, and security severity:** security-reviewer. This skill may expose a gap; security-reviewer owns vulnerability validation and classification.
- **technical feasibility and domain semantics:** the relevant domain skill. Domain skills own specialized technical facts.

## spec-conformance-reviewer 0.1.7
Source: skills/spec-conformance-reviewer/SKILL.md


- **requirement extraction, implementation traceability, compliance statuses, evidence limits, and the final implementation-versus-spec verdict:** spec-conformance-reviewer. This skill owns the conformance decision while preserving the authority and evidence supplied by upstream and domain owners.
- **authoring, approving, clarifying, or changing normative product and software requirements:** spec-engineer or the named product and requirement owner. Upstream owners resolve ambiguity and establish authority; this reviewer records blockers and must not invent or rewrite intent.
- **whether requirements or implementation deliver the established product or system concept beyond literal spec compliance:** concept-conformance-reviewer. Concept conformance owns the broader capability boundary; this skill owns only implementation-versus-authoritative-requirement conformance.
- **general merge risk, bugs, regressions, maintainability, and non-spec implementation concerns:** code-reviewer. Route non-spec findings to code-reviewer while retaining any direct requirement-backed deviation in this verdict.
- **exploitability, attack paths, vulnerability classification, and security risk not explicitly defined by a normative requirement:** security-reviewer. Security-reviewer owns security judgment; this skill may consume its sourced facts without transferring the spec verdict.
- **stack-specific correctness facts and implementation remediation:** the relevant domain skill or implementation owner. Domain owners supply specialized facts and implement accepted corrections; this reviewer remains read-only and preserves traceability.
