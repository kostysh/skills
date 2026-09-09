# Журнал выполнения финансовых кейсов

Рабочий набор: /tmp/domain-rev-20260909/candidate-finance-clean. Кейсы независимы. Применён предоставленный financial-calculations-engineer; материал синтетический. Внешние сведения, родительский репозиторий, история, отчёты и другие испытания не читались. Делегирования нет. Оценка качества навыка или вердикт испытания не выносились.

## Прочитанные / раскрытые исполнителю файлы

- finance-cases.json
- skills/financial-calculations-engineer/SKILL.md
- skills/financial-calculations-engineer/references/money-library-usage.md
- skills/financial-calculations-engineer/references/server-backend.md
- skills/financial-calculations-engineer/references/browser.md
- skills/financial-calculations-engineer/references/database-sql.md
- skills/financial-calculations-engineer/references/parity-testing.md
- skills/financial-calculations-engineer/references/vat-iva.md
- cases/F01/CONTRACT.md
- cases/F01/money.mjs
- cases/F02/CONTRACT.md
- cases/F04/amount.mjs

Попытка прочитать cases/F01/charge.mjs и cases/F02/split.mjs установила отсутствие файлов до реализации. Других исходных файлов не открывалось. При тестировании Node загружал созданные charge.mjs, split.mjs и собственные тесты, а также разрешённые money.mjs и amount.mjs.

## Команды и фактические результаты

### Первичное чтение

```bash
cat /tmp/domain-rev-20260909/candidate-finance-clean/skills/financial-calculations-engineer/SKILL.md /tmp/domain-rev-20260909/candidate-finance-clean/finance-cases.json
```

Exit 0; stdout — полный активный SKILL.md и JSON шести кейсов. Установлены явные разрешения F01/F02 и read-only F03–F06.

```bash
cat /tmp/domain-rev-20260909/candidate-finance-clean/skills/financial-calculations-engineer/references/{money-library-usage,server-backend,browser,database-sql,parity-testing}.md /tmp/domain-rev-20260909/candidate-finance-clean/cases/F01/{CONTRACT.md,money.mjs,charge.mjs} /tmp/domain-rev-20260909/candidate-finance-clean/cases/F02/{CONTRACT.md,split.mjs} /tmp/domain-rev-20260909/candidate-finance-clean/cases/F04/amount.mjs
```

Exit 2. Stdout — полные пять references и существующие CONTRACT.md, money.mjs, amount.mjs. Существенные наблюдения: ENGINE-1 экспортирует readMinor/mulDivMinor, имеет floor; RULE-J1 задаёт JPY scale 0 и локальную формулу; amount.mjs использует bigint. Точный stderr:

```text
cat: /tmp/domain-rev-20260909/candidate-finance-clean/cases/F01/charge.mjs: No such file or directory
cat: /tmp/domain-rev-20260909/candidate-finance-clean/cases/F02/split.mjs: No such file or directory
```

### Реализация

Команда: `node --input-type=module` с heredoc через node:fs mkdirSync/writeFileSync. Созданы только два разрешённых implementation-файла и собственные тесты. Полный выполненный программный результат содержится в cases/F01/charge.mjs, cases/F02/split.mjs, results/F01/charge.test.mjs и results/F02/split.test.mjs. Существующие предоставленные исходники не записывались.

Exit 0; точный stdout:

```text
Created cases/F01/charge.mjs, cases/F02/split.mjs and results/F01/charge.test.mjs, results/F02/split.test.mjs; existing provided source unchanged.
```

### F01/F02 runtime

```bash
node --test /tmp/domain-rev-20260909/candidate-finance-clean/results/F01/charge.test.mjs /tmp/domain-rev-20260909/candidate-finance-clean/results/F02/split.test.mjs
```

Exit 0; точный stdout:

```text
✔ RULE-E1: exact fixed floor values including negative ties and int64 limits (1.156537ms)
✔ exact DTO shape and currency unit reject invalid inputs (0.356344ms)
✔ engine parser rejects noncanonical strings, wrong value types and over-range (0.209766ms)
✔ RULE-J1: literal results, signed remainder order, zero and full int64 (1.055927ms)
✔ accepted count maximum preserves sum, type, sign and remainder ordering (6.446515ms)
✔ type, range and count rejection, including zero total with invalid count (0.504345ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 52.515966
```

### F04 read-only runtime и F06 вычисление

Команда: `node --input-type=module` с inline import split из cases/F04/amount.mjs и node:assert/strict; никакие файлы этим запуском не записывались.

F04 literal fixtures: 10/3 → [4,3,3]; −10/3 → [−4,−3,−3]; 2/4 → [1,1,0,0]; −2/4 → [−1,−1,0,0]; 0/3 → [0,0,0]; min/1 → [−9223372036854775808]; max/3 → [3074457345618258603,3074457345618258602,3074457345618258602]; min/3 → [−3074457345618258603,−3074457345618258603,−3074457345618258602]. Все суммы и части в bigint.

Для total=[min,max,−1001n,−1n,0n,1n,1001n], count=1000 проверены length, сумма, bigint, диапазон, знак, невозрастающие модули частей и разница крайних модулей <=1n. Ошибочные total=[0,'0',null,undefined,min−1n,max+1n] ожидают AMOUNT; count=[0,−1,1001,1.5,'2',2n,NaN,Infinity,null,undefined] при total=0n ожидают COUNT.

F06 выполнено: numerator=1001n, denominator=4n; fee=numerator/denominator; если (numerator%denominator)*2n>=denominator, увеличить fee на 1n; assert.equal(fee,250n).

Exit 0; точный stdout:

```text
F04: 8 literal fixtures; 7 count=1000 invariant cases; 16 rejected invalid inputs. All assertions succeeded. No source changes.
F06 CONTRACT-D: exact 1001/4 = 250.25 EUR-cent; half-away fee=250 EUR-cent.
```

### Дополнительная обязательная reference

```bash
cat /tmp/domain-rev-20260909/candidate-finance-clean/skills/financial-calculations-engineer/references/vat-iva.md
```

Exit 0; stdout — полный vat-iva.md. Прочитан из-за условия residual-minor-unit handling; налоговая применимость кейсам не приписывалась.

## Сохранённые ответы и границы

results/F01.md–F06.md содержат реальные ответы на задачи, расчётные контракты и матрицы контуров. Результаты unit-тестов не объявляются проверкой PostgreSQL, приложения или persistence. F03 численный расчёт blocked из-за недостающей authority; F05 closure partial из-за not-run контуров. F04 исходник остался неизменным, находок в заданных границах нет.

## Дополнительные F07/F08 и совместный handoff

Дополнительная экспозиция: finance-more-cases.json, joint/input.json, cases/F07/CONTRACT.md, cases/F07/money.mjs. Чужие handoffs не читались. Выход joint/finance-handoff.md создан только для финансового анализа.

Команды чтения (обе exit 0, stdout полный указанных файлов):

```bash
cat /tmp/domain-rev-20260909/candidate-finance-clean/finance-more-cases.json /tmp/domain-rev-20260909/candidate-finance-clean/joint/input.json
cat /tmp/domain-rev-20260909/candidate-finance-clean/cases/F07/CONTRACT.md /tmp/domain-rev-20260909/candidate-finance-clean/cases/F07/money.mjs
```

Наблюдения: RULE-E7 задаёт human EUR major units, parseEurToCents и mulRatePpm 500000, output int64. F08 имеет конфликт rounding одинаковой силы. PREVIEW-1 требует exact int64, floor и Node/PostgreSQL parity; prototype использует Number и Math.round.

Реализация F07: node --input-type=module с node:fs mkdirSync/writeFileSync создал cases/F07/fee.mjs и results/F07/fee.test.mjs. Exit 0, stdout:

```text
Created cases/F07/fee.mjs and results/F07/fee.test.mjs. Existing sources unchanged.
```

Runtime command:

```bash
node --test /tmp/domain-rev-20260909/candidate-finance-clean/results/F07/fee.test.mjs
```

Exit 0, точный stdout:

```text
✔ RULE-E7: human EUR input, half-away ties and preserved EUR DTO (1.166968ms)
✔ public parser rejects unsupported syntax and non-string inputs (0.357967ms)
✔ public arithmetic checks output int64 without inventing an input bound (0.159862ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 40.935189
```

F08: анализ без runtime или изменения исходников. Совместный запрос: анализ/handoff, ни Node service, ни PostgreSQL не запускались; fixtures в handoff — буквальные ожидания для последующего исполнения. Ответы results/F07.md и F08.md, joint/finance-handoff.md записаны через node:fs writeFileSync; журнал дополнен appendFileSync. Доступ к данным ограничен разрешённым пакетом.
