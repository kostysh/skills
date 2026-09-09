# Авторская карта и дополнительный self-check Hono / Supabase

**Авторская подготовка, не независимый review PASS.** Координатор реализовал основные исправления Hono 0.1.8 / Supabase 0.1.7; автор карты получил отдельное разрешение исправить обнаруженные concrete full-source gaps в этих пакетах. Baseline отчёты и frozen official snapshots сохраняются. Другие пакеты и общий журнал не изменяются.

## Audit instruction quality

Результат перед дополнительной генерацией: **ready-to-regenerate**. Потребитель — агент, выполняющий уже принадлежащие навыкам HTTP/SDK/DB/runtime решения. Минимальные входы, scope, installed versions, task authority и evidence limits остаются в root. Дополнения не добавляют продуктовую политику, topology, сервис, runtime или обязательный upgrade; они уточняют реальные версионные предпосылки уже используемых APIs и разграничивают identity, source и live evidence.

У Hono сохранились условные references, source-first version discovery и exact phrase Workers runtime test; версия framework в активных инструкциях не закреплена. Dated adapter/SDK engine floors не являются Hono core pin. У Supabase уточнены только SSR callback, effective JWT, PostgreSQL view version, Storage read/list, Realtime cached policy/DELETE и Edge gateway. Mandatory local method остаётся переносимым; внешние ссылки дают version/current authority, supporting maps не активируются как инструкции.

Проверка делает требования точнее: авторизационный отказ, cookie cache header, DELETE delivery и эффективный credential требуют собственной наблюдаемой границы. Конструктор, gateway pass, callback, metadata или compiler не заменяют этот результат. Существующие поддерживаемые версии сохраняются; неизвестная версия блокирует только зависимый вывод. Другие owner skills не изменены и их approval не выдуман.

## Дополнительная семантическая доработка

- Hono framework-currency/supabase: adapter 2.1.1 Node >=20 и SDK 2.116 Node >=22 проверены по exact package source; совместная Node floor, сохранение legacy и отдельная Workers-runtime граница.
- Supabase client-setup: SSR >=0.10 second setAll headers; 0.12.7 first-write-only headers; older callback требует своего установленного контракта. User JWT может заменить elevated request identity; это распространено на root и security-privileges.
- RLS: PostgreSQL >=15 для invoker views; alternatives не образуют cumulative public policy; Storage SELECT пример включает listing, а read-only контракт требует operation-aware control.
- Realtime: policy cache переоценивается при subscription/new JWT; DELETE RLS и filter/payload нельзя закрыть INSERT/UPDATE проверкой.
- Edge: rolling official contract на 2026-09-09 различает gateway migration compatibility и handler authentication; opaque key pass не доказывает user identity.

## Correction of baseline interpretation

`technical-supabase.json` baseline verification для Realtime утверждает «DELETE not filterable» и «old full payload still restricted to PK under RLS». Его **собственный неизменный** snapshot `official-hono-supabase/supabase-realtime-postgres-changes.txt:3624` разрешает фильтрацию DELETE при `replica identity full`; `:3442` отдельно сообщает невозможность RLS-проверки доступа к удалённой записи. PK-only утверждение не найдено в этом snapshot и не перенесено в active instructions.

Источник: https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/realtime/postgres-changes.mdx ; retrievedAt `2026-09-09T11:35:40.432347+00:00`, SHA-256 `c3928e6c7371f67dd911e202bcfe8e8891ef53613d13085fce83e2447edb8bf5`. Актуальная официальная web page повторно открыта; **source-only**, не доказательство возможностей установленного Realtime. В candidate map baseline трактовка сохранена как историческое поле, актуальная disposition исправлена. Универсальный default либо runtime guarantee не заявлен.

Paired criteria не изменялись. Если прежняя Realtime trial проверяла только INSERT, новые claims требуют отдельного симметричного baseline/candidate случая: installed stack, accepted replica identity, allowed/denied subscribers, DELETE filter/payload и reconnect/new-JWT policy transition. Для SSR проверка должна сохранить заданную версию; если callbacks повторяются, проверить сохранение cache headers со всеми cookies. Версию >=0.10 или older branch нельзя незаметно подставлять в существующий fixture. Необходимость нового runtime case определяет координатор по текущему protocol; автор runtime не запускал.

## Evidence limits

Карты сохраняют каждую baseline coverage row и исходное заключение, добавляют актуальные locators/hashes, changed/unchanged status, source disposition и falsifier. Неизменность файла подтверждает перенос прежней source comparison, а не новый runtime PASS. Все источники hashed; загруженный источник не объявляется автоматически технически проверенным. Новые/изменённые утверждения сопоставлены с конкретными official sections и exact version snapshots; user/project authority rules обозначены отдельно от vendor facts.

Координатор сообщил compiler/isolated parity H22/S21, quick_validate обоих exit0 и Hono docs-contract 18/18 до дополнительных правок. Это атрибутированное прежнее свидетельство; ниже будут отдельно записаны текущие авторские структурные проверки. Повторный Hono docs-contract и общие candidate runtime/CI gates остаются у координатора.

## Текущие структурные проверки

После дополнительных source-правок публичный bundled compiler выполнил `lint`, `regenerate`, `check`, `compile --out-dir /tmp/author-hs-map-20260909-compiled` для обоих пакетов и `check` каждой isolated копии — все exit 0. Системный skill-creator `quick_validate.py` для обоих — exit 0 / Skill is valid. App/runtime/install либо package docs-contract в этом авторском проходе не запускались.

Byte readback **24 файла Hono и 24 Supabase** совпали между target и isolated output; compiler report исключён из equality из-за режима/пути. Этот счёт включает supporting output, поэтому отличается от прежних active-only H22/S21 координатора. Все current section locators валидны и покрывают полный набор baseline rows: H **87 → 88** (новая adapter compatibility section), S **110 → 110** (переименованные/расширенные разделы имеют несколько current locators). Сняты hashes всех 42/32 файлов; неизменны 33/15, изменены 9/17 относительно baseline. Checked source catalog: H44 / S69, каждый referenced snapshot hash совпал; пересечение каталогов не является дополнительными независимыми источниками.

- Hono source hash `d427501f938a7e07c41247a3aa22180ce93fcf3b78098ac29ebd7d3a23d75d00`; full file-map aggregate `cbd6165787efb885fb01683f1101f771dbeaf845cbf391f5651352d1a0b3a415`.
- Supabase source hash `48134d5279ab302ba7972ca7253ff7b2a60b6826b290d450d9d729445855e2d2`; full file-map aggregate `e196c461006edce9ddeaef1b3a80f3686921cd03524525a525544f73a7dcbe50`.

Результат: author source/readback ready для candidate freeze. Все baseline necessaryChange получили явную source disposition в `candidate-technical-hono.json` и `candidate-technical-supabase.json`; framework/API assertions не получили blanket PASS. Runtime falsifiers и независимые verdict остаются открытыми за координатором. Проверка локальной переносимости сохранила разрешённый Edge runtime `/tmp` как platform API, не machine-local dependency. Первая авторская scan-regex ошибочно приняла фразу status/code/message за абсолютный путь; после ограничения начала пути повторная проверка прошла, пакет ради ложного совпадения не менялся. Повторные Hono docs-contract и общий test:ci нужны координатору на новом snapshot.
