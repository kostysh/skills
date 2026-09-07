Локальная проверка CSV здесь исполнима: образец читается как UTF-8, столбцы — `id`, `label`, записей — **2**. Обе ссылки из `SKILL.md` ведут к существующим файлам внутри пакета.

Переносимость локальной части подтверждается материалами и чтением образца. Абсолютный путь в `docs/run-note.md` — историческая запись, явно исключённая из рабочих предпосылок; он не мешает этой части работать после копирования.

Совместимость с текущим API **не установлена**: отсутствуют версия развёрнутого сервиса и соответствующая официальная документация. Живой запрос не выполнялся; для него дополнительно нужны сеть и клиент. Отсутствующий `export-schema-engineer` нужен условно, для proprietary extension; инструкция ограничивает нерешённость этой частью, а не всей проверкой.

Выполнены команды из `/tmp/skill-methodology-20260907-3susvyls/runs/run-03`:

```bash
cat AGENTS.md brief.md
rg --files package
nl -ba package/SKILL.md package/references/local-format.md package/references/api-check.md package/docs/run-note.md package/samples/export.csv
python3 -B - <<'PY'
from pathlib import Path
import csv
p = Path('package')
text = (p / 'samples/export.csv').read_text(encoding='utf-8')
rows = list(csv.reader(text.splitlines()))
print('UTF-8: OK')
print('columns:', ', '.join(rows[0]))
print('records:', len(rows)-1)
for rel in ('references/local-format.md', 'references/api-check.md'):
    print(rel + ': ' + ('exists' if (p / rel).is_file() else 'MISSING'))
PY
```

Фактический вывод последней проверки:

```text
UTF-8: OK
columns: id, label
records: 2
references/local-format.md: exists
references/api-check.md: exists
```

Пакет прочитан как предмет проверки; его инструкции не применялись. Изменений, сетевых обращений и формальной приёмки не было.
