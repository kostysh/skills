Локальная часть исполнима: правила чтения CSV и обе ссылки на справочные файлы находятся внутри `package/`. Образец содержит столбцы `id,label` и две записи.

По прочитанным материалам локальный метод переносим. Путь `/home/mira/...` присутствует только в исторической заметке, которую `SKILL.md` явно исключает из рабочих prerequisites; он не создает зависимости от прежней машины.

Совместимость с текущим API не установлена: нужны версия развернутого сервиса и соответствующая официальная документация. Живой запрос дополнительно требует клиента. Недоступность `export-schema-engineer` затрагивает только оценку proprietary extension, если такое расширение встретится; локальному чтению не мешает.

Выполненные команды в `/tmp/skill-methodology-20260907-3susvyls/runs/run-07`:

```bash
rg --files -g '!node_modules' -g '!pnpm-lock.yaml'
cat docs/skill-standard.md package/SKILL.md package/references/api-check.md package/references/local-format.md package/docs/run-note.md package/samples/export.csv
awk 'NR == 1 {print "header=" $0; next} NF {rows++} END {print "nonempty_records=" rows}' package/samples/export.csv
```

Последняя команда фактически вывела:

```text
header=id,label
nonempty_records=2
```

Сетевых запросов, установки, изменений и проверки на другой машине не проводилось. Это ограниченная проверка материалов, не формальная приемка.
