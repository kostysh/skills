# Unified artifact topology

Use this reference when designing or validating the merged accounting root and the project-facing SSOT boundary.

## Core split

The merged skill uses two different artifact families:

- accounting and process artifacts under `.dossier`
- human-facing project SSOT under `docs/ssot`

These families must not be collapsed into one root.

## Canonical `.dossier` layout

The merged accounting/process root is discovered by `.dossier/manifest.json`.

The backlog subroot is discovered by `.dossier/backlog/manifest.json`.

Target layout:

```text
.dossier/
├── manifest.json
├── backlog/
│   ├── manifest.json
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── state.json
│   ├── sources.json
│   ├── applied.json
│   ├── source-review/
│   ├── packets/
│   ├── patches/
│   ├── mutation.lock
│   └── reports/
├── logs/
│   ├── feature-intake/
│   ├── spec-compact/
│   ├── plan-slice/
│   └── implementation/
├── reviews/
├── verification/
├── steps/
├── metrics/
├── retro/
│   └── session-index.jsonl
├── ops/
└── drift/
```

## Canonical project SSOT layout

Human-facing project truth remains outside `.dossier`.

Steady-state target:

```text
docs/
└── ssot/
    ├── index.md
    └── features/
        ├── F-0001.md
        └── F-0002.md
```

## Boundary rules

- `docs/ssot/index.md` is the canonical global project index
- `docs/ssot/features/F-*.md` is the canonical feature dossier target
- `.dossier` never becomes the canonical home of project-facing feature dossiers
- repo-root `AGENTS.md` stays human-governed; utility-owned reinforcement may exist only inside `.dossier/backlog/AGENTS.md`
- backlog-local ignore contract lives in `.dossier/backlog/.gitignore`

## Root discovery and path rules

- repo process root is discovered from `.dossier/manifest.json`
- backlog subroot is discovered from `.dossier/backlog/manifest.json`
- commands may run from repo root or any descendant directory as long as upward discovery finds `.dossier/manifest.json`
- source paths are stored as normalized POSIX paths relative to repo process root
- sources outside repo root may use `..` segments but remain anchored to the process root

## Feature dossier canonical rule

There is exactly one canonical feature dossier path:

- `docs/ssot/features/F-*.md`

Forbidden states:

- `docs/features/F-*.md` treated as supported path by this skill
- both paths treated as canonical at the same time

## Negative rules

- do not place project SSOT feature dossiers under `.dossier`
- do not use `.dossier` as a shortcut replacement for project-facing docs
- do not treat accounting artifacts as human-facing SSOT
