#!/usr/bin/env node
/**
 * dependency-graph.mjs
 *
 * Outputs a Mermaid dependency graph from dossier frontmatter.
 */

import path from 'node:path';

import { DEFAULT_DOSSIERS_DIR, readAllDossiers } from './lib/dossier-utils.mjs';

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
    root: get('--root', process.cwd()),
    dossiersDir: get('--dossiers-dir', DEFAULT_DOSSIERS_DIR),
  };
};

const escapeQuotes = (value) => String(value).replace(/"/g, '\\"');

const main = async () => {
  const { root, dossiersDir } = parseArgs();
  const absRoot = path.resolve(root);
  const dossiers = await readAllDossiers(absRoot, dossiersDir, { root: absRoot });

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
    const dependencies = Array.isArray(frontmatter.depends_on) ? frontmatter.depends_on : [];
    for (const dependency of dependencies) {
      edges.push(`  ${from} --> ${String(dependency).replace(/-/g, '')}`);
    }
  }

  console.log(['```mermaid', 'graph TD', ...nodes, ...edges, '```'].join('\n'));
};

main().catch((error) => {
  console.error('[dependency-graph] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
