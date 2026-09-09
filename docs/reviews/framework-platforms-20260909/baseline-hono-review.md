# Baseline: hono-engineer

**FAIL — 2 подтверждённых P2.** Режим `baseline`; assurance `independent`. Автор отчёта не создавал и не исправлял проверенный снимок. Это независимая исходная оценка, не итоговая приёмка исправленной версии.

Снимок: commit `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`, skill `0.1.7`, SHA-256 `SKILL.md`: `80e21320047b0d4502ea75aed08f99c574411d896521a45c013237fbb1bd8c49`. Хеши всех файлов: [baseline readback](hono-supabase-baseline-readback.json), [полная карта](technical-hono.json). Дата сверки: 2026-09-09.

Потребитель — агент, выполняющий принадлежащую скиллу задачу в существующем проекте. Ожидаются поддерживаемые installed-version API/команды, сохранение принятого контракта и проверка реально заявленной границы. Исходники, generated root, все active references, примеры, метаданные, UI, maintenance declaration и прямые owner-контракты прочитаны; supporting inventory отделён от действующих инструкций. Техническая карта включает весь active scope, а не только строки findings.

## Материальные findings

### H01 · P2 · Bearer 400 относится к входящему Authorization, а не к конфигурации

Источник: `skills/hono-engineer/references/auth.md:11-12`. Basis: `direct` для текста/официального контракта; неверный пользовательский результат выведен из указанного пути, не из слепого исполнения. Confidence **high**.

Запрос диагностировать неожиданный400 → загрузка auth.md → configured token объявляется источником400 → неверная причина и регрессионный статусный oracle вместо различения входного header и конфигурации.

Официальное основание: [hono-bearer-source](https://raw.githubusercontent.com/honojs/hono/v4.13.7/src/middleware/bearer-auth/index.ts), сохранённый original snapshot `official-hono-supabase/hono-bearer-source.txt`. Hono4.13.7 parses the request header and rejects malformed format with400. options.token is compared later; missing token/verifyToken throws during construction.

P1 screen: No auth bypass demonstrated; confirmed wrong diagnostic/status oracle is P2. Отчёт не заявляет наблюдавшуюся ложную готовность или действие в продукте.

Исправление: Разделить malformed входящий Authorization (400), несовпадение credential (401) и ошибку создания middleware при отсутствии token/verifyToken; при необходимости показать точный anchored regex установленной версии.

Закрывающая проверка: Exercise malformed Authorization, missing header, valid mismatch and middleware construction separately.

### H02 · P2 · nodejs_compat больше не всегда opt-in

Источник: `skills/hono-engineer/references/wrangler.md:10-10`. Basis: `direct` для текста/официального контракта; неверный пользовательский результат выведен из указанного пути, не из слепого исполнения. Confidence **high**.

Запрос настроить Worker с compatibility_date=2026-08-04 → положительный flag трактуется как необходимое включение → отсутствие flag ошибочно воспринимается как отсутствие Node API; рекомендация отключения не описывает обе отрицательные настройки.

Официальное основание: [cf-compat-flags](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/workers/configuration/compatibility-flags.mdx), сохранённый original snapshot `official-hono-supabase/cf-compat-flags.txt`. Compatibility dates >=2026-08-04 enable both Node flags by default; disabling requires both negative flags and removal of positive flags. Older dates retain version-specific opt-in.

P1 screen: No exploit or unauthorized platform mutation demonstrated; wrong configuration guidance is P2. Отчёт не заявляет наблюдавшуюся ложную готовность или действие в продукте.

Исправление: Ввести ветку по compatibility_date: до2026-08-04 проверить включение, начиная с даты проверить включённые по умолчанию оба режима и корректное отключение. Сохранять дату существующего проекта.

Закрывающая проверка: Compare effective compatibility before and after 2026-08-04, including both negative flags.

## Подтверждённое и пределы доказательств

Покрыты 18 active references и 87 аспектов/поверхностей. Каждый раздел с API, командой, default, code example либо ограничением связан с official source ID, датой и версией; чистые локальные правила authority/evidence помечены N/A с основанием. Метаданные root не получают отдельный blanket technical PASS: vendor-дубликаты наследуют выводы references. [Каталог оригинальных источников](official-hono-supabase-sources.json) сохраняет URL, дату и SHA-256; search snippets не использованы как основание.

Версии: Hono4.13.7 и @hono/node-server2.1.1 stable; supabase-js2.116.0, @supabase/ssr0.12.7, CLI2.117.0 stable. Hosted Supabase/Cloudflare документы — rolling snapshot на дату проверки, не доказательство конкретного deployment. Declarative sync CLI отмечен experimental. Установленные продуктовые версии не исследовались и не обновлялись. Для совместного Node HTTP→Supabase сценария adapter2 требует Node>=20, SDK2.116 требует Node>=22; проверять весь набор, не только Hono.

Расхождения источников обработаны явно: pinned CLI2.117 help/docs против прежнего live declarative guide; pinned SDK2.116 retry implementation против более широкого live описания; adapter2.1.1 engine против старого Node minimum в live Hono guide. Ни одна неверсированная страница не выдана за точный runtime контракт.

Reviewer выполнил чтение, полный hash readback и read-only CLI version/help probes ([результат](supabase-cli-readonly-probes.json)); целевые файлы, глобальная среда, приложения и удалённые сервисы не менялись. Для Hono имеется `node --test test/docs-contract.test.mjs`, но это структурный контракт текста и reviewer его не запускал. Compiler, link/portability, package gates и `pnpm test:ci` в этой оценке не исполнены; их результат не придуман. Ни fresh GPT-6 Astra agent trial, ни реальная HTTP/DB/SSR/Storage/Realtime/Edge/deployment проверка не являются результатом этого отчёта. Historical logs прочитаны как supporting evidence, прежний PASS не перенесён.

Прямые owners: Hono отвечает за маршрут/Context/response lifecycle; Supabase — JWT client/RLS/RPC/transaction boundary; spec-engineer — HRB handoff; architecture-engineer — topology; security-reviewer — независимый security verdict; TypeScript/Node/test owners — язык, runtime и метод проверки. Ownership проверен статически; совместное наблюдаемое исполнение остаётся обязательным последующим gate.

Отсутствие behavioral evidence не отменяет подтверждённые P2: применяется первый пункт ordered verdict contract `skill-reviewer/references/methodology.md:69-78`. Поэтому **FAIL**, а не BLOCKED/PROVISIONAL. Следующий владелец — автор исправлений; после neutral baseline trials подготовить минимальный candidate, зафиксировать snapshot и предъявить эти failure paths на независимый re-audit. [Raw cases и закрытые критерии](case-proposals-hono-supabase.md) предложены до candidate; они ещё не исполнялись.
