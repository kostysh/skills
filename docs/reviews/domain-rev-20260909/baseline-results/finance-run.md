# Журнал финансовых задач

Выполнены F01–F08 и отдельный финансовый analysis/handoff для joint/input.json. Оценка качества skill и trial-вердикты не выполнялись. Все кейсы рассматривались независимо. Синтетические правила приняты как авторитет задания; внешняя финансовая/налоговая политика не выбиралась.

## Экспозиция

Прочитаны только следующие входные файлы (пути относительно `/tmp/domain-rev-20260909/baseline`):

- `skills/financial-calculations-engineer/SKILL.md`;
- `skills/financial-calculations-engineer/references/money-library-usage.md` — F01/F07 public engine, F02 non-EUR локальный контракт;
- `skills/financial-calculations-engineer/references/server-backend.md` — DTO, сериализация, F05 persistence и joint;
- `skills/financial-calculations-engineer/references/parity-testing.md` — F05 и joint;
- `skills/financial-calculations-engineer/references/database-sql.md` — F05 и joint PostgreSQL;
- `skills/financial-calculations-engineer/references/browser.md` — F05 browser build и экран;
- `finance-cases.json`, затем дополнительно разрешённый `finance-more-cases.json`;
- `cases/F01/CONTRACT.md`, `cases/F01/money.mjs`, `cases/F01/package.json`;
- `cases/F02/CONTRACT.md`, `cases/F02/package.json`;
- `cases/F04/amount.mjs`;
- `cases/F07/CONTRACT.md`, `cases/F07/money.mjs`;
- дополнительно разрешённый `joint/input.json`.

Память, история, родительский репозиторий, другие trials/reports/criteria не читались. Делегирования не было. Существующие предоставленные исходники не изменялись. Созданы только разрешённые реализации `cases/F01/charge.mjs`, `cases/F02/split.mjs`, `cases/F07/fee.mjs`, собственные тесты в `results/F01`, `results/F02`, `results/F07`, ответы и этот журнал в results, а также разрешённый `joint/finance-handoff.md`.

## Команды чтения

Все команды ниже завершились exit 0. `cat` фактически вернул содержимое названных файлов; краткая фиксация наблюдаемого вывода после списка команд не заменяет эти исходники.

```sh
cat /tmp/domain-rev-20260909/baseline/skills/financial-calculations-engineer/SKILL.md
cat /tmp/domain-rev-20260909/baseline/finance-cases.json
cat /tmp/domain-rev-20260909/baseline/skills/financial-calculations-engineer/references/money-library-usage.md /tmp/domain-rev-20260909/baseline/skills/financial-calculations-engineer/references/server-backend.md /tmp/domain-rev-20260909/baseline/skills/financial-calculations-engineer/references/parity-testing.md /tmp/domain-rev-20260909/baseline/skills/financial-calculations-engineer/references/database-sql.md /tmp/domain-rev-20260909/baseline/skills/financial-calculations-engineer/references/browser.md
find /tmp/domain-rev-20260909/baseline/cases/F01 /tmp/domain-rev-20260909/baseline/cases/F02 /tmp/domain-rev-20260909/baseline/cases/F04 -maxdepth 2 -type f -print
cat /tmp/domain-rev-20260909/baseline/cases/F01/CONTRACT.md /tmp/domain-rev-20260909/baseline/cases/F01/money.mjs /tmp/domain-rev-20260909/baseline/cases/F01/package.json /tmp/domain-rev-20260909/baseline/cases/F02/CONTRACT.md /tmp/domain-rev-20260909/baseline/cases/F02/package.json /tmp/domain-rev-20260909/baseline/cases/F04/amount.mjs
cat /tmp/domain-rev-20260909/baseline/finance-more-cases.json
rg --files /tmp/domain-rev-20260909/baseline/cases/F07
cat /tmp/domain-rev-20260909/baseline/cases/F07/CONTRACT.md /tmp/domain-rev-20260909/baseline/cases/F07/money.mjs
cat /tmp/domain-rev-20260909/baseline/joint/input.json
```

`find` вывел 6 разрешённых исходных файлов: F01 money.mjs, CONTRACT.md, package.json; F02 CONTRACT.md, package.json; F04 amount.mjs. `rg --files` вывел F07 CONTRACT.md и money.mjs. Реализационных файлов F01/F02/F07 ещё не было. Прочитанный skill имеет source-version 0.3.0. F01 public API — readMinor/mulDivMinor, local-money 1.0.0; F02 — single-jpy-formula 1.0.0 без money engine. F07 public API — parseEurToCents/mulRatePpm. joint содержит только заданные authority/prototype/request, а не исполняемый сервис.

## Изменения

Файлы создавались через `apply_patch`; инструмент вернул успешный результат без ошибки. F01 импортирует `./money.mjs`, проверяет точные поля и unit и использует floor. F02 реализует локальное распределение bigint по RULE-J1. F07 использует публичные parser/rate API. Исходный money engine не редактировался ни в одном случае.

## Исполненные проверки и фактический stdout

```sh
node /tmp/domain-rev-20260909/baseline/results/F01/charge.test.mjs
```

Exit 0:

```text
F01: 9 literal results; 12 invalid values; 9 invalid DTOs checked.
```

```sh
node /tmp/domain-rev-20260909/baseline/results/F02/split.test.mjs
```

Exit 0:

```text
F02: 9 literal results; 5 invalid totals; 9 invalid counts; 7 count=1000 invariant checks.
```

Для F04 тест выполнен в памяти, исходный файл не изменялся. Точная команда, включая независимый расчёт F06:

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { split } from '/tmp/domain-rev-20260909/baseline/cases/F04/amount.mjs';
const fixtures = [[0n,3,[0n,0n,0n]],[5n,3,[2n,2n,1n]],[-5n,3,[-2n,-2n,-1n]],[1n,3,[1n,0n,0n]],[-1n,3,[-1n,0n,0n]],[9223372036854775807n,2,[4611686018427387904n,4611686018427387903n]],[-9223372036854775808n,3,[-3074457345618258603n,-3074457345618258603n,-3074457345618258602n]],[-9223372036854775808n,1,[-9223372036854775808n]]];
for(const [total,count,expected] of fixtures) assert.deepEqual(split(total,count),expected);
for(const total of [1,'1',null,9223372036854775808n,-9223372036854775809n]) assert.throws(()=>split(total,2));
for(const count of [0,-1,1001,1.5,'2',2n,NaN,Infinity,null]) assert.throws(()=>split(0n,count));
for(const total of [-9223372036854775808n,-1n,0n,1n,9223372036854775807n]) {
 const p=split(total,1000);assert.equal(p.length,1000);assert.equal(p.reduce((a,b)=>a+b,0n),total);assert.ok(p.every(x=>typeof x==='bigint'));
 const a=p.map(x=>x<0n?-x:x);assert.ok(a[0]-a.at(-1)<=1n);assert.ok(a.every((x,i)=>i===0||a[i-1]>=x));
}
console.log('F04: 8 literal results; 5 invalid totals; 9 invalid counts; 5 count=1000 invariant checks. No mismatch.');
console.log('F06: CONTRACT-D fee = '+(1001n/4n + ((1001n%4n)*2n >= 4n ? 1n : 0n))+' EUR-cent.');
NODE
```

Exit 0:

```text
F04: 8 literal results; 5 invalid totals; 9 invalid counts; 5 count=1000 invariant checks. No mismatch.
F06: CONTRACT-D fee = 250 EUR-cent.
```

```sh
node /tmp/domain-rev-20260909/baseline/results/F07/fee.test.mjs
```

Exit 0:

```text
F07: 11 literal results; 16 invalid inputs; 2 output overflows checked.
```

F03, F05, F08 и joint: только анализ предоставленных условий, дополнительных runtime-команд не было. F03 не вычислялся из-за отсутствующих единиц/политики; F05 использует заявленный успех Node-тестов только как факт условия, не как самостоятельно перепроверенный запуск. F08 раскрывает совпадение обеих ветвей на −3, не разрешая конфликт. joint выявляет Number/rounding/validation/persistence gaps и передаёт необходимые fixtures, не заявляя их исполнение.

Итоговые фактические ответы: results/F01.md–F08.md; отдельный handoff: joint/finance-handoff.md. PostgreSQL, браузер, экран приложения и persistence в этом запуске не исполнялись.
