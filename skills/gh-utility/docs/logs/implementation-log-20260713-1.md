# Implementation Log

## Language

Русский.

## Log ID

`implementation-log-20260713-1`

## Operator Request

Проверить `gh-utility`, затем удалить переусложнённый proxy/runtime слой и оставить скиллом для
нативного GitHub CLI, его команд и use cases.

## Capability Decision

`gh-utility` не является transport proxy, policy engine или отдельной CLI-утилитой. Его результат —
правильно выбранная и применённая нативная команда `gh` с явным target и проверкой результата.

Helper-скрипт допустим только как прозрачная простая агрегация native `gh` reads или линейная
последовательность native `gh` calls. Он не может владеть authorization, redaction, mutation
transport, state machine или semantic verdict. В текущем скиле helpers отсутствуют.

## Removed Substrate

- удалены `src`, `test`, `scripts`, `package.json`, `tsconfig.json` и Vite config;
- удалены собственные команды `auth-doctor`, `route`, `safe-api`, `pr-threads` и
  `secret-manifest`;
- active references переведены на прямые `gh`, `gh api` и `gh api graphql` команды;
- удалены runtime declarations, runtime compatibility и runtime/test portability criteria;
- generated `SKILL.md` остаётся compiler-owned и пересобирается из `skill.yaml` и fragments.

## Boundaries

- `gh-utility` владеет выбором и применением нативных команд GitHub CLI.
- `git-engineer` владеет локальной Git-историей и push policy.
- `gh-fix-ci`, `gh-address-comments`, `code-reviewer` и `security-reviewer` владеют своими
  специализированными решениями.
- Compiler checks подтверждают структуру и переносимость, но не внешнее состояние GitHub.

## Verification

- `skill-source-compiler lint -> regenerate -> check`: PASS.
- Isolated compile/check: PASS; emitted package содержит только `SKILL.md`, references, assets,
  supporting docs, UI metadata и license.
- В emitted package отсутствуют `scripts`, `src`, tests, `package.json`, TypeScript/Vite files и
  runtime artifacts.
- Active-surface search не находит удалённые CLI commands, entrypoints или package identifiers.
- Portability search и `git diff --check`: PASS.
- Независимый review выполняется на стабильном documentation-only snapshot.

## Side Effects

Изменения ограничены `skills/gh-utility`. Commit, push, publication и GitHub mutations не входят в
работу.
