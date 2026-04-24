# Миграция legacy репозитория на `unified-dossier-engineer`

## Назначение

Это **одноразовая ручная инструкция** для миграции legacy репозитория со split-моделью

- `docs/backlog/*`
- `docs/features/*`
- legacy `.dossier/*`

на canonical unified-модель:

- `.dossier/*` — учетные и process артефакты
- `docs/ssot/*` — project-facing SSOT

Пример legacy layout: `<repo-root>`.

Важно:

- у нового skill-а **нет** поддержки legacy;
- у нового runtime **нет** migration tooling;
- миграция должна завершиться canonical layout-ом без legacy хвостов.

## Обязательные правила безопасности

### 1. Перед началом создай отдельную migration branch

Миграцию нельзя выполнять в `main` или в рабочей feature-ветке.

Минимально безопасная последовательность такая:

1. привести текущее дерево к чистому baseline;
2. если есть незакоммиченные изменения, которые нужно сохранить, сделать checkpoint commit;
3. создать отдельную ветку миграции;
4. выполнять миграцию только в ней.

Рекомендуемая последовательность:

```bash
git status --short
git add -A
git commit -m "chore: checkpoint before unified-dossier-engineer migration"
git checkout -b refactor/unified-dossier-migration
```

Если рабочее дерево нельзя безопасно закоммитить, миграцию не начинай.

Если checkpoint commit не нужен, все равно создай отдельную migration branch:

```bash
git status --short
git checkout -b refactor/unified-dossier-migration
```

### 2. Не делай частичную миграцию

Запрещено оставлять одновременно:

- `docs/features/*` и `docs/ssot/features/*`
- `docs/backlog/*` и `.dossier/backlog/*`
- legacy feature-grouped `.dossier/logs/F-*` и canonical stage-grouped `.dossier/logs/<stage>/*`

### 3. Не пытайся переносить legacy machine history

Legacy machine-generated history не является частью canonical runtime surface.

Не переносить:

- `.dossier/logs/F-*`
- `.dossier/reviews/F-*`
- `.dossier/steps/F-*`
- `.dossier/drift/*`
- `.dossier/evidence/*`
- `.dossier/retro/*`

История остается доступной через git в checkpoint commit.

## Лог миграции

Веди migration log с первого шага.

Путь:

```text
.dossier/ops/migration-log-<YYYYMMDD-HHMM>.md
```

Минимум, что нужно записывать:

1. timestamp начала;
2. baseline branch;
3. migration branch;
4. SHA checkpoint commit, если он был нужен;
5. какие legacy paths удалялись;
6. какие пути были перемещены;
7. какие JSON были переписаны;
8. результаты валидации;
9. timestamp завершения;
10. SHA финального migration commit.

Минимальный шаблон:

```md
# Migration log

- started_at: 2026-04-21T16:00:00+02:00
- baseline_branch: main
- migration_branch: refactor/unified-dossier-migration
- checkpoint_commit: <sha>
- repo: <path>

## Steps

- scaffold prepared
- backlog truth moved
- feature dossiers moved
- sources.json paths rewritten
- applied.json canonical_path rewritten
- legacy machine history removed

## Validation

- dossier-engineer status: PASS
- dossier-engineer list-sources: PASS
- dossier-engineer sync-index: PASS
- dossier-engineer index-refresh: PASS
- dossier-engineer lint-dossiers --update-index: PASS

- finished_at: 2026-04-21T16:40:00+02:00
- final_commit: <sha>
```

## Канонический target

После миграции в репозитории должны существовать:

```text
.dossier/
├── manifest.json
├── backlog/
│   ├── manifest.json
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── applied.json
│   ├── reports/
│   ├── source-review/
│   ├── sources.json
│   ├── state.json
│   ├── packets/
│   └── patches/
├── logs/
│   ├── change-proposal/
│   ├── feature-intake/
│   ├── implementation/
│   ├── plan-slice/
│   └── spec-compact/
├── metrics/
├── ops/
│   └── locks/
├── reviews/
├── retro/
├── steps/
└── verification/

docs/
└── ssot/
    ├── index.md
    └── features/
```

## Порядок миграции

### Шаг 1. Подготовь canonical scaffold в temp directory

Нельзя bootstrap-ить legacy repo напрямую через `init`.

Сначала создай пустой scaffold отдельно:

```bash
tmpdir="$(mktemp -d)"
dossier-engineer init --path "$tmpdir/repo"
```

Scaffold нужен как источник canonical файлов:

- `.dossier/manifest.json`
- `.dossier/backlog/manifest.json`
- `.dossier/backlog/.gitignore`
- `.dossier/backlog/AGENTS.md`
- пустые canonical directories
- `docs/ssot/index.md`
- `docs/ssot/features/.gitkeep`

### Шаг 2. Создай migration log

В legacy repo:

```bash
mkdir -p .dossier/ops
touch ".dossier/ops/migration-log-$(date +%Y%m%d-%H%M).md"
```

Сразу запиши:

- timestamp начала;
- baseline branch;
- migration branch;
- SHA checkpoint commit;
- путь репозитория.

### Шаг 3. Разверни canonical skeleton в legacy repo

Скопируй из scaffold:

- `.dossier/manifest.json`
- `.dossier/backlog/manifest.json`
- `.dossier/backlog/.gitignore`
- `.dossier/backlog/AGENTS.md`

Создай canonical directories, если их нет:

```bash
mkdir -p \
  .dossier/backlog/source-review \
  .dossier/backlog/packets \
  .dossier/backlog/patches \
  .dossier/backlog/reports \
  .dossier/logs/feature-intake \
  .dossier/logs/spec-compact \
  .dossier/logs/plan-slice \
  .dossier/logs/implementation \
  .dossier/logs/change-proposal \
  .dossier/reviews \
  .dossier/verification \
  .dossier/steps \
  .dossier/metrics \
  .dossier/retro \
  .dossier/ops/locks \
  .dossier/drift \
  docs/ssot/features \
  docs/notes/backlog-legacy
```

Если `docs/ssot/index.md` отсутствует — скопируй его из scaffold.  
Если уже существует — **сохрани файл**, но позже обязательно запусти `sync-index` и `index-refresh`.

### Шаг 4. Перенеси backlog truth

Для legacy layout вида `docs/backlog/*`:

| Legacy path | Canonical path | Действие |
| --- | --- | --- |
| `docs/backlog/.backlog/applied.json` | `.dossier/backlog/applied.json` | перенести |
| `docs/backlog/.backlog/sources.json` | `.dossier/backlog/sources.json` | перенести |
| `docs/backlog/.backlog/state.json` | `.dossier/backlog/state.json` | перенести |
| `docs/backlog/packets/*` | `.dossier/backlog/packets/*` | перенести |
| `docs/backlog/patches/*` | `.dossier/backlog/patches/*` | перенести |
| `docs/backlog/reports/*` | `.dossier/backlog/reports/*` | перенести |

Не переносить как canonical runtime artifacts:

- `docs/backlog/.backlog.json`
- `docs/backlog/AGENTS.md`
- `docs/backlog/.gitignore`
- `docs/backlog/drafts/*`
- `docs/backlog/reviews/*`

Legacy supporting notes из `docs/backlog/*.md` не должны оставаться внутри runtime-owned backlog root.  
Если они еще нужны как supporting context, перемести их в:

```text
docs/notes/backlog-legacy/
```

Для `yaagi` это как минимум:

- `docs/backlog/feature-candidates.md`
- `docs/backlog/local-vllm-model-shortlist-2026-03-24.md`
- `docs/backlog/working-system-roadmap-matrix-2026-03-26.md`

### Шаг 5. Перенеси Feature Dossiers

Все legacy dossier files:

```text
docs/features/F-*.md
```

перемести в:

```text
docs/ssot/features/F-*.md
```

После этого в репозитории не должно оставаться canonical feature dossiers в `docs/features/`.

### Шаг 6. Перепиши пути в `applied.json`

Legacy `applied.json` хранит `canonical_path` в старом backlog format:

- `packets/...`
- `patches/...`

После миграции все `canonical_path` должны начинаться с:

```text
.dossier/backlog/
```

Механический rewrite:

```bash
node - <<'NODE'
const fs = require('node:fs');
const file = '.dossier/backlog/applied.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

for (const group of ['packets', 'patches']) {
  for (const entry of data[group] ?? []) {
    const rel = String(entry.canonical_path ?? '').replace(/^\.?\/*/, '');
    entry.canonical_path = rel.startsWith('.dossier/backlog/')
      ? rel
      : `.dossier/backlog/${rel}`;
  }
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
NODE
```

### Шаг 7. Перепиши пути в `sources.json`

Legacy `sources.json` обычно хранит пути relative to `docs/backlog`.  
Новый runtime требует repo-root-relative POSIX paths.

Для `yaagi` обязательные rewrite rules такие:

| Legacy value | Canonical value |
| --- | --- |
| `../../README.md` | `README.md` |
| `../adr/...` | `docs/adr/...` |
| `../architecture/...` | `docs/architecture/...` |
| `../features/...` | `docs/ssot/features/...` |
| `../polyphony_concept.md` | `docs/polyphony_concept.md` |
| `../polyphony_concept.en.md` | `docs/polyphony_concept.en.md` |
| `feature-candidates.md` | `docs/notes/backlog-legacy/feature-candidates.md` |
| `local-vllm-model-shortlist-2026-03-24.md` | `docs/notes/backlog-legacy/local-vllm-model-shortlist-2026-03-24.md` |
| `working-system-roadmap-matrix-2026-03-26.md` | `docs/notes/backlog-legacy/working-system-roadmap-matrix-2026-03-26.md` |

Механический rewrite для `yaagi`:

```bash
node - <<'NODE'
const fs = require('node:fs');
const file = '.dossier/backlog/sources.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function rewrite(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/^\.\.\/\.\.\/README\.md$/, 'README.md')
    .replace(/^\.\.\/adr\//, 'docs/adr/')
    .replace(/^\.\.\/architecture\//, 'docs/architecture/')
    .replace(/^\.\.\/features\//, 'docs/ssot/features/')
    .replace(/^\.\.\/polyphony_concept\.md$/, 'docs/polyphony_concept.md')
    .replace(/^\.\.\/polyphony_concept\.en\.md$/, 'docs/polyphony_concept.en.md')
    .replace(/^feature-candidates\.md$/, 'docs/notes/backlog-legacy/feature-candidates.md')
    .replace(/^local-vllm-model-shortlist-2026-03-24\.md$/, 'docs/notes/backlog-legacy/local-vllm-model-shortlist-2026-03-24.md')
    .replace(/^working-system-roadmap-matrix-2026-03-26\.md$/, 'docs/notes/backlog-legacy/working-system-roadmap-matrix-2026-03-26.md');
}

for (const source of data.sources ?? []) {
  source.path = rewrite(source.path);
  if (typeof source.source_label === 'string') {
    source.source_label = rewrite(source.source_label);
  }
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
NODE
```

### Шаг 8. Удали legacy machine history и legacy roots

После того как canonical truth уже перенесен:

```bash
rm -rf \
  docs/backlog \
  docs/features \
  .dossier/evidence \
  .dossier/logs \
  .dossier/reviews \
  .dossier/steps \
  .dossier/drift \
  .dossier/retro \
  .dossier/metrics \
  .dossier/verification
```

Затем заново создай canonical empty dirs:

```bash
mkdir -p \
  .dossier/logs/feature-intake \
  .dossier/logs/spec-compact \
  .dossier/logs/plan-slice \
  .dossier/logs/implementation \
  .dossier/logs/change-proposal \
  .dossier/reviews \
  .dossier/steps \
  .dossier/metrics \
  .dossier/retro \
  .dossier/verification
```

Смысл этого шага: новый runtime начинает новую machine-history жизнь.  
Legacy machine history остается только в git checkpoint commit.

## Проверка успешной миграции

### 1. Структурная проверка

Должны существовать:

```bash
test -f .dossier/manifest.json
test -f .dossier/backlog/manifest.json
test -f .dossier/backlog/applied.json
test -f .dossier/backlog/sources.json
test -f .dossier/backlog/state.json
test -f docs/ssot/index.md
test -d docs/ssot/features
```

Должны отсутствовать:

```bash
test ! -e docs/backlog
test ! -e docs/features
find .dossier/logs -maxdepth 1 -type d -name 'F-*' | grep .
```

Последняя команда не должна ничего вывести.

### 2. Проверка переписанных JSON

```bash
node - <<'NODE'
const fs = require('node:fs');

const applied = JSON.parse(fs.readFileSync('.dossier/backlog/applied.json', 'utf8'));
for (const entry of [...(applied.packets ?? []), ...(applied.patches ?? [])]) {
  if (!String(entry.canonical_path ?? '').startsWith('.dossier/backlog/')) {
    throw new Error(`Bad canonical_path: ${entry.canonical_path}`);
  }
}

const sources = JSON.parse(fs.readFileSync('.dossier/backlog/sources.json', 'utf8'));
for (const source of sources.sources ?? []) {
  const p = String(source.path ?? '');
  if (p.startsWith('../')) {
    throw new Error(`Legacy relative source path left behind: ${p}`);
  }
}

console.log('JSON migration checks: PASS');
NODE
```

### 3. Проверка canonical runtime

Из корня репозитория:

```bash
dossier-engineer status
dossier-engineer list-sources
dossier-engineer sync-index
dossier-engineer index-refresh
dossier-engineer lint-dossiers --update-index
```

Ожидание:

- все команды завершаются успешно;
- `docs/ssot/index.md` обновлен без ссылок на `../features/`;
- backlog summary читается из `.dossier/backlog/*`;
- нет ошибок root discovery.

### 4. Проверка на stale legacy references

```bash
rg -n 'docs/backlog|docs/features|\\.backlog\\.json|backlog-engineer init' . docs .dossier
```

После миграции команда не должна находить runtime-critical legacy references.

Допустимы только:

- исторические записи в git history;
- старые ссылки в уже неиспользуемых внешних документах, которые ты сознательно оставил за пределами canonical runtime surface.

## Финализация

Когда все проверки прошли:

1. допиши migration log;
2. проверь `git diff` глазами;
3. сделай migration commit;
4. только после этого продолжай работу уже через новый skill/runtime.

Рекомендуемый commit:

```bash
git add -A
git commit -m "refactor: migrate repo to unified-dossier-engineer"
```

## Критерий успеха

Миграция считается успешной только если одновременно выполняются все условия:

1. backlog truth живет только в `.dossier/backlog/*`;
2. feature dossiers живут только в `docs/ssot/features/*`;
3. `docs/ssot/index.md` обновлен под новый layout;
4. legacy roots `docs/backlog` и `docs/features` удалены;
5. legacy machine history удалена из working tree;
6. canonical runtime commands читают репозиторий без специальных compatibility режимов.
