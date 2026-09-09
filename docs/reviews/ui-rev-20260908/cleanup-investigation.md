# Расследование cleanup UI-REV

Новый наблюдаемый факт: J browser получил EADDRINUSE на 43788 после завершения presentation executor. Read-only host inspection выявила шесть оставшихся серверов завершённых trials. Сопоставлены точные cwd под /tmp/ui-rev-20260908, cmdline node server.mjs и process start time; PID активного browser J исключён.

Установленный механизм: завершение npm/exec session с exit130 не подтверждало завершение дочернего node. Первопричина ошибочного evidence claim — отсутствие независимого readback ресурса после команды cleanup. Особенности передачи сигнала средой не исследованы до универсального вывода; воспроизводимый факт ограничен этими запусками.

Автор выполнил SIGTERM только шести атрибутированным PID; cleanup-attribution.json фиксирует объекты, cleanup-readback.json подтверждает их отсутствие. Чужие процессы и активный J оставлены. Первичные raw reports сохранены без переписывания; их cleanup success ограничен этим последующим опровержением.

Не является автоматическим доказательством дефекта инструкций: independent reviewer должен установить source gap/сufficient remediation. Дальнейший bounded trial должен проверять actual termination или честное указание оставшегося ресурса и владельца; нельзя выдать exit code за terminal resource state.
