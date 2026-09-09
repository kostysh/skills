# Авторская доработка Payload и Payload Migration

Готовность перед генерацией: **ready-to-regenerate**. Generated outputs обновлены; compiler-проверки и изолированный readback завершены. Это author self-check, не независимый PASS и не завершение общего плана.

## Авторский Audit instruction quality

- Consumer/outcome: агент внедрения Payload и владелец мигрируемого приложения; разрешённая реализация/import/recovery/reconciliation отделены от schema/script artifacts.
- Authority/scope: FRAMEWORKS-20260909-v1, только два назначенных пакета и supporting evidence. Повторные согласования принятой модели/enum/target/import удалены; analysis-only и production/destructive boundaries сохранены.
- Canonical decisions: root задаёт outcome/authority/version/navigation, профильные references — API и условные механизмы. Противоречия Local API/access, create Where, field args, transaction prerequisites, planning-only migration устранены в source и примерах.
- Retrieval/portability: прежние 11+1 references сохранены, loading triggers соответствуют задачам; отсутствует обязательная зависимость от repository history. Общий журнал связан только из supporting docs.
- Side effects/fallback: разрешённое исполнение продолжается; отсутствующие версия/сервис/owner decision ограничивают зависимую часть. Существующий v2 не обновляется автоматически. System bypass отделён от caller access; сторонние эффекты не названы DB-атомарными.
- Проверки: compiler проверяет структуру/генерацию/достижимость/переносимость. TypeScript snippets остаются интеграционными фрагментами с declared host prerequisites; новый app/runtime trial автором не запускался.

## Команды и isolated readback

Public CLI: `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs`, help сообщает v0.2.5. Для payload уже выполнены lint, regenerate, source check, isolated compile и isolated check — exit0; stdout соответственно `OK skills/payload`, `Regenerated .../skills/payload`, `OK skills/payload`, `Compiled skills/payload -> /tmp/payload-author-compile-w2flkofl/payload`, `OK /tmp/payload-author-compile-w2flkofl/payload`.

```json
{
  "outputRoot": "/tmp/payload-author-compile-w2flkofl",
  "migrationCommands": [
    {
      "command": [
        "node",
        "skills/skill-source-compiler/scripts/skill-source-compiler.mjs",
        "lint",
        "skills/payload-migration"
      ],
      "exitCode": 0,
      "stdout": "OK skills/payload-migration\n",
      "stderr": ""
    },
    {
      "command": [
        "node",
        "skills/skill-source-compiler/scripts/skill-source-compiler.mjs",
        "regenerate",
        "skills/payload-migration"
      ],
      "exitCode": 0,
      "stdout": "Regenerated /home/kostysh/.codex/skills/custom/.worktrees/framework-platforms/skills/payload-migration\n",
      "stderr": ""
    },
    {
      "command": [
        "node",
        "skills/skill-source-compiler/scripts/skill-source-compiler.mjs",
        "check",
        "skills/payload-migration"
      ],
      "exitCode": 0,
      "stdout": "OK skills/payload-migration\n",
      "stderr": ""
    },
    {
      "command": [
        "node",
        "skills/skill-source-compiler/scripts/skill-source-compiler.mjs",
        "compile",
        "skills/payload-migration",
        "--out-dir",
        "/tmp/payload-author-compile-w2flkofl"
      ],
      "exitCode": 0,
      "stdout": "Compiled skills/payload-migration -> /tmp/payload-author-compile-w2flkofl/payload-migration\n",
      "stderr": ""
    },
    {
      "command": [
        "node",
        "skills/skill-source-compiler/scripts/skill-source-compiler.mjs",
        "check",
        "/tmp/payload-author-compile-w2flkofl/payload-migration"
      ],
      "exitCode": 0,
      "stdout": "OK /tmp/payload-author-compile-w2flkofl/payload-migration\n",
      "stderr": ""
    }
  ],
  "comparisons": [
    {
      "skill": "payload",
      "file": "SKILL.md",
      "equal": true,
      "sha256": "9a02717763b328222f840d34f3096ed54f115a3ea6f8a430f3a96f89dc3827b4"
    },
    {
      "skill": "payload",
      "file": "agents/openai.yaml",
      "equal": true,
      "sha256": "2dd7d1903a7b294cdf577504078c63216d8533e36b386fb9426688ac61292c35"
    },
    {
      "skill": "payload",
      "file": "references/queries.md",
      "equal": true,
      "sha256": "0109a26afc5eded0166888e0002f11f348ffa8efbf0dbe096a77537dfe8b10fb"
    },
    {
      "skill": "payload",
      "file": "references/plugin-development.md",
      "equal": true,
      "sha256": "b29172167b1662b31a75489f72eeeb9635f6c20822b2a034fb70c5e5f3d0b7ec"
    },
    {
      "skill": "payload",
      "file": "references/hooks.md",
      "equal": true,
      "sha256": "526ae0c7ec2e1f70807b9133de3e00bab78ec7fb6156af6a96081322dec71b25"
    },
    {
      "skill": "payload",
      "file": "references/fields.md",
      "equal": true,
      "sha256": "a4249573ad5572f30ac4289cc7d63dbdd177bdb30f0c7d9eb1b136c90a25b669"
    },
    {
      "skill": "payload",
      "file": "references/field-type-guards.md",
      "equal": true,
      "sha256": "be25a1e4334ef1f40d95ddd572a7c4e977e73b184e7951bcf82af928dd002b45"
    },
    {
      "skill": "payload",
      "file": "references/endpoints.md",
      "equal": true,
      "sha256": "3eee32261c705391d3c9df2bfccd57939e16a82446562f5b812ae7ca9347b890"
    },
    {
      "skill": "payload",
      "file": "references/collections.md",
      "equal": true,
      "sha256": "a4128d09fdc6c6499956f1dc9f0b67fb366fe4b4b5657cd2030c429b770c3c7d"
    },
    {
      "skill": "payload",
      "file": "references/advanced.md",
      "equal": true,
      "sha256": "1619912f22f8c144a9ff13b06b3af3347d0f36b85da44f1bf644d5f3614853d2"
    },
    {
      "skill": "payload",
      "file": "references/adapters.md",
      "equal": true,
      "sha256": "3e9937a6632eb3d181581b1b28454b4ca4860019e25d516d65c85c870fe1abae"
    },
    {
      "skill": "payload",
      "file": "references/access-control-advanced.md",
      "equal": true,
      "sha256": "5f7e78ce95b774a6efd6ba5374004f0061d4e24818d15fae234488e94200b9c0"
    },
    {
      "skill": "payload",
      "file": "references/access-control.md",
      "equal": true,
      "sha256": "e028a3a209ec0745445df296da3652afce8b984506b814b60c4526c67d010b66"
    },
    {
      "skill": "payload",
      "file": "docs/README.md",
      "equal": true,
      "sha256": "f23913b5c511527b73b9c76d8a0697830607e2bcfd188a2dfba81ce14d3b12bb"
    },
    {
      "skill": "payload",
      "file": "docs/logs/implementation-log-20260509-1.md",
      "equal": true,
      "sha256": "9825ffcb9f7fe1589794769ff5b698f7f6660abb8639449520a354b161dd660b"
    },
    {
      "skill": "payload-migration",
      "file": "SKILL.md",
      "equal": true,
      "sha256": "2cb708e09561aca3353b144403ba2e961f2181d094439693ad957fb0a9390a6e"
    },
    {
      "skill": "payload-migration",
      "file": "agents/openai.yaml",
      "equal": true,
      "sha256": "e1db640a3706e0d13e8250aa4f9a3930c72104fb5dbf4760672d395e5325b0b4"
    },
    {
      "skill": "payload-migration",
      "file": "references/payload-field-reference.md",
      "equal": true,
      "sha256": "d6dbd6fbf642f48ce157470810efb31e53b88347ccd8ba72cd0c3f930248ebf6"
    },
    {
      "skill": "payload-migration",
      "file": "docs/README.md",
      "equal": true,
      "sha256": "107c268b263a4b48c34620e505fbaa4fbb6f39dba512db816f25b0293deb7fe8"
    },
    {
      "skill": "payload-migration",
      "file": "docs/logs/implementation-log-20260509-1.md",
      "equal": true,
      "sha256": "359ada1957ce87b19745fa00cabcbbf3967ebdbfdc7f092d53e21b2f74b2094f"
    },
    {
      "skill": "payload-migration",
      "file": "docs/logs/implementation-log-20260715-1.md",
      "equal": true,
      "sha256": "f0032de8cf410357d20228aefd726a4b2865d6a28ee49a8ef4d338c865556596"
    }
  ]
}
```

## Supplemental validator compatibility limit

`quick_validate.py` не прошёл: baseline и candidate обоих пакетов содержат `compatibility`, но system validator разрешает только allowed-tools/description/license/metadata/name. Это одинаковый pre-existing schema mismatch, не regression candidate. Декларация `compatibility` поддерживается owning compiler schema (`skills/skill-source-compiler/src/schema.ts:109,147`, CLI v0.2.5) и существующими source bundles. По указанию root поле сохранено. **quick_validate PASS не заявляется**; независимый reviewer должен учесть этот предел.

```json
[
  {
    "skill": "payload",
    "surface": "baseline-packages",
    "command": [
      "python",
      "/home/kostysh/.codex/skills/.system/skill-creator/scripts/quick_validate.py",
      "docs/reviews/framework-platforms-20260909/baseline-packages/payload"
    ],
    "exitCode": 1,
    "stdout": "Unexpected key(s) in SKILL.md frontmatter: compatibility. Allowed properties are: allowed-tools, description, license, metadata, name\n",
    "stderr": ""
  },
  {
    "skill": "payload",
    "surface": "candidate",
    "command": [
      "python",
      "/home/kostysh/.codex/skills/.system/skill-creator/scripts/quick_validate.py",
      "skills/payload"
    ],
    "exitCode": 1,
    "stdout": "Unexpected key(s) in SKILL.md frontmatter: compatibility. Allowed properties are: allowed-tools, description, license, metadata, name\n",
    "stderr": ""
  },
  {
    "skill": "payload-migration",
    "surface": "baseline-packages",
    "command": [
      "python",
      "/home/kostysh/.codex/skills/.system/skill-creator/scripts/quick_validate.py",
      "docs/reviews/framework-platforms-20260909/baseline-packages/payload-migration"
    ],
    "exitCode": 1,
    "stdout": "Unexpected key(s) in SKILL.md frontmatter: compatibility. Allowed properties are: allowed-tools, description, license, metadata, name\n",
    "stderr": ""
  },
  {
    "skill": "payload-migration",
    "surface": "candidate",
    "command": [
      "python",
      "/home/kostysh/.codex/skills/.system/skill-creator/scripts/quick_validate.py",
      "skills/payload-migration"
    ],
    "exitCode": 1,
    "stdout": "Unexpected key(s) in SKILL.md frontmatter: compatibility. Allowed properties are: allowed-tools, description, license, metadata, name\n",
    "stderr": ""
  }
]
```

## Исправления и исходные failure paths

Source versions: `payload 0.1.1`, `payload-migration 0.1.2`. Следующая матрица фиксирует авторское исправление, а не закрытие independent finding. Current locators и SHA256 находятся в `technical-payload-candidate.json` и `technical-payload-migration-candidate.json`; baseline maps и отчёты сохранены без изменений.

| Finding | Исправление в canonical source и emitted reference | Требуемая независимая проверка |
| --- | --- | --- |
| P-B01 | Caller endpoints/search/upload/preview и rate-limit examples передают req и `overrideAccess:false`; смысл используемого helper/result обозначен. | Сопоставить REST/custom endpoint anonymous/A/B/admin. |
| P-B02 | Create возвращает boolean; tenant обычного пользователя задаёт сервер и не допускает подмены при update; explicit superadmin branch сохранён. | Create/update чужого tenant. |
| P-B03 | Все role examples защищают create и update; bootstrap policy отделена. | Создание admin и self-promotion обычным actor. |
| P-B04 | Plugin composition ждёт original callback, сохраняет false, сужает true/Where; static/async filter contract сохранён. | false/true/Where/Promise callbacks и реальный отказ API. |
| P-B05 | `totalDocs`, доступный req, `req.context`, cache presence, operation matrix и порядок фаз согласованы. | Typecheck/callback invocation и count/delete failure path. |
| P-B06 | Access bypass отделён от req/transaction; SQLite требует opt-in, null transaction id проверяется, nested writes используют req. | Injected failure и чтение БД после rollback; default SQLite не считать атомарным. |
| P-B07 | R2 binding, exported auth types и workflow handler `inlineTask`; queue/run/completion разделены. | Exact installed exports, workflow и provider-bound readback где применимо. |
| P-B08 | Near tuple, experimental boundary, встроенная text validation, shallow merge warning, exported guard types и recursive traversal. | Typecheck и callback/field behavior. |
| P-B09 | Current collection/plugin slots, `baseFilter`, `admin.custom`, root providers, server view props и field path; seedKey, полный обход children с req. | UI/seed/rerun и набор children больше страницы. |
| P-B10 | Stable 3.88.0/canary разделены, existing v2 сохраняется, exact same-version peers; example package объявлен fragment, не complete fixture. Vitest использует one-shot run. | Совместимый установленный fixture и packed consumer. |
| P-B11 | Search collection, redirects consumption, live-preview frontend и migration ownership описывают действительные границы. | HTTP/browser readback для заявленного результата. |
| M-B01 | Migration владеет разрешёнными implementation/import/recovery/rerun/reconciliation и использует уже принятые model/enum/authority. | Authorized import выполняется; missing/conflict и production boundary сохраняются. |
| M-B02 | Durable namespace+source ID/unique identity, recovery после записи до checkpoint, full sets/counts/duplicates/relations/locales/media/nodes и partial ledger. | Crash/media503/restart/rerun, полная независимая сверка. |
| M-B03 | Pseudo universal schemas заменены exported Payload types, JSON wrapper/current upload APIs исправлены, v2 branch explicit. | Installed-type fixture. |
| M-B04 | Role create/update guards совпадают с Payload invariant. | Privilege escalation negative cases. |
| M-B05 | WP REST/DB/status/time, Contentful links/locales, Strapi5 documentId/Markdown/blocks и Sanity refs/PortableText разделены по форме источника. | Реальные fixtures форматов и semantic comparison. |
| M-B06 | Durable media IDs до rich-text conversion, editor nodes/internal links, unknown nodes как partial и locale readback без fallback. | Rendering и полная semantic reconciliation. |

## Источники и пределы

Candidate maps сохраняют все 36+14 технических аспектов, source/generated file inventory, current section/code/inline-token inventory и baseline outcomes. Для каждой ссылки указан archived official source с hash, exact release tag record либо author web readback. Архив baseline включает полные docs, exact `v3.88.0` типы/код и release feed; author сделал целевые сравнения исправляемых механизмов. Отдельное полное повторное исполнение каждого retained example не проводилось. Свежий web readback Contentful/ACF/Date/Vitest/Playwright дополняет архив и не превращается в runtime evidence.

Source inventory означает полноту учёта поверхности, а не доказательство корректности каждой строки. Значения `source-corrected-runtime-pending` и `retained-unverified` намеренно не являются PASS. Интеграционные TypeScript примеры требуют объявленных host imports/config/collections; автор не заявляет готовый устанавливаемый application fixture. Baseline runtime доказательства root, включая default SQLite partial write, отсутствующий `job.runInlineTask` и неполную самостоятельную migration verifier, остаются исходными failure paths; successful opt-in transaction/data subset не закрывает их автоматически.

Автор не запускал app/runtime/browser/provider trials, heavy builds, независимый review, publication или commit. Следующий владелец — root: freeze candidate, одинаковые baseline/candidate falsifiers, independent assessment и итоговая фиксация evidence limits в общем журнале. Источники обоих пакетов заморожены для root; после уведомления менялись только этот отчёт и candidate maps.
