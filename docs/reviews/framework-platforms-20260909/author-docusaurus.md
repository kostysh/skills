# Авторская доработка docusaurus-repo 0.1.3

Авторский Audit instruction quality: **ready-to-regenerate**. Это author self-check, не независимый PASS и не runtime-вердикт. Основание — принятый FRAMEWORKS-20260909-v1, baseline source-review и D1–D6 assessments. База d89d66f2c99bf8b9e84e5b4def54fa60192856a5 / source-version 0.1.2; baseline evidence сохранено. Меняется только целевой пакет и два авторских supporting-отчёта; общий журнал принадлежит координатору.

## Результат и самооценка инструкций

Потребитель — исполнитель задач сопровождения сайта. Цель — корректные version-matched решения, preview/quality templates и site→documentation handoff с честной границей свидетельств. Минимальные входы, полномочия, существующие pins/scripts, conditional loading и результат/пределы теперь названы в root source. Read-only и недоступные проверки не запускают незапрошенный runtime; compatible legacy tooling сохраняется. Специализированные Diataxis/reader-validation и visual decisions остаются у documentation/frontend-design, отсутствующий сосед не блокирует независимую локальную работу.

Сверены все 7 активных references, manifest, fragment, metadata и 5 assets; generated root будет прочитан после регенерации. Сохранены корректные theme-live-codeblock в plugins, markdownlint gitignore string и Actions v4: newer major не делает их дефектом. Нового runtime/CLI/сервиса/политики публикации нет. Уточнения происходят из принятого scope и D01–D20 source comparison, а не из предположений о будущем. Порядок реализации сокращён до условий решений; обязательные bootstrap gates отделены от established-project tasks. Supporting docs не стали активными зависимостями.

## Матрица исправлений и граница закрытия

| ID | Исходный путь / прямой охват | Исправление / авторское свидетельство | Статус |
| --- | --- | --- | --- |
| D-F1 / D03 | pnpm separator трактуется как positional siteDir; overview, bootstrap, deployment, search, AGENTS, generated root | flags передаются непосредственно; build→serve проверяет тот же output; источник CLI/pnpm и readback всех повторов | verified на уровне source/readback; D1 runtime у координатора |
| D-F2 / D01,D18 | Node20 template несовместим с mandatory latest linter >=22 | новый CI default24, общий engine intersection; compatible legacy pins сохранены, конфликт требует только зависимого решения | verified на уровне engines/template; CI commands у координатора |
| D-F3 / D17 | фиксированные globs пропускают custom/instance roots | **/*.md + явные generated exclusions/проверка фактических roots и negative probes | verified на уровне конфигурации/readback; D3 linter runtime у координатора |
| D05,D14,D15,D19 | format/defaults, ошибочное move, неполные translation paths, stable vs future | MDX parser/SSR, copy snapshot, named/current/versioned/React JSON paths, faster rename/channel | verified по version-matched sources/readback; runtime D1/D4/D5 у координатора |
| D09–D12,D13 | search config и local preview способны завысить claim | реальные query/click/reload и canonical readback отделены от config/build, dated plugin pairs и production-only local search | verified как instruction/source correction; внешние сервисы не проверялись |
| D20 | имена соседей без usable handoff, universal build/start | task mode; передаваемые source/files/versions/route/snapshot и reader evidence, missing-owner continuation | verified author inspection; независимые D2/D6 и catalog у координатора |

Термин verified в таблице относится только к названному source/readback свидетельству. Полное runtime/behavioral закрытие не заявляется; запрет тяжёлых проверок в авторском задании сохраняет эти выводы за координатором. Остальные D02,D04,D06–D08,D16 сохранены с точечным уточнением примеров/связей без смены API. Детальная карта всех D01–D20 и hashes: technical-docusaurus-candidate.json.

## Источники и пределы

Использованы baseline-docusaurus-review.md, technical-docusaurus.json с official source registry и raw snapshots; baseline D-runtime/docs/legacy/partial assessments сохраняют свои отдельные verdict/telemetry limits. Автор повторно проверил CLI, 3.10 release, i18n и markdownlint engine по официальным веб-страницам; source snapshots дали version/channel и plugin matrices. Это source comparison, не запуск Docusaurus. Соседи documentation 0.2.1 и frontend-design 0.2.2 прочитаны для прямого контракта, не изменены.

Команды структурной проверки и окончательные hashes будут записаны ниже после генерации. Никаких install/build/browser/app runtime, агентов, Git publication либо изменения соседей автор не выполняет.

## Выполненные проверки

Все команды ниже завершились exit 0 из worktree root; использован публичный bundled `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs` (без install/build):

- `--help` — подтверждён shipped CLI contract.
- `lint skills/docusaurus-repo` — source schema/links.
- `regenerate skills/docusaurus-repo` — source→generated root/report.
- `check skills/docusaurus-repo` — generated drift/links/portability.
- `compile skills/docusaurus-repo --out-dir /tmp/author-docusaurus-20260909-compiled` и `check /tmp/author-docusaurus-20260909-compiled/docusaurus-repo` — независимая директория упаковки.
- `python .../skill-creator/scripts/quick_validate.py skills/docusaurus-repo` — Skill is valid.
- `git diff --check -- skills/docusaurus-repo` — без whitespace errors.

Авторский readback: **20** файлов target, **20** аспектов D01–D20, **16** файлов isolated output побайтно равны соответствующим source/package файлам (compile-report исключён из equality: описывает другой режим/путь). Все official snapshot hashes из baseline technical map совпали. Проверено отсутствие старого serve separator и абсолютных локальных зависимостей на активной поверхности; Node24 template сопоставлен с официальным engine markdownlint-cli2 >=22. Проверка glob здесь — чтение конфигурации, не исполнение markdownlint. Direct-owner SKILL hashes documentation/frontend-design совпали с frozen readback.

Source hash: `1d8b29e9b300301edc768d149717c9125eb7d142c51090fd64ebad44b558b3df`.
Полный file-map aggregate SHA-256: `8ce1dfb10ed6f94768687b351b9a0cf1a4a4f94c64a57f0747ac2e9810c65e75` (sorted compact JSON file→SHA-256).

Передача координатору: пакет готов к замораживанию candidate и независимой проверке. Требуются согласованные candidate trials, CLI/quality/runtime closure, catalog-selection и общий `pnpm test:ci`; авторские структурные результаты их не заменяют. Коммит/публикация не выполнялись.


## Coordinator correction D-F4

Реальный candidate trial обнаружил ошибку frontMatter override. RCA: D-frontmatter-coordinator-RCA.json. Удалён только ненужный ключ; сохранён default parser. Compiler regenerate/check и новый isolated compile/check/parity выполнены; исправленный runtime ещё не подтверждён. Исходный candidate package/map сохранён в candidate-snapshots; D-runtime продолжает именно с первоначальным staged input. Новый aggregate: `e08574f3b295b760c4b50c4c4e408af8d3977586ef4b7f09afba6521909cb83d`. Исходные source assertions о работоспособности шаблона этой находкой опровергнуты; schema support не был доказательством regex. Требуется bounded независимая оценка и точный positive/negative CLI retest.

Direct blast radius readback: строка doc-quality reference про configures frontMatter заменена на default recognition и проверку installed CLI. Final D-F4 source aggregate `e1c15b458584d81f26344e8876db7ad306cc9325f60d35648a892a33abca7dc8`; isolated parity16files. Official CLI0.20.0 и0.23.2 обе используют флаг u; exact-source manifest D-frontmatter-official-source.json. Предыдущий aggregate выше — промежуточный asset-only, не итоговый.
