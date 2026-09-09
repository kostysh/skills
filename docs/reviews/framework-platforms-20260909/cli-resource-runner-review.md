# Независимый static delta review CLI runner

Runner статически готов к ограниченному native preflight: mount separation сохраняет приватную границу proxy, а найденный дефект неограниченной очистки исправлен. Реальный запуск Docker/CLI и применение cgroups этим review не подтверждены.

## Основание и снимок

Read-only targeted review `/tmp/framework-platforms-20260909/runtime-cli-run.py`. Первоначальный SHA256 `1bb6b9944059dba1e6cc6c64a7b11ad5b46ee4910f389fc4fe00dc0fde377527`; после сообщения координатору о CRR-01 автор внёс минимальный delta. Финальный проверенный SHA256 **`de5147a39ec0f3818fa1d4d2eda7114f3d0a22f3b4a65790b3ae80ce8f671b5b`**, совпал при чтении и закрытии review. Полностью прочитан вызываемый `record.py`; proxy не менялся и не переоценивался целиком.

Требования: exact case RW, public tools RO, public proxy socket directory; отсутствие private config/state и настоящего daemon socket в runner; 1.25 CPU / 6 GiB memory+swap, cpuset28–31; конечный command timeout и scoped cleanup. Supervisor, его config/state и реальный Engine socket доверенные; host network разрешён принятым envelope. Ни OS-level противник с root, ни полное ограничение сетевых адресов не входят в этот static review.

## Исправленный finding

**CRR-01 [P2], bounded lifecycle — закрыт по статическому delta.** В исходном `finally` вызов `docker rm -f` не имел timeout и игнорировал результат. После recorder timeout/убийства клиента это оставляло достижимый неограниченный cleanup и ненаблюдаемое сохранение runner.

Финальные строки `67–91`: rm ограничен15s, readback exact generated name —10s; результаты сохраняются в отдельный cleanup JSONL; отсутствие подтверждается только успешным readback и пустым exact-name результатом. Timeout/process-start failure сохраняет отсутствие подтверждения, печатает retained/unknown и завершает125. При подтверждённом отсутствии исходный command returncode сохраняется. Очистка остаётся scoped; prune или доступ к посторонним именам не добавлены. Это source-level closure оригинального failure path, не утверждение выполненного fault injection или реальной очистки Docker.

## Статически проверенная поверхность

| Область | Строки | Результат |
| --- | --- | --- |
| Разрешённый cwd | `20–26` | canonical path проверяется на точное совпадение с двумя fixture и четырьмя trial app paths; LAB root не разрешён |
| Public socket | `27–32, 48, 53` | resolved directory внутри public tree, Unix socket проверяется; DOCKER_HOST указывает на него |
| Mount separation | `46–48` | только case RW, tools RO и выбранный socket directory RW; ни весь LAB, ни private config/state, ни реальный Engine socket не присутствуют в mount argv |
| Resource argv | `41–45` | 1.25CPU, cpuset28–31, 6g memory+swap,512 pids, no-new-privileges |
| Environment | `51–59` | отдельный HOME; public tools в PATH; явный DOCKER_HOST; host Docker auth/config не передаются автоматически в container |
| Command/cleanup | `60–91` + весь `record.py` | основной timeout передан recorder; последний этап ограничен отдельными timeout; exact-name cleanup/readback и failure status наблюдаемы |

Новых подтверждённых source blockers не найдено. Targeted security результат: **no confirmed findings in reviewed mount/config surface**; security PASS не выдаётся.

## Проверки и пределы

`ast.parse` и `compile(..., mode="exec")` без исполнения программы/pycache — PASS. Реальные Docker/CLI команды, containers и behavioral trials не запускались. Ни новый постоянный тест, ни изменение runner не выполнялись reviewer.

Public Docker client теперь существует: `/tmp/framework-platforms-20260909/tools/docker`, SHA256 **`34cd0de16cc0b3d51a04188372b20f08f5f9c83553a34ad3a214e8adeb4b1294`** независимо совпал с `cli-docker-client-preparation.json`. Этот файл указывает source `/usr/bin/docker` и observed libc-only dependency; container execution остаётся pending. Ранее прочитанный каталог tools ещё не содержал client; это историческое наблюдение не используется как текущий blocker.

Supervisor должен передать выделенный каталог конкретного run, содержащий только его socket: guard допускает выбранный directory внутри всего public tree. Private config/state должны оставаться вне этого tree. Фактические UID/GID/socket permissions, RO mounts, невозможность доступа к daemon/private files, pinned image/client исполнимость, cpuset availability, cgroup limits и очистка нуждаются в sequential native preflight. Host network не обещает сетевую изоляцию. Эти предпосылки не превращены в source findings без подтверждённого нарушения.

Recommendation: **approve** — исключительно для статической готовности данного финального runner к ограниченному preflight. Native compatibility/runtime/resource gate остаётся unverified; эта рекомендация не разрешает обход proxy, публикацию или расширение исследования.
