import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzeDossiers,
  buildRedFlagsBlock,
  renderLintSummary,
} from '../src/core/lint-dossiers.ts';
import {
  extractAcIds,
  extractCoverageAcIds,
  type DossierRecord,
} from '../src/lib/dossier-utils.ts';

function makeDossier(args: {
  id: string;
  markdown: string;
  status: string;
  coverageGate?: string;
  dependsOn?: string[];
}): DossierRecord {
  return {
    absPath: `/tmp/${args.id}.md`,
    relPath: `docs/features/${args.id}.md`,
    markdown: args.markdown,
    frontmatter: {
      id: args.id,
      title: `${args.id} title`,
      status: args.status,
      area: 'api',
      owners: ['@team'],
      depends_on: args.dependsOn ?? [],
      impacts: ['api'],
      coverage_gate: args.coverageGate ?? 'deferred',
      created: '2026-03-26',
      updated: '2026-03-26',
    },
    coverageGate: args.coverageGate ?? 'deferred',
    acIds: extractAcIds(args.markdown),
    coverageIds: extractCoverageAcIds(args.markdown),
  };
}

void test('analyzeDossiers surfaces compact-spec nudges for weak shaped dossiers', () => {
  const dossier = makeDossier({
    id: 'F-0002',
    status: 'shaped',
    markdown: `## Requirements & Acceptance Criteria

- AC-F0002-01 Request validates the payload and stores the result.

## NFR

- Performance: fast.

## Design (compact)

### API surface
- POST /widgets
  - body: { name: string }
  - response: { ok: true }

### Edge cases and failure modes
- TBD: duplicate submission handling.

## Change log

- 2026-03-26: Initial draft.
`,
  });

  const findings = analyzeDossiers([dossier]);
  const messages = findings.map((finding) => finding.message);

  assert(messages.some((message) => message.includes('Missing Definition of Done section')));
  assert(
    messages.some((message) => message.includes('Boundary I/O appears in the compact design')),
  );
  assert(messages.some((message) => message.includes('Potential compound ACs detected')));
  assert(messages.some((message) => message.includes('Raw TBD found in executable sections')));
  assert(messages.some((message) => message.includes('NFR section looks aspirational')));
});

void test('analyzeDossiers surfaces planning nudges and summary rendering stays readable', () => {
  const dependency = makeDossier({
    id: 'F-0009',
    status: 'done',
    coverageGate: 'strict',
    markdown: `## Requirements & Acceptance Criteria

- AC-F0009-01 Adapter accepts queued work from the shared worker.

## Definition of Done

- Adapter handoff is verified.

## Coverage map

| AC-F0009-01 | test/platform-adapter.test.mjs |

## Change log

- 2026-03-26: Initial adapter dossier.
`,
  });
  const planned = makeDossier({
    id: 'F-0003',
    status: 'planned',
    markdown: `## Open questions

- What retry ceiling should the worker assume? Owner: @team. Next: align with ops before implementation.

## Requirements & Acceptance Criteria

- AC-F0003-01 Worker handoff persists the delivery marker before downstream dispatch.

## Definition of Done

- The handoff path is verified end to end.

## Design (compact)

### Runtime / deployment surface
- Shared worker consumes outbound handoff jobs on the existing runtime path.

### Data model changes
- Add \`handoff_started_at\`; the migration becomes one-way once the worker reads the new column.

### Verification surface / initial verification plan
- AC-F0003-01: integration

## Slicing plan

### Slice SL-F0003-01: worker handoff
Covers: AC-F0003-01
Verification: integration

## Coverage map

| AC-F0003-01 | test/worker-handoff.test.mjs | planned |

## Change log

- **v1.0 (2026-03-26):** Initial planned dossier.
- **v1.1 (2026-03-27):** Updated slices after new migration notes.
`,
    dependsOn: ['F-0009'],
  });

  const findings = analyzeDossiers([dependency, planned]);
  const summary = renderLintSummary(findings, 2);
  const redFlags = buildRedFlagsBlock(findings);

  assert(summary.includes('planning-readiness cue'));
  assert(summary.includes('Planned+ dossier has dependencies'));
  assert(summary.includes('rollout / activation note'));
  assert(summary.includes('no short reason tags were found'));
  assert(redFlags.includes('F-0003'));
  assert(redFlags.includes('WARN'));
});

void test('analyzeDossiers treats missing ACs in proposed dossiers as a warning', () => {
  const dossier = makeDossier({
    id: 'F-0011',
    status: 'proposed',
    markdown: `## Context & Goal

- Intake started from backlog work.

## Change log

- 2026-03-26: Initial intake.
`,
  });

  const findings = analyzeDossiers([dossier]);
  const acFinding = findings.find((finding) =>
    finding.message.includes('No acceptance criteria IDs found'),
  );

  assert.equal(acFinding?.level, 'warn');
});
