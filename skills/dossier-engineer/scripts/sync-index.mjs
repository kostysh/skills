#!/usr/bin/env node
/**
 * sync-index.mjs
 *
 * Regenerates docs/ssot/index.md from Feature Dossier frontmatter.
 * - Uses shared frontmatter parsing.
 * - Keeps generated sections separate from human-maintained notes.
 * - Publishes dossier status and coverage gate as separate signals.
 *
 * Usage:
 *   node scripts/sync-index.mjs
 *   node scripts/sync-index.mjs --dossiers-dir docs/features --index-file docs/ssot/index.md
 */

import path from 'node:path';

import { DEFAULT_DOSSIERS_DIR, readAllDossiers } from './lib/dossier-utils.mjs';
import { readText, writeTextAtomic } from './lib/fs-utils.mjs';

const DEFAULT_INDEX_FILE = 'docs/ssot/index.md';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const get = (name, fallback) => {
    const index = args.indexOf(name);
    if (index === -1) return fallback;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) return fallback;
    return value;
  };
  return {
    dossiersDir: get('--dossiers-dir', DEFAULT_DOSSIERS_DIR),
    indexFile: get('--index-file', DEFAULT_INDEX_FILE),
    root: get('--root', process.cwd()),
  };
};

const ensureIndexSkeleton = () => `# SSOT Index

> Single-file navigation source of truth.  
> **Do not duplicate requirements here.** Link to Feature Dossiers instead.

_Last sync: ${new Date().toISOString()}_

## Features

<!-- BEGIN GENERATED FEATURES -->
<!-- END GENERATED FEATURES -->

## Dependency graph

<!-- BEGIN GENERATED DEP_GRAPH -->
<!-- END GENERATED DEP_GRAPH -->

## Red flags

<!-- BEGIN GENERATED RED_FLAGS -->
<!-- END GENERATED RED_FLAGS -->
`;

const replaceBlock = (content, beginMarker, endMarker, block) => {
  const begin = content.indexOf(beginMarker);
  const end = content.indexOf(endMarker);
  if (begin === -1 || end === -1 || end < begin) {
    return `${content.trim()}\n\n${beginMarker}\n${block}\n${endMarker}\n`;
  }
  const before = content.slice(0, begin + beginMarker.length);
  const after = content.slice(end);
  return `${before}\n${block}\n${after}`;
};

const escapePipe = (value) => String(value).replace(/\|/g, '\\|');
const escapeQuotes = (value) => String(value).replace(/"/g, '\\"');

const featureRow = (dossier, indexDir) => {
  const frontmatter = dossier.frontmatter ?? {};
  const depends =
    Array.isArray(frontmatter.depends_on) && frontmatter.depends_on.length
      ? frontmatter.depends_on.join(', ')
      : '—';
  const impacts =
    Array.isArray(frontmatter.impacts) && frontmatter.impacts.length
      ? frontmatter.impacts.join(',')
      : '—';
  const relPath = path.relative(indexDir, dossier.absPath).split(path.sep).join('/');

  return `| ${frontmatter.id ?? '—'} | ${escapePipe(frontmatter.title ?? '')} | ${frontmatter.status ?? ''} | ${dossier.coverageGate} | ${frontmatter.area ?? ''} | ${depends} | ${impacts} | \`${relPath}\` |`;
};

const buildMermaidGraph = (dossiers) => {
  const nodes = dossiers.map((dossier) => {
    const frontmatter = dossier.frontmatter ?? {};
    const nodeId = String(frontmatter.id ?? dossier.relPath).replace(/-/g, '');
    const label = `${frontmatter.id ?? ''} ${frontmatter.title ?? ''}`.trim();
    return `  ${nodeId}["${escapeQuotes(label)}"]`;
  });

  const edges = [];
  for (const dossier of dossiers) {
    const frontmatter = dossier.frontmatter ?? {};
    const from = String(frontmatter.id ?? dossier.relPath).replace(/-/g, '');
    const dependsOn = Array.isArray(frontmatter.depends_on) ? frontmatter.depends_on : [];
    for (const dependency of dependsOn) {
      const to = String(dependency).replace(/-/g, '');
      edges.push(`  ${from} --> ${to}`);
    }
  }

  return ['```mermaid', 'graph TD', ...nodes, ...edges, '```'].join('\n');
};

const main = async () => {
  const { dossiersDir, indexFile, root } = parseArgs();
  const absRoot = path.resolve(root);
  const absIndex = path.resolve(absRoot, indexFile);
  const indexDir = path.dirname(absIndex);

  const dossiers = await readAllDossiers(absRoot, dossiersDir, { root: absRoot });
  const featuresBlock = [
    '| ID | Title | Status | Coverage | Area | Depends on | Impacts | Dossier |',
    '|---|---|---|---|---|---|---|---|',
    ...(dossiers.length > 0
      ? dossiers.map((dossier) => featureRow(dossier, indexDir))
      : ['| — | — | — | — | — | — | — | — |']),
  ].join('\n');

  const graphBlock = buildMermaidGraph(dossiers);

  let content;
  try {
    content = await readText(absIndex);
  } catch {
    content = ensureIndexSkeleton();
  }

  const refreshedBlocks = replaceBlock(
    replaceBlock(
      content,
      '<!-- BEGIN GENERATED FEATURES -->',
      '<!-- END GENERATED FEATURES -->',
      featuresBlock,
    ),
    '<!-- BEGIN GENERATED DEP_GRAPH -->',
    '<!-- END GENERATED DEP_GRAPH -->',
    graphBlock,
  );

  if (refreshedBlocks === content) {
    console.log(`[sync-index] ${indexFile} already up to date (${dossiers.length} dossier(s)).`);
    return;
  }

  const stamped = refreshedBlocks.replace(
    /_Last sync: .*?_\n/,
    `_Last sync: ${new Date().toISOString()}_\n`,
  );
  await writeTextAtomic(absIndex, stamped);
  console.log(`[sync-index] Updated ${indexFile} from ${dossiers.length} dossier(s).`);
};

main().catch((error) => {
  console.error('[sync-index] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
