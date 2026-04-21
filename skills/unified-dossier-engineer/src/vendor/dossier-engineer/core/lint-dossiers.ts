import {
  COVERAGE_GATES,
  DOSSIER_STATUSES,
  extractFeatureNumericId,
  hasChangeLogEntry,
  type DossierRecord,
} from '../lib/dossier-utils.ts';
import {
  BEFORE_PLANNED_CUE_PATTERN,
  BOUNDARY_TRIGGER_PATTERN,
  COMPOUND_AC_PATTERN,
  CONTRACT_CUE_PATTERN,
  countBulletEntries,
  DEPENDENCY_NOTE_PATTERN,
  DOD_HEADING_PATTERN,
  extractAcStatementLines,
  getSectionText,
  hasHeading,
  isPlannedOrLaterStatus,
  isShapedOrLaterStatus,
  MEASURABLE_NFR_CUE_PATTERN,
  OPEN_QUESTION_READY_CUE_PATTERN,
  OWNER_CUE_PATTERN,
  RAW_TBD_PATTERN,
  REPLANNING_REASON_TAG_PATTERN,
  ROLLOUT_HEADING_PATTERN,
  ROLLOUT_TRIGGER_PATTERN,
  sectionLooksExplicitlyNone,
  UNBLOCK_CUE_PATTERN,
  VERIFICATION_HEADING_PATTERN,
  collectExecutableSectionLines,
  VAGUE_EXECUTABLE_PATTERNS,
} from './markdown.ts';

export interface LintFinding {
  feature?: string;
  level: 'error' | 'warn';
  message: string;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function stringOrFallback(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function frontmatterString(
  frontmatter: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  return stringOrFallback(frontmatter[key], fallback);
}

function describeValue(value: unknown): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value) ?? '[unserializable]';
  } catch {
    return '[unserializable]';
  }
}

export function analyzeDossiers(dossiers: DossierRecord[]): LintFinding[] {
  const findings: LintFinding[] = [];
  const featureIds = new Set<string>();

  for (const dossier of dossiers) {
    const frontmatter = dossier.frontmatter ?? {};
    const feature = frontmatterString(frontmatter, 'id', dossier.relPath);
    const required: Array<[string, unknown]> = [
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
        message: `Invalid feature id "${describeValue(frontmatter.id)}" (expected F-0001).`,
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
        message: `Invalid status "${describeValue(frontmatter.status)}" (allowed: ${[...DOSSIER_STATUSES].join(', ')}).`,
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
    ] as const) {
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
        message: `Invalid coverage_gate "${describeValue(frontmatter.coverage_gate)}" (allowed: ${[...COVERAGE_GATES].join(', ')}).`,
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
        level: frontmatter.status === 'proposed' ? 'warn' : 'error',
        feature,
        message:
          frontmatter.status === 'proposed'
            ? 'No acceptance criteria IDs found yet. Add at least one AC-F....-.. entry before leaving the proposed intake state.'
            : 'No acceptance criteria IDs found. Add at least one AC-F....-.. entry.',
      });
    }

    const featureNum = extractFeatureNumericId(
      typeof frontmatter.id === 'string' ? frontmatter.id : null,
    );
    if (featureNum) {
      for (const acId of dossier.acIds) {
        if (!acId.startsWith(`AC-F${featureNum}-`)) {
          findings.push({
            level: 'error',
            feature: String(frontmatter.id),
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

    const status = frontmatter.status;
    if (isShapedOrLaterStatus(status) && !hasHeading(dossier.markdown, DOD_HEADING_PATTERN)) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'Missing Definition of Done section for a shaped/planned+ dossier. Add a compact closure target before implementation.',
      });
    }

    if (
      isShapedOrLaterStatus(status) &&
      !hasHeading(dossier.markdown, VERIFICATION_HEADING_PATTERN) &&
      dossier.coverageIds.length === 0
    ) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'Missing verification cue for a shaped/planned+ dossier. Add a verification section or an initial coverage plan.',
      });
    }

    const designText = getSectionText(dossier.markdown, /design/i);
    const openQuestionsText = getSectionText(dossier.markdown, /open questions/i);
    const slicingText = getSectionText(dossier.markdown, /slicing plan/i);
    const changeLogText = getSectionText(dossier.markdown, /change log/i);
    if (
      isShapedOrLaterStatus(status) &&
      designText &&
      BOUNDARY_TRIGGER_PATTERN.test(designText) &&
      !CONTRACT_CUE_PATTERN.test(designText)
    ) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'Boundary I/O appears in the compact design, but no contract/schema/error-model cue was found. Add a compact contract sketch or link to the canonical contract.',
      });
    }

    const nfrText = getSectionText(dossier.markdown, /\bnon-functional\b|\bnfr\b/i);
    if (isShapedOrLaterStatus(status) && nfrText && !MEASURABLE_NFR_CUE_PATTERN.test(nfrText)) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'NFR section looks aspirational. Add a metric, budget/threshold, or observable signal for any normative NFR.',
      });
    }

    if (
      isShapedOrLaterStatus(status) &&
      openQuestionsText &&
      !sectionLooksExplicitlyNone(openQuestionsText) &&
      !OPEN_QUESTION_READY_CUE_PATTERN.test(openQuestionsText)
    ) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'Open questions are present without a planning-readiness cue. Add owner/date plus `needed_by: before_planned|before_implementation|before_done` and a next decision path.',
      });
    }

    if (
      isPlannedOrLaterStatus(status) &&
      openQuestionsText &&
      BEFORE_PLANNED_CUE_PATTERN.test(openQuestionsText)
    ) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'A planned/in-progress dossier still contains an open question marked `needed_by: before_planned`. Resolve it or reclassify the readiness gate before keeping the dossier planned+.',
      });
    }

    const dependsOn = toStringArray(frontmatter.depends_on);
    if (
      isPlannedOrLaterStatus(status) &&
      dependsOn.length > 0 &&
      (!slicingText ||
        !DEPENDENCY_NOTE_PATTERN.test(slicingText) ||
        !OWNER_CUE_PATTERN.test(slicingText) ||
        !UNBLOCK_CUE_PATTERN.test(slicingText))
    ) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'Planned+ dossier has dependencies, but the slicing plan does not show clear `Depends on:` visibility with owner and unblock condition. Add the dependency note where it affects delivery order.',
      });
    }

    if (
      isPlannedOrLaterStatus(status) &&
      `${designText}\n${slicingText}`.trim() &&
      ROLLOUT_TRIGGER_PATTERN.test(`${designText}\n${slicingText}`) &&
      !hasHeading(dossier.markdown, ROLLOUT_HEADING_PATTERN)
    ) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'Planning/design text suggests rollout order matters, but no rollout / activation note was found. Add a compact activation order and rollback-limits note.',
      });
    }

    if (
      isPlannedOrLaterStatus(status) &&
      countBulletEntries(changeLogText) > 1 &&
      !REPLANNING_REASON_TAG_PATTERN.test(changeLogText)
    ) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'Change log shows mature replanning, but no short reason tags were found. Prefer tags like `[clarification]`, `[scope realignment]`, `[dependency realignment]`, `[risk discovery]`, or `[contract drift]`.',
      });
    }

    const compoundAcIds = extractAcStatementLines(dossier.markdown)
      .filter(({ line }) => COMPOUND_AC_PATTERN.test(line))
      .map(({ acId }) => acId);
    if (compoundAcIds.length > 0) {
      findings.push({
        level: 'warn',
        feature,
        message: `Potential compound ACs detected: ${compoundAcIds.join(', ')}. Prefer one obligation per AC.`,
      });
    }

    const executableLines = collectExecutableSectionLines(dossier.markdown);
    if (executableLines.some((line) => RAW_TBD_PATTERN.test(line))) {
      findings.push({
        level: 'warn',
        feature,
        message:
          'Raw TBD found in executable sections. Convert it into an Open question with an owner/date or explicit next decision path.',
      });
    }

    const vagueMatches = executableLines.flatMap((line) =>
      VAGUE_EXECUTABLE_PATTERNS.filter(({ pattern }) => pattern.test(line)).map(({ label }) => ({
        label,
        line,
      })),
    );
    if (vagueMatches.length > 0) {
      const samples = vagueMatches
        .slice(0, 2)
        .map(({ label, line }) => `"${label}" in "${line}"`)
        .join('; ');
      findings.push({
        level: 'warn',
        feature,
        message: `Vague wording in executable sections: ${samples}. Rewrite the statement more concretely.`,
      });
    }

    for (const dependency of toStringArray(frontmatter.depends_on)) {
      if (!/^F-\d{4}$/.test(dependency)) {
        findings.push({
          level: 'error',
          feature,
          message: `Invalid depends_on entry "${dependency}" (expected F-0002).`,
        });
      }
    }
  }

  for (const dossier of dossiers) {
    const frontmatter = dossier.frontmatter ?? {};
    const feature = frontmatterString(frontmatter, 'id', dossier.relPath);
    for (const dependency of toStringArray(frontmatter.depends_on)) {
      if (/^F-\d{4}$/.test(dependency) && !featureIds.has(dependency)) {
        findings.push({
          level: 'error',
          feature,
          message: `depends_on references missing dossier: ${dependency}`,
        });
      }
    }
  }

  return findings;
}

export function renderLintSummary(findings: LintFinding[], dossierCount: number): string {
  const errors = findings.filter((finding) => finding.level === 'error');
  const warnings = findings.filter((finding) => finding.level === 'warn');
  const byFeature = new Map<string, LintFinding[]>();

  for (const finding of findings) {
    const key = finding.feature ?? 'global';
    if (!byFeature.has(key)) {
      byFeature.set(key, []);
    }
    byFeature.get(key)?.push(finding);
  }

  const lines = [
    `Found ${errors.length} error(s), ${warnings.length} warning(s) across ${dossierCount} dossier(s).`,
  ];
  for (const [feature, items] of [...byFeature.entries()].sort((left, right) =>
    String(left[0]).localeCompare(String(right[0])),
  )) {
    for (const item of items) {
      lines.push(`- [${item.level.toUpperCase()}] ${feature}: ${item.message}`);
    }
  }
  return lines.join('\n');
}

export function buildRedFlagsBlock(findings: LintFinding[]): string {
  return findings.length > 0
    ? findings
        .map(
          (finding) =>
            `- **${finding.level.toUpperCase()}** ${finding.feature ?? 'global'} — ${finding.message}`,
        )
        .join('\n')
    : '- ✅ No red flags detected.';
}
