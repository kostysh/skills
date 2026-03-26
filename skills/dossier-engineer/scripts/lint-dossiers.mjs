#!/usr/bin/env node
/**
 * lint-dossiers.mjs
 *
 * Validates Feature Dossiers. By default this script is read-only.
 * Use `--update-index` when you explicitly want to refresh the generated
 * Red flags block inside docs/ssot/index.md.
 */

import path from 'node:path';

import {
  COVERAGE_GATES,
  DEFAULT_DOSSIERS_DIR,
  DOSSIER_STATUSES,
  extractFeatureNumericId,
  hasChangeLogEntry,
  readAllDossiers,
} from './lib/dossier-utils.mjs';
import { readText, writeTextAtomic } from './lib/fs-utils.mjs';

const DEFAULT_INDEX_FILE = 'docs/ssot/index.md';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const has = (name) => args.includes(name);
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
    updateIndex: has('--update-index'),
  };
};

const replaceBlock = (content, beginMarker, endMarker, block) => {
  const begin = content.indexOf(beginMarker);
  const end = content.indexOf(endMarker);
  if (begin === -1 || end === -1 || end < begin) return content;
  const before = content.slice(0, begin + beginMarker.length);
  const after = content.slice(end);
  return `${before}\n${block}\n${after}`;
};

const main = async () => {
  const { dossiersDir, indexFile, root, updateIndex } = parseArgs();
  const absRoot = path.resolve(root);
  const absIndex = path.resolve(absRoot, indexFile);

  let dossiers = [];
  try {
    dossiers = await readAllDossiers(absRoot, dossiersDir, { root: absRoot });
  } catch (error) {
    console.error(
      `[lint-dossiers] ERROR: cannot read dossiers directory: ${path.resolve(absRoot, dossiersDir)}`,
    );
    console.error(error?.stack ?? String(error));
    process.exit(1);
  }

  /** @type {{ level: 'error' | 'warn', feature?: string, message: string }[]} */
  const findings = [];
  const featureIds = new Set();

  for (const dossier of dossiers) {
    const frontmatter = dossier.frontmatter ?? {};
    const feature = String(frontmatter.id ?? dossier.relPath);
    const required = [
      ['id', frontmatter.id],
      ['title', frontmatter.title],
      ['status', frontmatter.status],
      ['area', frontmatter.area],
      ['owners', frontmatter.owners],
      ['depends_on', frontmatter.depends_on],
      ['impacts', frontmatter.impacts],
      ['created', frontmatter.created],
      ['updated', frontmatter.updated],
    ];

    for (const [key, value] of required) {
      const missing =
        value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
      if (missing) {
        findings.push({
          level: 'error',
          feature,
          message: `Missing required frontmatter key: ${key}`,
        });
      }
    }

    if (typeof frontmatter.id !== 'string' || !/^F-\d{4}$/.test(frontmatter.id)) {
      findings.push({
        level: 'error',
        feature,
        message: `Invalid feature id "${String(frontmatter.id)}" (expected F-0001).`,
      });
    } else {
      if (featureIds.has(frontmatter.id)) {
        findings.push({
          level: 'error',
          feature: frontmatter.id,
          message: `Duplicate feature id across dossiers: ${frontmatter.id}`,
        });
      }
      featureIds.add(frontmatter.id);
    }

    if (typeof frontmatter.status !== 'string' || !DOSSIER_STATUSES.has(frontmatter.status)) {
      findings.push({
        level: 'error',
        feature,
        message: `Invalid status "${String(frontmatter.status)}" (allowed: ${[...DOSSIER_STATUSES].join(', ')}).`,
      });
    }

    if (!Array.isArray(frontmatter.owners) || frontmatter.owners.length === 0) {
      findings.push({
        level: 'error',
        feature,
        message: 'owners must be a non-empty array (for example: owners: ["@you"]).',
      });
    }

    for (const [key, value] of [
      ['created', frontmatter.created],
      ['updated', frontmatter.updated],
    ]) {
      if (typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        findings.push({
          level: 'warn',
          feature,
          message: `${key} should be YYYY-MM-DD (got "${value}").`,
        });
      }
    }

    if (
      frontmatter.coverage_gate !== undefined &&
      (typeof frontmatter.coverage_gate !== 'string' ||
        !COVERAGE_GATES.has(frontmatter.coverage_gate))
    ) {
      findings.push({
        level: 'error',
        feature,
        message: `Invalid coverage_gate "${String(frontmatter.coverage_gate)}" (allowed: ${[...COVERAGE_GATES].join(', ')}).`,
      });
    }

    if (
      frontmatter.coverage_gate === undefined &&
      ['planned', 'in_progress', 'done'].includes(String(frontmatter.status))
    ) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'coverage_gate is not explicit. Add `coverage_gate: deferred|strict` so workflow state and coverage enforcement stay separate.',
      });
    }

    if (dossier.acIds.length === 0) {
      findings.push({
        level: 'error',
        feature,
        message: 'No acceptance criteria IDs found. Add at least one AC-F....-.. entry.',
      });
    }

    const featureNum = extractFeatureNumericId(frontmatter.id);
    if (featureNum) {
      for (const acId of dossier.acIds) {
        if (!acId.startsWith(`AC-F${featureNum}-`)) {
          findings.push({
            level: 'error',
            feature: frontmatter.id,
            message: `AC ID "${acId}" does not match feature numeric id ${featureNum}.`,
          });
        }
      }
    }

    if (dossier.coverageGate === 'strict') {
      if (dossier.coverageIds.length === 0) {
        findings.push({
          level: 'error',
          feature,
          message:
            'Missing Coverage map rows for a strict coverage gate (expected rows like "| AC-F....-.. |").',
        });
      } else {
        const missingCoverageRows = dossier.acIds.filter(
          (acId) => !dossier.coverageIds.includes(acId),
        );
        if (missingCoverageRows.length > 0) {
          findings.push({
            level: 'error',
            feature,
            message: `Coverage map is missing AC rows: ${missingCoverageRows.join(', ')}`,
          });
        }
      }
    } else if (dossier.coverageIds.length === 0) {
      findings.push({
        level: 'warn',
        feature,
        message: 'Coverage map rows are recommended even when coverage is deferred.',
      });
    }

    if (!hasChangeLogEntry(dossier.markdown)) {
      findings.push({
        level: 'warn',
        feature,
        message: 'Missing Change log section. Add at least an initial entry for traceability.',
      });
    }

    const dependencies = Array.isArray(frontmatter.depends_on) ? frontmatter.depends_on : [];
    for (const dependency of dependencies) {
      if (typeof dependency !== 'string' || !/^F-\d{4}$/.test(dependency)) {
        findings.push({
          level: 'error',
          feature,
          message: `Invalid depends_on entry "${String(dependency)}" (expected F-0002).`,
        });
      }
    }
  }

  for (const dossier of dossiers) {
    const frontmatter = dossier.frontmatter ?? {};
    const feature = String(frontmatter.id ?? dossier.relPath);
    const dependencies = Array.isArray(frontmatter.depends_on) ? frontmatter.depends_on : [];
    for (const dependency of dependencies) {
      if (
        typeof dependency === 'string' &&
        /^F-\d{4}$/.test(dependency) &&
        !featureIds.has(dependency)
      ) {
        findings.push({
          level: 'error',
          feature,
          message: `depends_on references missing dossier: ${dependency}`,
        });
      }
    }
  }

  const errors = findings.filter((finding) => finding.level === 'error');
  const warnings = findings.filter((finding) => finding.level === 'warn');
  const byFeature = new Map();

  for (const finding of findings) {
    const key = finding.feature ?? 'global';
    if (!byFeature.has(key)) byFeature.set(key, []);
    byFeature.get(key).push(finding);
  }

  const lines = [
    `Found ${errors.length} error(s), ${warnings.length} warning(s) across ${dossiers.length} dossier(s).`,
  ];
  for (const [feature, items] of [...byFeature.entries()].sort((left, right) =>
    String(left[0]).localeCompare(String(right[0])),
  )) {
    for (const item of items) {
      lines.push(`- [${item.level.toUpperCase()}] ${feature}: ${item.message}`);
    }
  }

  console.log(lines.join('\n'));

  if (updateIndex) {
    try {
      const indexText = await readText(absIndex);
      const redFlags =
        findings.length > 0
          ? findings
              .map(
                (finding) =>
                  `- **${finding.level.toUpperCase()}** ${finding.feature ?? 'global'} — ${finding.message}`,
              )
              .join('\n')
          : '- ✅ No red flags detected.';
      const updatedIndex = replaceBlock(
        indexText,
        '<!-- BEGIN GENERATED RED_FLAGS -->',
        '<!-- END GENERATED RED_FLAGS -->',
        redFlags,
      );
      if (updatedIndex === indexText) {
        console.log(`[lint-dossiers] Red flags block already up to date in ${indexFile}.`);
      } else {
        await writeTextAtomic(absIndex, updatedIndex);
        console.log(`[lint-dossiers] Updated Red flags block in ${indexFile}.`);
      }
    } catch {
      console.warn(`[lint-dossiers] WARN: Could not update index red flags block (${indexFile}).`);
    }
  }

  if (errors.length > 0) process.exit(2);
};

main().catch((error) => {
  console.error('[lint-dossiers] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
