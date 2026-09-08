# Независимая оценка node-engineer 0.1.4

**PASS.** NODE-01 устранён; в проверенном delta и связанных runtime/interop границах неразрешённых P1/P2 не установлено. Verdict ограничен качеством инструкций и наблюдавшимися сценариями, без общей приёмки четырёх скиллов или production release.

## Основание, scope и assurance

- Mode: `change` с проверкой устранения NODE-01 и примыкающих контрактов. Assurance: `independent`; reviewer `/root/baseline_ts_node` не автор/remediator candidate, автор — `/root/author_ts_node`.
- Consumer: инженерный агент, который должен установить фактический Node/loader/entry/module contract, выполнить соответствующий runtime путь, сохранить failure/cancellation/resource invariants и передать чужие решения владельцу. Typecheck, clean start или локальный happy path не доказывают более широкую runtime/deployed/installed-bin готовность.
- Base `504b87331f22b3a5303875bef69163a40d4372d7`; [snapshot](candidate-snapshot.json) создан `2026-09-08T19:14:07.312823+00:00`. 16 файлов, aggregate SHA-256 `590c25015b82166fd7fbfb58165d81ecbbeeeb661450f0281403a64706823d4f`; пути POSIX относительно пакета. Root SHA-256 `073a05ee05c1ef9db06d375ec9412fd2f8308a3d0ae2e028ed8df4f45eb55eef`.
- Проверены package delta, declared `skill.yaml`/overview source, emitted root, runtime reference, supporting docs/logs, неизменённые activation/UI и смежные baseline инструкции. Reviewer не менял target.
- [Независимый readback](candidate-ts-node-independent-readback.json) подтвердил полные manifest hashes, working/archive equality Node/TS и девяти frozen соседей, result files C01–C08 и их active snapshot. [Master readback](master-readback.json) совпал с baseline, G5 не использован.

## NODE-01 и runtime evidence

[Root matrix](candidate-packages/node-engineer/SKILL.md) теперь разделяет native stripping, third-party loader, emitted JS и non-erasable path. [runtime-typescript.md:51–91](candidate-packages/node-engineer/references/runtime-typescript.md#import-extensions) требует для loader его фактическую версию/config/resolver и существующую команду; `.ts` extension и erasable guard ограничены native path. `ts-node` 10.9.2 remapping описан условно, с `experimentalResolver` и ссылкой на owning docs; произвольной замены loader или массовой переписи imports нет.

**NODE-01 CLOSED.** Guided [source probes](source-probes/candidate/ts-node/commands.jsonl) и их исходные файлы подтверждают три разные границы на Node 24.15.0 / TS 5.9.3 / ts-node 10.9.2:

- Native `main.ts` с `.ts` import: `native-ok`, exit 0; отдельный negative control доказывает, что отсутствующий `.js` не remap-ится native runtime.
- Existing ESM loader с `.js → .ts`, `esm: true`, `experimentalResolver: true`: actual `node --loader ts-node/esm src/main.ts`, `loader-ok`, exit 0.
- Declared `npm run build` exit 0 и исполнение `node dist/main.js`, `loader-ok`, exit 0. Build и runtime отмечены отдельно.

Исходные pnpm попытки start/build/emitted завершились exit 1 из-за auto-install/toolchain вмешательства и сохранены. Они не доказательство loader failure. Автор перешёл к установленным runtime/npm командам; [toolchain restore](toolchain-restore.json) восстановил locked shared окружение. Guided probes не являются blind поведением агента; reviewer проверил их связь с исправленным source и raw outcomes. Версионная совместимость за пределами исполненного окружения ими не доказана.

| Blind case | Наблюдение reviewer по RESULT, product files и raw commands | Итог |
| --- | --- | --- |
| [C05](results/candidate/C05/RESULT.md) | Minimal `finally(() => resource.close())`; исходные error/cancel tests падали, итоговые шесть проверяют success, Transform error, source error identity, pre-abort, abort после начала чтения и сохранение результата при ненулевом return close. Реальный Node 24.15.0; новый framework/dependency отсутствует. | PASS |
| [C06](results/candidate/C06/RESULT.md) | Local version/help/entry установлены, smoke stdout `42`, exit 0. `--no-strip-types` дал ожидаемую local negative демонстрацию, не объявлен воспроизведением deployment. Неизвестные deployment version/command/error запрошены, файлы не изменены. | PASS |
| [C07](results/candidate/C07/RESULT.md) | CommonJS/ESM конфликт не разрешён самовольно. Actual entry печатает `finished`, но удерживается interval; recorder timeout exit 124 сохранён. In-memory interception/clearInterval показал `Timeout`/`hasRef: true`, затем natural exit 0. Product files неизменны. | PASS |
| [C08](results/candidate/C08/RESULT.md) | Read-only диагностика установила ts-node 10.9.2, TS 5.9.3, Node 24.15.0 и effective resolver config; loader исполнил `.js` import как `.ts`, stdout `loader-ok`. Missing-module negative exit 1 сохранён. До/после hashes одинаковы; unavailable TS owner не стал blanket blocker или выдуманным verdict. | PASS |

C05 имеет существенную evidence оговорку: один экспериментальный async source не освобождал ожидание после abort и дал 90-секундный timeout; окончательный сценарий явно освобождает ожидание. Raw events записаны по завершению команды, поэтому порядок строк не сам по себе привязывает PASS к последним файлам. Reviewer скопировал точный frozen `C05/app` в disposable directory и отдельно выполнил declared `npm test`: **6/6 PASS**, exit 0. [Сырые stdout/stderr/command](candidate-ts-node-independent-commands.jsonl), [hash readback](candidate-ts-node-independent-readback.json). Проверяется число вызовов предоставленного успешного `close()`, не закрытие внешнего сервиса; throwing close и бесконечно ожидающий некооперативный источник не входят в доказанный контракт. Итоговый RESULT эти границы раскрывает; timeout не скрыт.

[Run index](run-index.json) фиксирует fresh `fork: none`, assigned Astra/high и исключение source/history/answer keys. Изоляция инструкционная при shared filesystem; полной session trace нет. Это forced execution, не natural activation. C05–C08 criteria и исходные fixtures unchanged относительно baseline, все четыре baseline тоже PASS: observed continuity без заявления общего улучшения качества на этой выборке. NODE-01 закрыт дополнительно source/runtime checks и loader case, а не разницей pass rate.

## Interop и структурные gates

Новые [interop/policies:133–161](candidate-packages/node-engineer/SKILL.md) сопоставлены с непосредственными producer/consumer контрактами frozen `typescript-test-engineer`, `code-reviewer`, `security-reviewer`, `architecture-engineer`, `spec-engineer`, `prd-engineer`, `delivery-planner`, `git-engineer`, `gh-utility`:

- Test owner получает runtime reproduction/version/failure/cleanup oracle и возвращает фактические scenario-to-command results; runner policy остаётся у него.
- Code/security owners получают конкретный stable runtime boundary и evidence; формальный review/security вывод не подменяется успешным процессом, remediation остаётся authorized.
- Product/spec/architecture/planning owners поставляют принятые behavior/constraints/scope/checkpoints; Node возвращает противоречие владельцу и не создаёт новых продуктовых правил.
- Git/GitHub получают paths/revision/checks только для authorized publication и возвращают matching fresh state; локальная зелень не предоставляет полномочия.
- TS↔Node связывает runtime entry/version/mode/resolver, compiler config/emitted specifiers и исполнение того же artifact. CLI↔Node связывает argv/stdout/stderr/exit/installed-bin contract с process evidence; source run не доказывает installation.

Эти передаваемые результаты доступны соответствующим владельцам и пригодны названному потребителю. Materiality/same contract-version-snapshot/dependent-only fallback согласованы; прямой source conflict не установлен. Это source-grounded interop assessment, не утверждение об исполнении всех девяти handoffs. Совместные C17/C19 оцениваются отдельно координатором и не присваиваются этому отчёту.

[Author self-check](author-ts-node.md), [commands](author-ts-node-commands.jsonl), [readback](author-ts-node-readback.json) отдельно подтверждают lint/regenerate/check, compile в отдельный каталог и check результата, validator, diff-check exit 0. Source manifest автора совпадает с candidate. [Mandatory CI](candidate-ci.json): frozen install и `pnpm test:ci` exit 0, включая 44 compiler tests; [integrity](candidate-integrity.json) подтверждает active links и сохранённый non-target scope. Supporting logs корректно называют авторские проверки и незавершённую независимую приёмку; не создают активной зависимости на workspace history.

Для указанной границы выполнены условия независимого **PASS**: стабильный source/emitted пакет, устранён исходный failure path, применимые mandatory checks зелёные и пропорциональные blind/runtime samples проверены. Не заявлены все Node/loader версии, production/deployed completion, full lifecycle/load/benchmark/security coverage, natural activation, joint acceptance или publication. Следующий владелец — координатор общей evidence и принятого acceptance checkpoint; material snapshot delta требует обновлённого review.
