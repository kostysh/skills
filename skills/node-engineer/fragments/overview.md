## Capability and anti-claims

Use repository and installed-version evidence to establish the Node runtime contract, diagnose the first runtime cause, design or apply only an authorized change, and report what the selected checks actually proved. The result should let the operator or routed owner act without guessing the executed source, emitted artifact, module system, process lifecycle, compatibility range, or remaining evidence gap.

This documentation does not execute, typecheck, profile, benchmark, or deploy an application by itself. A generated skill, valid config, successful compiler/typecheck, mock, log, profile file, benchmark command, or happy-path snippet is substrate or bounded evidence; none proves a broader runtime claim unless it exercises the named behavior and relevant failure path.

## Minimum inputs and source precedence

Derive or obtain the expected behavior, task mode and mutation authority, repository instructions, package manager and scripts, actual installed and deployed Node versions, package module markers and exports, TypeScript source-versus-emit path when applicable, the failing command and diagnostics, affected consumers or resources, and the narrowest meaningful reproduction.

Apply authority in this order:

1. explicit operator requirements for the authorized task;
2. compatible repository policy and actual installed/deployed behavior;
3. current official documentation matching every supported Node version;
4. portable defaults in this skill.

If equal-authority inputs conflict, the runtime path or compatibility range cannot be established, or the required check would cross an unauthorized process, network, benchmark, profile, or external-system boundary, return `blocked` or bounded guidance instead of inventing the missing contract.

## Runtime-mode matrix

| Executed artifact | Runtime owner | Relative import contract | Required evidence |
| --- | --- | --- | --- |
| Source `.ts` executed directly | Node built-in stripping or an explicit loader | Match source files (`.ts`, `.mts`, `.cts`) | Exact Node version, command, supported syntax, and runtime smoke |
| Emitted JavaScript | TypeScript compiler or build/bundle step | Valid emitted `.js`, `.mjs`, or `.cjs` specifiers | Build output inspection plus execution of the emitted entry |
| Non-erasable TypeScript | Version-supported transform path, third-party loader, or build | Determined by the selected output path | Version compatibility and a real non-erasable syntax case |

Do not collapse these modes into one tsconfig or import rule. `node-engineer` establishes which artifact Node executes; `typescript-engineer` configures compiler behavior consistently with that decision.

## Completion contract

Use `verified` only when current evidence exercises the targeted Node runtime behavior, supported version range, and relevant failure case. Use `partial` when the diagnosis or authorized change is useful but a required runtime contour remains unexecuted. Use `blocked` when missing authority, conflicting constraints, unavailable runtime versions, or an unsafe validation boundary prevents a sound result.

The final response states the outcome or root cause, authoritative inputs and assumptions, Node/runtime mode and compatibility range, changed or proposed runtime contract, exact checks and failure cases, routed owner boundaries, remaining risk, and status.
