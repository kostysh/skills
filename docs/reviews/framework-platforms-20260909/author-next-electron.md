# Авторская доработка Next.js и Electron

**Авторская работа завершена; это не независимый PASS и не candidate runtime evidence.** В рамках принятого `FRAMEWORKS-20260909-v1` изменены только `skills/nextjs`, `skills/electron-engineer` и этот supporting-пакет evidence. Авторское состояние перед генерацией: **ready-to-regenerate**; генерация выполнена. Проверки выполнения и независимая оценка остаются у координатора.

Потребитель — агент, решающий Next.js/Electron задачу в существующем проекте. Результат этой части — исправленная source/emitted инструкция с сохранёнными установленными версиями, полномочиями и границами ответственности. Scope delta: unchanged. Unauthorized additions: none. Не выполнялись install, build приложений, runtime trials, Git публикация или изменения соседних скиллов.

## Снимки и источник

База: `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`; сохранены [Next baseline](baseline-nextjs-review.md), [Electron baseline](baseline-electron-review.md), обе исходные technical maps, official registry и baseline N/E runtime/legacy assessments. Положительные baseline trials не отменяют source FAIL и не являются candidate evidence.

| Пакет | Версия | Candidate aggregate SHA256 |
|---|---|---|
| nextjs | 0.1.1 → 0.1.2 | `9dc26435dfe2eceaed3513ef39c2bdb9590658d5b16c034a222e647cd72ec989` |
| electron-engineer | 0.1.10 → 0.1.11 | `6ce35392a42da5839ab24be4976ace72d3acc0d2b018b3a21c4e0f87738a5c10` |

Алгоритм aggregate: SHA256 UTF-8 JSON sorted relative-file→SHA256 mapping, `sort_keys=True,separators=(',',':')`. Все файлы и текущие section/whole-file locators — в [candidate Next technical map](candidate-technical-nextjs.json) и [candidate Electron technical map](candidate-technical-electron.json). Карты сохраняют все 29/23 аспекта, официальные версии/channel/URL и исходные retrieval timestamps. Хеши всех указанных official snapshot files повторно совпали с registry; новая дата загрузки не выдумана. Whole-file ranges служат областью поиска, а не утверждением выполнения каждой строки.

## Remediation и авторское доказательство

Во всех строках ниже статус **verified в границе source correction/readback**: исходная неверная инструкция устранена, её непосредственные реплики проверены. Полная поведенческая closure этих findings требует coordinator candidate trials и reviewer; она здесь не присваивается.

| Finding | Причина → исправление и direct blast radius | Проверка / оставшийся falsifier |
|---|---|---|
| N-F1 | Actions названы internal-only; mutation examples без authority. Data Patterns, Directives, Route Handlers и Error Handling теперь требуют authentication, runtime input validation и ownership внутри операции; примеры используют app-owned contracts, atomic owner-filter delete; из helper response убран raw token. | Source/readback; real direct POST guest/wrong-owner deny и mutation→reload у координатора. |
| N-F2 | Redis/S3 get/set без invalidation выдавали shared solution. Неполные handlers удалены; Self Hosting различает cacheHandler/cacheHandlers и требует writer→cached reader invalidation/failure evidence. | Source/readback; distributed runtime freshness не проверена автором. |
| N-F3 | JSON-only запрещал React-supported Date/Map/Set. Root/RSC примеры сохраняют типы и методы; ordinary function/class остаются invalid. | Source/readback; positive/negative RSC runtime у координатора. |
| N-F4 | proxyConfig и metadata signatures расходились с Next16. Export config, Node Proxy и точечный authorized codemod; async viewport/image/sitemap id, sync generateImageMetadata input сохранён; updateTag/max/legacy semantics разделены. | Source/readback по N03/N05/N10/N21; exact installed API/build probes не запускались. |
| N-F5 | Неверный bundler default и browser wrapper, blanket Suspense, URL debug paths. Next16 default/Next15 branch, client dynamic entry, SSR-safe wrapper restriction, dependency-specific externalization/transpilation, production static Suspense failure и filesystem debug paths. | Source/readback; production import/build/browser и CLI probes у координатора. |
| N-F6 | Experimental/deprecated API как production default. Auth interrupts/unstable_rethrow/worker явно ограничены; redirect outside catch; Next16 Image preload/older priority; null slot close/back-history контракт и direct-entry fallback. | Source/readback; partial-evidence/catalog и API cases остаются открыты. |
| E-F1 | make/publish cascades пересоздавали проверенный artifact. Build Process владеет source build → publish dry-run preparation → signing/freeze/hash → exact artifact smoke → authorized from-dry-run; package scripts не добавляют prebuild в promotion. Packaging/CI повторения согласованы. | Source/readback против Forge CLI/lifecycle; real saved-state/no-upload/artifact promotion probe у координатора. |
| E-F2 | Смешаны pre-ready privileges и обычные protocol handlers. Architecture ограничивает ранний вызов registerSchemesAsPrivileged; session.protocol.handle после ready и в partition окна. | Source/readback; startup, traversal-deny и packaged assets у координатора. |
| E-F3 | pnpm/Forge layout не задан. Project-local node-linker=hoisted и проверка package dependency layout; без глобальной настройки и незапрошенной смены toolchain. | Source/readback; package/native probe у координатора. |
| E-F4 | Generic permissions скрывали check/request split. Security, Native/Testing и review reminders требуют обе ветви, nullable identity/subframe origin и ограничение display-capture по feature. | Source/readback; реальные check/request deny и frame limits остаются runtime evidence. |

Дополнительно обработаны все `correction-required` аспекты исходных карт: renderable fetch data/Node OG, Edge limits, useLinkStatus, font preload subsets/Tailwind3–4/build network, JSON-LD и @next/third-parties scope, поддерживаемый Node для нового Docker, отдельные OpenNext adapters; Electron installed/host/bundled versions, details.url deprecated positional branch, async safeStorage/clipboard, OS limits и experimental isolated builds. Проверенная SWC decorators ветка сохранена. Старые работоспособные Next15 и Electron43/electron-vite4 пути не превращены в обязательный upgrade.

## Audit instruction quality

Авторская проверка по `skill-source-compiler`/authoring-guidelines выполнена до генерации и повторена при readback:

- Outcome, actor, минимальные версии/config/target inputs, output и evidence limits различены; review/diagnosis не разрешают remediation или upload.
- Нормативные решения имеют владельца: RSC transport — RSC reference, invalidation — Data/Self Hosting, Forge immutable flow — Build Process, permission pair — Security reference. Напоминания ссылаются на владельца.
- Next provider edge передаёт actor/version/data operation в Supabase/Payload owner и потребляет Auth/RLS/access/transaction contract; Next сохраняет cookies/actions/cache/rendering. Electron separates React SPA и reusable components; IPC/native/package остаются Electron.
- Недоступный specialist/current fact ограничивает зависимый вывод; самостоятельная разрешённая работа продолжается. Пакеты не требуют внешнего локального файла для метода.
- Electron references переклассифицированы из optional в required-with-trigger: root уже предписывал читать соответствующую reference; теперь schema и emitted loading совпадают. Нет новой обязанности читать все references.
- UI metadata проверено; Electron short description сокращён до допустимой длины без расширения routing. Автоматическое использование не отключалось.
- Pipeline оставлен последовательным там, где изменение artifact разрушает evidence; отдельный runtime, метрики и универсальные новые инструменты не добавлены.

## Фактические проверки

Public entry `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs`:

- `lint skills/nextjs` и `lint skills/electron-engineer` — OK.
- `regenerate` обоих source bundles — выполнено; generated `SKILL.md` и compile-report прочитаны отдельно от source.
- `check` обоих source bundles — OK.
- `compile <skill> --out-dir /tmp/framework-author-next-electron-final-20260909` и `check` обоих изолированных пакетов — OK.
- Byte-for-byte parity всех emitted files кроме compile-report (в нём source/output context): Next 25 файлов, Electron 15 файлов совпали.
- System skill-creator `quick_validate.py` для обоих — `Skill is valid!`.
- `git diff --check -- skills/nextjs skills/electron-engineer` — clean.
- Поиск старых failure strings во всех active surfaces — нет совпадений (rg exit1 означает отсутствие совпадений).

Это structural/source evidence; не доказательство runtime, natural selection, producer/consumer handoff или всей ОС-матрицы. `pnpm test:ci`, app/API probes, blind candidate cases и independent skill-reviewer выполняются координатором. Общий implementation log не изменялся автором; обе `docs/README.md` ссылаются на него как repository-only supporting запись.
