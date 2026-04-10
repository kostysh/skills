# Issue: post-commit workflow путает commit, rebuild и freshness checks

Дата: `2026-04-10`
Компонент: cross-skill workflow (`backlog-engineer` + `dossier-engineer`)
Область: operator workflow, query rebuild, review freshness, step closure
Серьезность: medium
Статус: fixed

## Кратко

После закрытия dossier step и коммита operator может увидеть две разные проблемы, которые выглядят как одна "проблема после коммита":

1. `backlog-engineer status` / `attention` / `queue` могут внезапно проявить backlog replay bug.
2. `dossier-engineer next-step` может показать `review freshness: stale` для только что закоммиченного состояния, если freshness ошибочно привязана к commit SHA.

Обе проблемы часто проявляются сразу после `git commit`, но причины разные.

Важно: сам commit обычно не ломает backlog. Commit просто является моментом, после которого agent запускает query-команды, а эти команды делают скрытую проверку/rebuild.

## Problem A: backlog выглядит сломанным "после commit", но причина в query rebuild

### Что видит operator

До commit-а:

- mutating command вроде `patch-item` возвращает success;
- `state.json` может выглядеть корректно;
- agent делает commit.

После commit-а:

```bash
backlog-engineer status
```

или:

```bash
backlog-engineer queue
```

может упасть с ошибкой вроде:

```json
{
  "error": {
    "code": "BE_TODO_NOT_FOUND",
    "message": "Todo was not found."
  }
}
```

Из-за порядка действий кажется, что проблема возникла из-за commit-а.

### Что происходит на самом деле

`git commit` не запускает backlog logic и не меняет `.backlog` semantics.

Проблема проявляется потому, что query-команды `status`, `attention`, `queue`, `items` не просто читают persisted `state.json`.

Они вызывают hidden maintenance path:

1. прочитать canonical packets/patches из `packets/` и `patches/`;
2. replay-нуть их в новый runtime state;
3. сравнить rebuilt state с persisted state;
4. при необходимости записать rebuilt state;
5. только потом вернуть query output.

Если canonical patch history не replay-safe, ошибка обнаруживается именно в этой query-команде.

Commit тут только "триггер по времени": после commit-а agent обычно проверяет `status` или `queue`, и именно эта проверка впервые запускает rebuild.

### Почему это важно для workflow

Operator воспринимает это как:

> "Мы закоммитили и backlog сломался."

Но точнее:

> "До commit-а была записана canonical history, которая не воспроизводится; после commit-а первая query-команда это обнаружила."

Это нужно явно объяснять в operator-facing errors и docs.

## Problem B: dossier review freshness не должен становиться stale только из-за commit

Это отдельная проблема и она связана не с самим commit, а с неправильной SHA-bound моделью freshness.

Принятое решение:

- commit SHA может храниться только как trace metadata события;
- commit SHA не является критерием freshness, validity, lifecycle gate, backlog integrity или dossier closure;
- review freshness определяется material change reviewed scope после review, а не сменой `HEAD`;
- committed process artifacts не должны создавать self-referential stale loop.

### Что видит operator

До исправления оператор мог видеть до commit-а:

```text
Review freshness: valid for commit <old-head>
Process-complete: yes
Uncommitted work: yes
```

А после commit-а:

```text
Review freshness: stale for current commit <new-head>
Process-complete: yes
Uncommitted work: no
```

После исправления такой переход считается багом: новый commit сам по себе не делает review stale.

### Почему старая модель была неправильной

В старой модели review artifact был привязан к конкретному commit SHA:

```json
{
  "reviewed_commit": "<old-head>"
}
```

Во время dirty-worktree closure reviewer фактически проверяет изменения относительно текущего `HEAD`.

Но сами dossier artifacts, review artifact, step-close artifact и backlog patches еще не закоммичены. После `git commit` появляется новый SHA:

```text
old HEAD + reviewed changes + process artifacts = new HEAD
```

Проверенный content теперь находится в новом commit, но review artifact все еще говорит:

```text
reviewed_commit = old HEAD
```

Поэтому `next-step` честно сообщает:

```text
review freshness: stale for current commit <new-head>
```

### Почему это плохой workflow

Это создает self-referential loop:

1. Чтобы review был fresh, нужно review artifact на текущий commit.
2. Но сам review artifact является новым файлом.
3. Чтобы зафиксировать review artifact, нужен новый commit.
4. Новый commit снова меняет SHA.
5. SHA-bound freshness снова может стать stale.

То есть строгая привязка freshness только к `HEAD` плохо сочетается с committed process artifacts.

Правильная модель: artifact может хранить `event_commit` как снимок видимого состояния репозитория на момент события, но `event_commit` не участвует в решении, fresh ли review и можно ли закрывать step.

## Почему эти две проблемы легко спутать

Обе обычно видны на одной стадии:

1. agent завершает step;
2. пишет verification/review/step-close artifacts;
3. commit-ит их;
4. запускает `status`, `queue`, `next-step`;
5. видит warning/error.

Но:

- backlog replay error вызван hidden rebuild query path;
- dossier freshness stale был вызван SHA-bound review model;
- commit только делает эти проверки заметными в одном месте workflow.

## Expected behavior

### Для backlog-engineer

Query-команды должны явно сообщать, что ошибка возникла во время hidden rebuild/replay, а не из-за `git commit`.

Обязательно:

- error details должны указывать canonical artifact, который не replay-safe;
- error message должен говорить, что failed rebuild/replay canonical artifacts;
- если падение связано с canonical patch operation, error details должны указывать patch/op;
- docs должны объяснять, что commit не является причиной.

### Для dossier-engineer / cross-skill workflow

Workflow не должен делать committed step immediately stale.

Обязательно:

- заменить SHA-bound fields на trace-only fields вроде `event_commit`;
- не использовать commit SHA как freshness, validity или lifecycle gate;
- сохранять material-change freshness semantics: review становится stale из-за изменения reviewed scope после review, а не из-за нового SHA;
- не вводить post-commit команду только для переаттестации SHA.

## Operator-facing explanation template

Если operator спрашивает "почему после коммита все стало stale/сломалось", отвечать так:

```text
Commit сам по себе не сломал backlog. После commit-а мы впервые запустили query-команду, а она делает hidden rebuild из canonical artifacts и обнаружила, что один из artifacts не replay-safe.

Отдельно dossier review freshness не должен становиться stale только из-за нового commit SHA. Если это происходит, значит где-то снова появилась SHA-bound freshness model. Commit SHA допустим только как trace metadata события.
```

## Acceptance criteria для исправления

- `backlog-engineer` query errors distinguish `read state failed` from `hidden rebuild failed`.
- `backlog-engineer` error details include the canonical packet/patch being replayed when rebuild fails.
- `backlog-engineer` replay errors include canonical patch operation details when replay fails inside an operation.
- Mutating backlog commands do not report success until canonical artifacts can be replayed into the produced state.
- `dossier-engineer` committed process artifacts remain valid without infinite SHA churn.
- `dossier-engineer` review/verify/step-close artifacts use trace-only commit metadata, not SHA-bound validity fields.
- Agent guidance explicitly distinguishes:
  - "commit caused the problem";
  - "commit was followed by a query/freshness check that revealed the problem".

## Non-goals

- Не редактировать вручную `.backlog/state.json` или `.backlog/applied.json`.
- Не отключать review freshness полностью.
- Не считать все post-commit stale states безопасными; безопасен только explicitly modeled process-artifact-only case.
