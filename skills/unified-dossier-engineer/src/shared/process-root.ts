import { promises as fs } from 'node:fs';
import path from 'node:path';

import { fileExists, writeJsonAtomic, writeTextAtomic } from '../vendor/dossier-engineer/lib/fs-utils.ts';

export const PROCESS_MANIFEST_RELATIVE_PATH = '.dossier/manifest.json';
export const BACKLOG_MANIFEST_RELATIVE_PATH = '.dossier/backlog/manifest.json';
export const BACKLOG_DIR_RELATIVE_PATH = '.dossier/backlog';
export const FEATURE_DOSSIERS_DIR_RELATIVE_PATH = 'docs/ssot/features';
export const INDEX_FILE_RELATIVE_PATH = 'docs/ssot/index.md';

export function processManifestPath(root: string): string {
  return path.join(root, PROCESS_MANIFEST_RELATIVE_PATH);
}

export function backlogManifestPath(root: string): string {
  return path.join(root, BACKLOG_MANIFEST_RELATIVE_PATH);
}

export function backlogDirPath(root: string): string {
  return path.join(root, BACKLOG_DIR_RELATIVE_PATH);
}

export function featureDossiersDirPath(root: string): string {
  return path.join(root, FEATURE_DOSSIERS_DIR_RELATIVE_PATH);
}

export function indexFilePath(root: string): string {
  return path.join(root, INDEX_FILE_RELATIVE_PATH);
}

export async function findProcessRoot(startPath: string): Promise<string | undefined> {
  let cursor = path.resolve(startPath);

  while (true) {
    if (await fileExists(processManifestPath(cursor))) {
      return cursor;
    }

    const parent = path.dirname(cursor);
    if (parent === cursor) {
      return undefined;
    }
    cursor = parent;
  }
}

export async function resolveProcessRoot(
  cwd: string,
  explicitRoot?: string | null,
): Promise<string> {
  if (explicitRoot) {
    return path.resolve(cwd, explicitRoot);
  }

  const discovered = await findProcessRoot(cwd);
  if (!discovered) {
    throw new Error(
      'Process root not found. Run `dossier-engineer init --path <path>` or execute the command from a managed repository.',
    );
  }

  return discovered;
}

export async function initializeProcessRoot(root: string): Promise<{
  backlogManifestPath: string;
  dossiersDirPath: string;
  indexFilePath: string;
  processManifestPath: string;
}> {
  const createdAt = new Date().toISOString();
  const processManifest = {
    schema_version: 1,
    tool_name: '@kostysh/unified-dossier-engineer',
    created_at: createdAt,
    layout_version: 1,
  };
  const backlogManifest = {
    schema_version: 1,
    tool_name: '@kostysh/unified-dossier-engineer',
    created_at: createdAt,
    layout_version: 1,
  };
  const backlogState = {
    schema_version: 1,
    created_at: createdAt,
    updated_at: createdAt,
    last_refresh_at: null,
    context: {
      glossary: [],
      key_strategy: {},
      target_system: [],
      as_built: [],
      claims: [],
      contracts: [],
      data_domains: [],
      quality_attributes: [],
      policy_decisions: [],
    },
    items: [],
    todos: [],
  };
  const sourceRegistry = {
    schema_version: 1,
    created_at: createdAt,
    updated_at: createdAt,
    sources: [],
  };
  const appliedRegistry = {
    schema_version: 1,
    created_at: createdAt,
    updated_at: createdAt,
    next_apply_index: 1,
    packets: [],
    patches: [],
  };

  const processManifestAbsPath = processManifestPath(root);
  if (await fileExists(processManifestAbsPath)) {
    throw new Error(`Process root already exists: ${PROCESS_MANIFEST_RELATIVE_PATH}`);
  }

  const directories = [
    path.join(root, '.dossier'),
    backlogDirPath(root),
    path.join(root, '.dossier/backlog/source-review'),
    path.join(root, '.dossier/backlog/packets'),
    path.join(root, '.dossier/backlog/patches'),
    path.join(root, '.dossier/backlog/reports'),
    path.join(root, '.dossier/logs/feature-intake'),
    path.join(root, '.dossier/logs/spec-compact'),
    path.join(root, '.dossier/logs/plan-slice'),
    path.join(root, '.dossier/logs/implementation'),
    path.join(root, '.dossier/logs/change-proposal'),
    path.join(root, '.dossier/reviews'),
    path.join(root, '.dossier/verification'),
    path.join(root, '.dossier/steps'),
    path.join(root, '.dossier/metrics'),
    path.join(root, '.dossier/retro'),
    path.join(root, '.dossier/ops/locks'),
    path.join(root, '.dossier/drift'),
    path.join(root, 'docs/ssot'),
    featureDossiersDirPath(root),
  ];

  for (const directory of directories) {
    await fs.mkdir(directory, { recursive: true });
  }

  await writeJsonAtomic(processManifestAbsPath, processManifest);
  await writeJsonAtomic(backlogManifestPath(root), backlogManifest);
  await writeJsonAtomic(path.join(root, '.dossier/backlog/state.json'), backlogState);
  await writeJsonAtomic(path.join(root, '.dossier/backlog/sources.json'), sourceRegistry);
  await writeJsonAtomic(path.join(root, '.dossier/backlog/applied.json'), appliedRegistry);
  await writeTextAtomic(
    path.join(root, '.dossier/backlog/.gitignore'),
    ['reports/*.md', 'reports/*.mmd', 'mutation.lock', 'source-review/*.tmp-*', ''].join('\n'),
  );
  await writeTextAtomic(
    path.join(root, '.dossier/backlog/AGENTS.md'),
    [
      '# Unified Backlog Accounting Surface',
      '',
      'This directory contains utility-owned backlog artifacts for the merged dossier-engineer runtime.',
      'Do not hand-edit generated machine artifacts unless the workflow explicitly requires it.',
      '',
    ].join('\n'),
  );
  if (!(await fileExists(indexFilePath(root)))) {
    await writeTextAtomic(
      indexFilePath(root),
      [
        '# SSOT Index',
        '',
        '## Feature dossiers',
        '',
        '| Feature | Title | Status | Coverage gate | Area |',
        '| --- | --- | --- | --- | --- |',
        '',
      ].join('\n'),
    );
  }
  if (!(await fileExists(path.join(root, 'docs/ssot/features/.gitkeep')))) {
    await writeTextAtomic(path.join(root, 'docs/ssot/features/.gitkeep'), '');
  }

  return {
    processManifestPath: processManifestAbsPath,
    backlogManifestPath: backlogManifestPath(root),
    indexFilePath: indexFilePath(root),
    dossiersDirPath: featureDossiersDirPath(root),
  };
}
