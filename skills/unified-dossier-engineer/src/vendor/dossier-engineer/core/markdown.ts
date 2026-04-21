export const EXECUTABLE_SECTION_PATTERNS = [
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
  /rollout/i,
  /activation/i,
  /edge cases/i,
  /failure modes/i,
  /slicing plan/i,
];

export const DOD_HEADING_PATTERN = /^#{2,6}\s+.*definition of done.*$/im;
export const VERIFICATION_HEADING_PATTERN =
  /^#{2,6}\s+.*(verification|test plan|coverage map).*$/im;
export const ROLLOUT_HEADING_PATTERN = /^#{2,6}\s+.*(rollout|activation|cutover|rollback).*$/im;
export const BOUNDARY_TRIGGER_PATTERN =
  /`?(GET|POST|PUT|PATCH|DELETE)\s+\/|^\s*-\s*(body|response|payload|dto|event|webhook)\b/im;
export const CONTRACT_CUE_PATTERN =
  /\b(contract|schema|openapi|json schema|error model|retry|idempotent|idempotency|backward-compat|compatibility)\b/i;
export const MEASURABLE_NFR_CUE_PATTERN =
  /\b(metric|metrics|budget|threshold|signal|signals|p\d{2}|latency|availability|throughput|counter|gauge|histogram|log|logs|trace|traces|event|events|ms|seconds?|minutes?|hours?)\b/i;
export const OPEN_QUESTION_READY_CUE_PATTERN = /\bneeded[_ ]by\b/i;
export const BEFORE_PLANNED_CUE_PATTERN = /\bneeded[_ ]by\b[^\n]*\bbefore[_ -]planned\b/i;
export const DEPENDENCY_NOTE_PATTERN = /^\s*(?:[-*]\s*)?depends on:\s*/im;
export const OWNER_CUE_PATTERN = /@\w+|\bowner\b/i;
export const UNBLOCK_CUE_PATTERN = /\bunblock\b/i;
export const ROLLOUT_TRIGGER_PATTERN =
  /\b(feature flag|backfill|cutover|activation|rollback|rollout|dual[- ]write|migrat(?:e|ion)|irreversible)\b/i;
export const REPLANNING_REASON_TAG_PATTERN =
  /\[(clarification|scope realignment|dependency realignment|risk discovery|contract drift)\]/i;
export const COMPOUND_AC_PATTERN = /\b(and\/or|and|or)\b/i;
export const RAW_TBD_PATTERN = /\bTBD\b/i;
export const VAGUE_EXECUTABLE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'etc.', pattern: /\betc\./i },
  { label: 'usually', pattern: /\busually\b/i },
  { label: 'as appropriate', pattern: /\bas appropriate\b/i },
  { label: 'fast', pattern: /\bfast\b/i },
  { label: 'user-friendly', pattern: /\buser-friendly\b/i },
];

export function parseTopLevelSections(markdown: string): Map<string, string> {
  const source = String(markdown ?? '');
  const lines = source.split(/\r?\n/);
  const sections = new Map<string, string>();
  let currentHeading = '__preamble__';
  let buffer: string[] = [];

  const flush = () => {
    sections.set(currentHeading, buffer.join('\n').trim());
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1]?.trim() ?? '__preamble__';
      buffer = [];
      continue;
    }
    buffer.push(line);
  }
  flush();
  return sections;
}

export function normalizeSectionText(text: string | undefined): string {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

export function getSectionText(markdown: string, headingPattern: RegExp): string {
  const sections = parseTopLevelSections(markdown);
  return [...sections.entries()]
    .filter(([heading]) => heading !== '__preamble__' && headingPattern.test(heading))
    .map(([, body]) => body)
    .join('\n')
    .trim();
}

export function hasHeading(markdown: string, headingPattern: RegExp): boolean {
  return headingPattern.test(String(markdown));
}

export function collectExecutableSectionLines(markdown: string): string[] {
  const sections = parseTopLevelSections(markdown);
  const lines: string[] = [];
  for (const [heading, body] of sections) {
    if (heading === '__preamble__') {
      continue;
    }
    if (!EXECUTABLE_SECTION_PATTERNS.some((pattern) => pattern.test(heading))) {
      continue;
    }
    lines.push(...String(body).split(/\r?\n/));
  }
  return lines.map((line) => line.trim()).filter(Boolean);
}

export function extractAcStatementLines(markdown: string): Array<{ acId: string; line: string }> {
  const lines = String(markdown).split(/\r?\n/);
  const acStatements: Array<{ acId: string; line: string }> = [];
  for (const line of lines) {
    const match = line.match(/\b(AC-F\d{4}-\d{1,2})\b/);
    if (!match) {
      continue;
    }
    const acId = (match[1] ?? '').replace(
      /-(\d{1,2})$/,
      (_, number: string) => `-${number.padStart(2, '0')}`,
    );
    acStatements.push({ acId, line: line.trim() });
  }
  return acStatements;
}

export function isShapedOrLaterStatus(status: unknown): boolean {
  return ['shaped', 'planned', 'in_progress', 'done'].includes(String(status));
}

export function isPlannedOrLaterStatus(status: unknown): boolean {
  return ['planned', 'in_progress', 'done'].includes(String(status));
}

export function sectionLooksExplicitlyNone(text: string): boolean {
  return /\bnone\b|\bno open questions\b/i.test(String(text));
}

export function countBulletEntries(text: string): number {
  return String(text)
    .split(/\r?\n/)
    .filter((line) => /^\s*-\s+/.test(line)).length;
}

export function hasExecutableSectionChange(
  beforeSections: Map<string, string>,
  afterSections: Map<string, string>,
): string[] {
  const changedSections: string[] = [];
  const allHeadings = new Set([...beforeSections.keys(), ...afterSections.keys()]);
  for (const heading of allHeadings) {
    if (heading === '__preamble__') {
      continue;
    }
    const before = normalizeSectionText(beforeSections.get(heading));
    const after = normalizeSectionText(afterSections.get(heading));
    if (before === after) {
      continue;
    }
    if (EXECUTABLE_SECTION_PATTERNS.some((pattern) => pattern.test(heading))) {
      changedSections.push(heading);
    }
  }
  return changedSections;
}
