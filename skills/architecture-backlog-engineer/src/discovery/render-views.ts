import fs from 'node:fs';
import path from 'node:path';

import {
  appendNdjson,
  loadJson,
  runPaths,
  utcNow,
  writeJson,
  type ClosureFile,
  type DiscoveryItem,
  type DiscoveryState,
  type Manifest,
  type ValidationFile,
} from './common.js';

export interface RenderDiscoveryViewsResult {
  renderedAt: string;
  runDir: string;
  viewsDir: string;
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value).replace(/\|/g, '\\|');
  }

  return (JSON.stringify(value) ?? '').replace(/\|/g, '\\|');
}

function relativeViewPath(fileName: string): string {
  return path.posix.join('views', fileName);
}

function renderFeatureCandidates(state: DiscoveryState): string {
  const items = [...(state.items ?? [])].sort((left, right) =>
    String(left.item_id ?? '').localeCompare(String(right.item_id ?? '')),
  );
  const lines = [
    '# Feature Candidates',
    '',
    '| Item ID | Class | Status | Title | Capability added | Origins |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  for (const item of items) {
    lines.push(
      `| ${escapeCell(item.item_id)} | ${escapeCell(item.item_class)} | ${escapeCell(item.summary_label ?? 'Needs clarification')} | ${escapeCell(item.title ?? '')} | ${escapeCell(item.capability_added ?? '')} | ${escapeCell((item.origin_ref ?? []).join(', '))} |`,
    );
  }

  if (items.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |');
  }

  return `${lines.join('\n')}\n`;
}

function renderRoadmap(state: DiscoveryState): string {
  const items = [...(state.items ?? [])];
  const indexed = items.map((item, index) => ({ index: index + 1, item }));
  const lines = [
    '# Roadmap',
    '',
    '| # | Initiative / Feature | Type | Status | Capability added | Architectural scope | Dependencies | Why now | What is blocked without it | Risks / Gaps |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const { index, item } of indexed) {
    lines.push(
      `| ${index} | ${escapeCell(item.title ?? item.item_id ?? '')} | ${escapeCell(item.item_class)} | ${escapeCell(item.summary_label ?? 'Needs clarification')} | ${escapeCell(item.capability_added ?? '')} | ${escapeCell(item.architectural_scope ?? '')} | ${escapeCell((item.dependencies ?? []).join(', '))} | ${escapeCell(item.why_now ?? '')} | ${escapeCell(item.blocked_without ?? '')} | ${escapeCell(item.risks_gaps ?? '')} |`,
    );
  }

  if (indexed.length === 0) {
    lines.push('| 1 | _No items yet_ |  |  |  |  |  |  |  |  |');
  }

  return `${lines.join('\n')}\n`;
}

function isGapItem(item: DiscoveryItem): boolean {
  return ['Missing', 'Blocked', 'Needs clarification'].includes(String(item.summary_label));
}

function renderGapsAndValidation(
  manifest: Manifest,
  state: DiscoveryState,
  validation: ValidationFile,
  closure: ClosureFile,
  projectedPhaseState: Manifest['phase_state'],
): string {
  const gapItems = (state.items ?? []).filter((item) => isGapItem(item));
  const hardErrors = validation.errors ?? [];
  const warnings = validation.warnings ?? [];

  const lines = [
    '# Gaps And Validation',
    '',
    '## Run State',
    '',
    `- Run ID: ${manifest.run_id ?? 'unknown'}`,
    `- Phase state: ${projectedPhaseState ?? manifest.phase_state ?? 'unknown'}`,
    `- Acceptance target: ${manifest.acceptance_target ?? 'unknown'}`,
    `- Validation status: ${validation.status ?? 'unknown'}`,
    `- Acceptance class: ${closure.acceptance_class ?? 'draft-only'}`,
    '',
    '## Validation Errors',
    '',
  ];

  if (hardErrors.length === 0) {
    lines.push('- None');
  } else {
    for (const error of hardErrors) {
      lines.push(`- ${error}`);
    }
  }

  lines.push('', '## Validation Warnings', '');
  if (warnings.length === 0) {
    lines.push('- None');
  } else {
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push('', '## Gap Items', '');
  if (gapItems.length === 0) {
    lines.push('- None');
  } else {
    for (const item of gapItems) {
      lines.push(`- ${item.item_id}: ${item.summary_label} - ${item.title ?? ''}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function renderDiscoveryViews(runDirInput: string): RenderDiscoveryViewsResult {
  const runDir = path.resolve(runDirInput);
  const paths = runPaths(runDir);
  const manifest = loadJson<Manifest>(paths.manifest);
  const state = loadJson<DiscoveryState>(paths.state);
  const validation = loadJson<ValidationFile>(paths.validation);
  const closure = loadJson<ClosureFile>(paths.closure);
  const renderedAt = utcNow();
  const projectedPhaseState =
    validation.status === 'pass' && manifest.phase_state !== 'closed'
      ? 'rendered'
      : manifest.phase_state;

  const featureCandidates = renderFeatureCandidates(state);
  const roadmap = renderRoadmap(state);
  const gapsAndValidation = renderGapsAndValidation(
    manifest,
    state,
    validation,
    closure,
    projectedPhaseState,
  );

  writeJson(path.join(paths.views, 'feature-candidates.meta.json'), {
    generated_at: renderedAt,
    kind: 'feature-candidates',
    markdown_path: relativeViewPath('feature-candidates.md'),
  });
  writeJson(path.join(paths.views, 'roadmap.meta.json'), {
    generated_at: renderedAt,
    kind: 'roadmap',
    markdown_path: relativeViewPath('roadmap.md'),
  });
  writeJson(path.join(paths.views, 'gaps-and-validation.meta.json'), {
    generated_at: renderedAt,
    kind: 'gaps-and-validation',
    markdown_path: relativeViewPath('gaps-and-validation.md'),
  });

  const markdownFiles = [
    ['feature-candidates.md', featureCandidates],
    ['roadmap.md', roadmap],
    ['gaps-and-validation.md', gapsAndValidation],
  ] as const;

  for (const [fileName, content] of markdownFiles) {
    const filePath = path.join(paths.views, fileName);
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  manifest.updated_at = renderedAt;
  manifest.last_render_at = renderedAt;
  if (manifest.phase_state !== 'closed') {
    manifest.phase_state = projectedPhaseState;
  }
  writeJson(paths.manifest, manifest);
  appendNdjson(paths.journal, {
    ts: renderedAt,
    event: 'views_rendered',
    run_id: manifest.run_id ?? path.basename(runDir),
    validation_status: validation.status ?? 'unknown',
  });

  return {
    renderedAt,
    runDir,
    viewsDir: paths.views,
  };
}
