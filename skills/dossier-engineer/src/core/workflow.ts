import type { DossierRecord } from '../lib/dossier-utils.ts';

export interface CandidateRecord {
  area: string;
  dependsOn: string;
  dossier: string;
  id: string;
  status: string;
  title: string;
  why: string;
}

export function parseCandidates(markdown: string): CandidateRecord[] {
  const candidates: CandidateRecord[] = [];
  for (const line of String(markdown).split(/\r?\n/)) {
    if (!/^\|\s*CF-\d+\s*\|/.test(line)) {
      continue;
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 7) {
      continue;
    }
    const [id = '', title = '', area = '', status = '', dependsOn = '', why = '', dossier = ''] =
      cells;
    candidates.push({ area, dependsOn, dossier, id, status, title, why });
  }
  return candidates;
}

export function statusToNextStep(status: unknown): string {
  switch (status) {
    case 'proposed':
      return 'spec-compact';
    case 'shaped':
      return 'plan-slice';
    case 'planned':
    case 'in_progress':
      return 'implementation';
    case 'done':
      return 'none';
    case 'parked':
      return 'resume-or-discard';
    default:
      return 'feature-intake';
  }
}

export function selectActiveDossier(dossiers: DossierRecord[]): DossierRecord | null {
  const priority = ['in_progress', 'planned', 'shaped', 'proposed', 'parked', 'done'];
  return (
    [...dossiers].sort((left, right) => {
      const leftPriority = priority.indexOf(String(left.frontmatter.status));
      const rightPriority = priority.indexOf(String(right.frontmatter.status));
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return String(left.frontmatter.id).localeCompare(String(right.frontmatter.id));
    })[0] ?? null
  );
}

export function defaultNextStep(status: unknown, step: string): string {
  if (step === 'feature-intake') {
    return 'spec-compact';
  }
  if (step === 'spec-compact') {
    return 'plan-slice';
  }
  if (step === 'plan-slice') {
    return 'implementation';
  }
  if (step === 'change-proposal') {
    return 'contract-drift-audit';
  }

  switch (status) {
    case 'proposed':
      return 'spec-compact';
    case 'shaped':
      return 'plan-slice';
    case 'planned':
    case 'in_progress':
      return 'implementation';
    case 'done':
      return 'none';
    case 'parked':
      return 'resume-or-discard';
    default:
      return 'next-step';
  }
}
