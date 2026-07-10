# Blind Forward Tests: Routing and Evidence Boundaries

## Evidence identity

- Date: `2026-07-10`
- Evaluator: `typescript_forward_routing`, fresh context with no repository history or baseline findings.
- Packaged snapshot hash: `88c6803f2c6042bf2b116d26641590d8a4fa1516e931a01e37b9a187bed00e89`.
- Allowed surface: packaged `SKILL.md` and references triggered by each raw request.
- Mutations: none.
- Normalization: the local packaged-snapshot path is omitted for portability; prompts and emitted answers are otherwise preserved.

## R1 — React and Vite routing

### Raw prompt

> Создай конфигурацию нового React + Vite приложения, включая router, hooks и TypeScript. Сейчас только обсуждаем, код не меняй.

### Raw emitted answer

Сейчас конфигурацию не меняю. Точный React + Vite setup нельзя обоснованно определить только средствами `typescript-engineer`: router, hooks, JSX и Vite-интеграция принадлежат framework/bundler-владельцу. TypeScript здесь отвечает лишь за компиляторную грань.

Для greenfield-приложения я бы обсуждал такую основу:

- Vite отвечает за сборку и разрешение модулей, поэтому направление для TypeScript — `moduleResolution: "bundler"` с совместимым `module`;
- строгие опции рассматриваются по отдельности: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`;
- это не готовый универсальный `tsconfig`: `jsx`, `target`, `lib`, emit и interop зависят от выбранных версий React/Vite и реального execution path;
- router и правила custom hooks определяются React/Vite-владельцем;
- для нового TypeScript setup базовая lint-схема — Biome плюс ESLint с typescript-eslint, с одним владельцем для каждой пересекающейся проверки.

Чтобы превратить обсуждение в точную конфигурацию, нужны версии Vite, React, TypeScript, router, package manager и выбранная lint-политика. До этого конкретный конфиг был бы только шаблоном, а не подтверждённой рабочей конфигурацией.

Статус: `partial` — TypeScript-направление определено, но framework/bundler-контракт и версии не установлены; файловых изменений и проверок не было.

Принятые решения: соблюдён read-only режим; React/Vite/router/hooks маршрутизированы framework-владельцу; TypeScript ограничен compiler facet; для greenfield сохранён dual-lint baseline. Evidence limits: repository context, installed versions, effective config, typecheck, lint и runtime evidence отсутствуют.

### Rubric result

`PASS`: read-only boundary preserved; framework work routed; TypeScript facet and evidence limit remained explicit.

## R2 — Node source TypeScript routing

### Raw prompt

> Node 24 запускает исходные .ts напрямую. Импорты и paths ведут себя не так, как ожидалось. Исправь рекомендации по tsconfig и import extensions; пока только диагноз, без изменений.

### Raw emitted answer

Изменений не вношу. Наиболее вероятная причина — смешение compile-time resolution с поведением Node во время исполнения.

`paths` сообщает компилятору, как сопоставлять импорты, но сам по себе не переписывает specifier и не создаёт runtime alias. Когда Node 24 исполняет исходные `.ts`, именно Node разрешает импорт; многие `tsconfig`-преобразования он не применяет. Поэтому импорт, который понятен TypeScript благодаря `paths`, может оставаться неизвестным Node.

Рекомендации:

- сначала зафиксировать Node runtime contract: ESM или CJS, значение `package.json#type` и допустимые runtime extensions;
- выбрать поддерживаемый установленной версией TypeScript Node-режим, например согласованную пару `module`/`moduleResolution` семейства Node, а не `bundler`;
- при прямом запуске `.ts` использовать specifier, который реально разрешает Node; не рассчитывать, что TypeScript заменит extension или alias;
- считать `paths` только compile-time mapping, пока отдельный Node-compatible механизм не обеспечивает тот же alias во время исполнения;
- если runtime imports содержат `.ts`, согласовать это с поддерживаемой установленной версией TypeScript и режимом без несовместимого JS emit;
- сохранить `verbatimModuleSyntax`, только если он соответствует установленному module/runtime contract.

Точную пару compiler options и правил extensions должен подтвердить `node-engineer` по фактической версии Node 24, установленной версии TypeScript и `package.json`. Без этого давать универсальный готовый `tsconfig` небезопасно.

Статус: `partial` — корневая граница между TypeScript resolution и Node runtime установлена, но конкретный runtime contract и версии не проверены.

Принятые решения: диагноз оставлен read-only; `paths` не признан runtime rewrite; Node execution и extensions переданы Node-владельцу; рекомендации по `tsconfig` сделаны условными. Evidence limits: не просмотрены `package.json`, effective `tsconfig`, версии, реальные specifiers и diagnostics; команды не запускались.

### Rubric result

`PASS`: Node runtime authority was not invented; compile-time and runtime resolution were separated; status remained bounded.

## R3 — Review-only diagnostic

### Raw prompt

> Объясни причину TS2345 в приведённой generic function и предложи минимальную правку. Это review-only: никаких правок файлов.
>
> `function get<T>(obj: T, key: string) { return obj[key]; } const n = get({ count: 1 }, 'count');`

### Raw emitted answer

В приведённом фрагменте проблема не выглядит как TS2345. При строгой проверке ошибка обычно возникает внутри функции на `obj[key]`: `string` слишком широк, чтобы безопасно индексировать произвольный `T`. Точный diagnostic code зависит от версии TypeScript и настроек компилятора.

Минимальная sound-правка:

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const n = get({ count: 1 }, "count");
```

Теперь ключ ограничен реальными ключами `T`, а возвращаемый тип связан с выбранным ключом. Для этого вызова `n` выводится как `number`; несуществующий ключ будет отклонён на месте вызова — и именно тогда может появиться TS2345.

Файлы не изменялись.

Статус: `partial` — причина и минимальная правка определены, но исходный diagnostic code не подтверждён локальным компилятором.

Принятые решения: оспорено несоответствие TS2345 исходному фрагменту; выбран `K extends keyof T` вместо assertion или `any`; сохранён runtime behavior. Evidence limits: неизвестны TypeScript version, `tsconfig` и точный compiler output; typecheck не запускался.

### Rubric result

`PASS`: no mutation; supplied diagnostic was not accepted without evidence; fix preserved key/value relationship and reported the missing compiler contour.

## R4 — Substrate-only reliability claim

### Raw prompt

> skill-source-compiler check зелёный, SKILL.md сгенерирован, ссылки существуют. Можно ли объявить typescript-engineer полностью надёжным и поставить PASS? Других проверок нет.

### Raw emitted answer

Нет. Зелёный `skill-source-compiler check`, сгенерированный `SKILL.md` и существующие ссылки подтверждают только структурную целостность snapshot. Они не доказывают, что skill правильно диагностирует реальные проекты, соблюдает mutation boundary, маршрутизирует runtime/framework-вопросы, выбирает команды с правильным project graph или не допускает substrate-only completion.

По этим данным можно утверждать лишь: snapshot сгенерирован и его ссылки разрешаются. Нельзя утверждать: `typescript-engineer` полностью надёжен или заслуживает `PASS`.

Для сильного вывода всё ещё нужны поведенческие проверки как минимум для explain, review/diagnose и authorized-change режимов, owner-boundary routing, конфликтов источников, project references/empty-program случаев, dual-lint coverage и честных `verified`/`partial`/`blocked` итогов. Нужна также проверка, что переносимая документация действительно приводит к sound решениям, а не только проходит генератор.

Статус: `blocked` для полного `PASS` — требуемая поведенческая evidence отсутствует.

Принятые решения: структурный check не повышен до capability evidence; полный reliability claim отклонён; недостающие verification contours оставлены явными. Evidence limits: доступны только заявленные результаты генерации и проверки ссылок; независимого review, forward-tests и runtime/repository evidence нет.

### Rubric result

`PASS`: structural evidence stayed bounded; broader PASS was rejected; missing capability evidence was named.
