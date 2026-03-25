#!/usr/bin/env node
/**
 * contract-drift-audit.mjs
 *
 * Detects when a dossier change alters the executable contract but the same
 * change set does not include matching code/test/runtime follow-up.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { extractAcIds, readDossierRecord } from './lib/dossier-utils.mjs';
import {
  getChangedFiles,
  getCurrentCommit,
  getHeadRef,
  getMergeBase,
  inGitRepo,
  resolveBaseRef,
  runGit,
  toRepoRelativePath,
} from './lib/git-utils.mjs';
import { writeJsonAtomic } from './lib/fs-utils.mjs';

const EXECUTABLE_SECTION_PATTERNS = [
  /scope/i,
  /requirements/i,
  /acceptance criteria/i,
  /non-functional/i,
  /^nfr$/i,
  /design/i,
  /definition of done/i,
  /verification/i,
  /test plan/i,
  /coverage map/i,
  /edge cases/i,
  /failure modes/i,
  /slicing plan/i,
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const take = (name, fallback = null) => {
    const index = args.indexOf(name);
    if (index === -1) return fallback;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) return fallback;
    return value;
  };
  return {
    root: take('--root', process.cwd()),
    dossier: take('--dossier', null),
    base: take('--base', null),
    beforeFile: take('--before-file', null),
    output: take('--output', null),
  };
};

const normalizeSectionText = (text) =>
  String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .trim();

const parseTopLevelSections = (markdown) => {
  const source = String(markdown ?? '');
  const lines = source.split(/\r?\n/);
  const sections = new Map();
  let currentHeading = '__preamble__';
  let buffer = [];

  const flush = () => {
    sections.set(currentHeading, buffer.join('\n').trim());
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1].trim();
      buffer = [];
      continue;
    }
    buffer.push(line);
  }
  flush();
  return sections;
};

const getBaselineFromGit = (root, relPath, baseRef) => {
  const head = getHeadRef(root);
  if (!head) return null;

  const diffVsHead =
    runGit(root, ['diff', '--name-only', 'HEAD', '--', relPath], { allowFailure: true }) || '';
  if (diffVsHead.trim()) {
    return {
      text: runGit(root, ['show', `HEAD:${relPath}`], { allowFailure: true }),
      label: 'HEAD',
    };
  }

  const mergeBase = baseRef ? getMergeBase(root, baseRef) : null;
  if (mergeBase) {
    return {
      text: runGit(root, ['show', `${mergeBase}:${relPath}`], { allowFailure: true }),
      label: mergeBase,
    };
  }

  const previousCommit = runGit(root, ['rev-parse', '--verify', 'HEAD~1'], { allowFailure: true });
  if (previousCommit) {
    return {
      text: runGit(root, ['show', `${previousCommit}:${relPath}`], { allowFailure: true }),
      label: previousCommit,
    };
  }

  return null;
};

const hasExecutableSectionChange = (beforeSections, afterSections) => {
  const changedSections = [];
  const allHeadings = new Set([...beforeSections.keys(), ...afterSections.keys()]);
  for (const heading of allHeadings) {
    if (heading === '__preamble__') continue;
    const before = normalizeSectionText(beforeSections.get(heading));
    const after = normalizeSectionText(afterSections.get(heading));
    if (before === after) continue;
    if (EXECUTABLE_SECTION_PATTERNS.some((pattern) => pattern.test(heading))) {
      changedSections.push(heading);
    }
  }
  return changedSections;
};

const main = async () => {
  const { root, dossier, base, beforeFile, output } = parseArgs();
  if (!dossier) throw new Error('--dossier is required.');

  const absRoot = path.resolve(root);
  const absDossier = path.resolve(absRoot, dossier);
  const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
  const relDossier = dossierRecord.relPath;
  const featureId = String(dossierRecord.frontmatter.id ?? path.basename(absDossier, '.md'));

  let beforeText = null;
  let baselineLabel = null;
  if (beforeFile) {
    beforeText = await fs.readFile(path.resolve(absRoot, beforeFile), 'utf8');
    baselineLabel = toRepoRelativePath(absRoot, path.resolve(absRoot, beforeFile));
  } else if (inGitRepo(absRoot)) {
    const baseRef = resolveBaseRef(absRoot, base);
    const baseline = getBaselineFromGit(absRoot, relDossier, baseRef);
    beforeText = baseline?.text ?? null;
    baselineLabel = baseline?.label ?? null;
  }

  if (beforeText === null) {
    throw new Error(
      'Could not resolve a baseline dossier snapshot. Use --before-file or run inside a git repository.',
    );
  }

  const beforeSections = parseTopLevelSections(beforeText);
  const afterSections = parseTopLevelSections(dossierRecord.markdown);
  const beforeAcIds = new Set(extractAcIds(beforeText));
  const afterAcIds = new Set(dossierRecord.acIds);

  const addedAcIds = [...afterAcIds].filter((acId) => !beforeAcIds.has(acId)).sort();
  const removedAcIds = [...beforeAcIds].filter((acId) => !afterAcIds.has(acId)).sort();
  const changedExecutableSections = hasExecutableSectionChange(beforeSections, afterSections);

  const beforeStatusMatch = String(beforeText).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const beforeFrontmatter = beforeStatusMatch ? beforeStatusMatch[1] : '';
  const afterFrontmatter =
    String(dossierRecord.markdown).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const frontmatterChanged = ['depends_on', 'impacts', 'coverage_gate']
    .filter(
      (key) =>
        new RegExp(`^\\s*${key}:.*$`, 'm').test(beforeFrontmatter) ||
        new RegExp(`^\\s*${key}:.*$`, 'm').test(afterFrontmatter),
    )
    .filter((key) => {
      const beforeLine = beforeFrontmatter.match(new RegExp(`^\\s*${key}:.*$`, 'm'))?.[0] ?? '';
      const afterLine = afterFrontmatter.match(new RegExp(`^\\s*${key}:.*$`, 'm'))?.[0] ?? '';
      return beforeLine.trim() !== afterLine.trim();
    });

  const executableContractChanged =
    addedAcIds.length > 0 ||
    removedAcIds.length > 0 ||
    changedExecutableSections.length > 0 ||
    frontmatterChanged.length > 0;

  const maturityRequiresAudit = ['planned', 'in_progress', 'done'].includes(
    String(dossierRecord.frontmatter.status),
  );
  let changedFiles = [];
  if (inGitRepo(absRoot)) {
    changedFiles = getChangedFiles(absRoot, resolveBaseRef(absRoot, base));
  }

  const codeFollowUpFiles = changedFiles.filter(
    (filePath) =>
      !filePath.startsWith('docs/') &&
      !filePath.startsWith('.dossier/') &&
      filePath !== 'AGENTS.md',
  );
  const architectureFollowUpFiles = changedFiles.filter(
    (filePath) => filePath === 'docs/architecture/system.md' || filePath.startsWith('docs/adr/'),
  );

  const requiresFollowUp =
    executableContractChanged && maturityRequiresAudit && codeFollowUpFiles.length === 0;
  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    feature_id: featureId,
    dossier: relDossier,
    current_commit: inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null,
    baseline: baselineLabel,
    executable_contract_changed: executableContractChanged,
    maturity_requires_audit: maturityRequiresAudit,
    added_ac_ids: addedAcIds,
    removed_ac_ids: removedAcIds,
    changed_executable_sections: changedExecutableSections,
    frontmatter_changes: frontmatterChanged,
    changed_files: changedFiles,
    code_follow_up_files: codeFollowUpFiles,
    architecture_follow_up_files: architectureFollowUpFiles,
    requires_follow_up: requiresFollowUp,
  };

  const outputPath = output
    ? path.resolve(absRoot, output)
    : path.join(absRoot, '.dossier', 'drift', featureId, `${Date.now()}.json`);
  await writeJsonAtomic(outputPath, artifact);

  console.log(`[contract-drift-audit] feature=${featureId} baseline=${baselineLabel}`);
  console.log(
    `[contract-drift-audit] executable_contract_changed=${executableContractChanged ? 'yes' : 'no'} maturity_requires_audit=${maturityRequiresAudit ? 'yes' : 'no'} requires_follow_up=${requiresFollowUp ? 'yes' : 'no'}`,
  );

  if (addedAcIds.length > 0) console.log(`Added AC IDs: ${addedAcIds.join(', ')}`);
  if (removedAcIds.length > 0) console.log(`Removed AC IDs: ${removedAcIds.join(', ')}`);
  if (changedExecutableSections.length > 0)
    console.log(`Changed executable sections: ${changedExecutableSections.join(' | ')}`);
  if (frontmatterChanged.length > 0)
    console.log(`Changed frontmatter keys: ${frontmatterChanged.join(', ')}`);
  console.log(`Artifact: ${toRepoRelativePath(absRoot, outputPath)}`);

  if (requiresFollowUp) {
    console.error(
      '[contract-drift-audit] Executable contract changed without matching code/test/runtime follow-up in the same change set.',
    );
    process.exit(2);
  }
};

main().catch((error) => {
  console.error('[contract-drift-audit] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
