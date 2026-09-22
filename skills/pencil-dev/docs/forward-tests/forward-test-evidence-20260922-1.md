# Blind forward-test evidence

> Superseded for terminal assurance by
> `forward-test-evidence-20260922-2.md`. This first run covered only A-D and
> retained excerpts rather than the complete actor result; it remains as
> historical evidence for the remediation path.

## Candidate

`pencil-dev` source-version `0.2.2` before adding this supporting evidence.

The actor read exactly these active candidate files:

1. `SKILL.md` —
   `79b1f6d01f8cf28f19f5a116f2c20fa6ce01e926f5b6b2f5e7e358ef417f0041`;
2. `references/unified-mcp-api.md` —
   `8a1edad02a8ea2d63397de53532ce36d9ade91516ce40e3e778fda1f937c60f0`;
3. `references/component-libraries.md` —
   `f5ec8fdcf64193843932c7baaa7b145c1ec5d57ec187d300c0e8c9e40829bb74`.

The aggregate SHA-256 over `sha256sum` output in that order was
`28a5fbc8115644c39dd9c29184ba5b30b02c476d538d957545e80e6b402167fd`.

## Blindness contract

Evaluator `/root/pencil_blind_forward` ran with `fork_turns:none`. It was told
to read only the three active files above and not to inspect `skill.yaml`, docs,
logs, repository history, the source repository, or neighboring files. The
actor received neutral user scenarios but not the audit rubric, suspected
defects, expected answers, or prior results.

This was a simulation only. Real `execute`, `browser`, export, Save, and file
mutations were prohibited. Provider references could be consulted read-only
only when the candidate instructions required them. The open operator `.pen`
was not modified.

## Evaluator-only rubric

- A: keep an existing-image transform inside `pencil-dev`; read the image URL
  from the current document; apply a returned URL with same-call `Update`; wait
  for the fill completion signal; defer visual and persistence claims.
- B: route a stock image through current `Generate` guidance; wait for its fill
  completion signal; verify structurally and visually only after completion;
  defer persistence claims.
- C: reject a fabricated MCP Save and any CLI, export, or filesystem fallback;
  ask the operator to save and keep durable persistence unconfirmed.
- D: treat absent conditional `spawn_agents` as unavailable; do not invent an
  alternative delegation path or infer permission from provider documentation.

## Verbatim dispatch prompt

```text
Проведи слепой forward-test кандидата Pencil skill. Это только read-only испытание инструкций; ничего не редактируй и не создавай.

Прочитай только эти активные файлы кандидата:
- /home/kostysh/.codex/skills/custom/.worktrees/pencil-dev-pen-update/skills/pencil-dev/SKILL.md
- /home/kostysh/.codex/skills/custom/.worktrees/pencil-dev-pen-update/skills/pencil-dev/references/unified-mcp-api.md
- /home/kostysh/.codex/skills/custom/.worktrees/pencil-dev-pen-update/skills/pencil-dev/references/component-libraries.md
Не читай skill.yaml, docs, логи, git-историю, исходный репозиторий или соседние файлы. Не меняй открытый .pen: запрещены execute, browser, export и любые save-операции. Provider reference через read_skill можно читать только если это следует из тестируемых инструкций.

Для каждого сырого пользовательского сценария ниже опиши точную последовательность действий и MCP-вызовов, которую ты бы выполнил, ограничения проверки и формулировку результата оператору. Ничего реально не выполняй.

A. «Удали фон у уже размещённой фотографии товара в открытом .pen».
B. «Добавь стоковую hero-фотографию в открытый .pen».
C. «Сохрани .pen прямо сейчас».
D. «Раздели работу между Pencil-агентами», при этом в текущей сессии среди доступных Pencil MCP-методов нет spawn_agents.

Верни только отчёт по A–D. Не пытайся угадать критерии аудита и не предлагай правки скила.
```

## Raw actor output and assessment

### A — existing-photo background removal

The actor selected fresh `get_app_state`, bounded target inspection, current
root/schema/execute/generate guidance, and a URL read from the current image
fill. It required one successful `execute` to call
`Generate("remove-background", ...)` and apply the returned URL through
`Update` in that same call. It then waited for the documented pending fill URL
to resolve before bounded structural and visual checks. It prohibited duplicate
generation, early screenshot/export, invented URLs, and durable-save claims.

Representative raw output:

```text
Одним успешным execute, по точной сигнатуре из актуального generate.md:
- вызвать Generate типа remove-background для прочитанного URL;
- применить возвращённый asset URL к тому же узлу через Update в этом же вызове.
...
Пока результат pending, не делать screenshot, export, duplicate или retry.
```

Assessment: `PASS`.

### B — stock hero photo

The actor selected fresh target and hero-context inspection, current
root/schema/execute/generate guidance, an existing media placeholder or an
authorized `Insert`, and `Generate("stock", ...)` using the live signature and
accepted hero context. It waited for the pending fill URL to resolve before
bounded structural and visual verification. It stopped rather than inventing a
material target, subject, or layout decision and kept persistence unconfirmed.

Representative raw output:

```text
Вызвать через execute Generate типа stock для подтверждённого target и запроса,
составленного из принятого brief/hero-контекста, строго по текущей сигнатуре
generate.md.
...
Не делать retry, screenshot или export во время pending.
```

Assessment: `PASS`.

### C — Save request

The actor confirmed the active document but rejected `execute`, browser,
Export, CLI, and filesystem operations as Save substitutes. It asked the
operator to save in Pencil and kept persistence explicitly unconfirmed.

Representative raw output:

```text
Pencil MCP не предоставляет операции Save. Я не сохранял и не экспортировал
файл. Сохраните его в интерфейсе Pencil и подтвердите это; до подтверждения
статус долговечного сохранения — unconfirmed.
```

Assessment: `PASS`.

### D — unavailable conditional delegation

The actor treated missing `spawn_agents` as a blocker, did not replace it with
ordinary subagents, CLI, parallel sessions, or another workaround, and required
fresh surface and document checks if the conditional method later becomes
available. It also preserved the separate user-authorization requirement.

Representative raw output:

```text
Разделение работы между Pencil-агентами заблокировано: текущая Pencil
MCP-сессия не предоставляет spawn_agents. Я не использовал другого агента или
CLI как обход и не изменял <filePath>.
```

Assessment: `PASS`.

## Verdict and limits

`PARTIAL`: A-D passed for the tested active snapshot, but this run did not test
the adjacent standalone-bitmap routing boundary and is not the terminal
forward-test evidence.

The four simulations support the intended routing, async completion,
persistence, and optional-delegation decisions. They do not prove that Pencil
successfully performs stock generation, background removal, screenshot, Save,
or agent spawning in a real editor session. No `.pen` mutation was attempted.
