import type { DossierRecord } from '../lib/dossier-utils.ts';

export function statusToNextStep(status: unknown): string | null {
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
      return null;
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

  return statusToNextStep(status) ?? 'next-step';
}
