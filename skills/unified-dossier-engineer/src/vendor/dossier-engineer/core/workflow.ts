const WORKFLOW_STAGES = new Set([
  'spec-compact',
  'plan-slice',
  'implementation',
  'change-proposal',
]);

export function normalizeWorkflowStage(value: unknown): string | null {
  return typeof value === 'string' && WORKFLOW_STAGES.has(value) ? value : null;
}

export function statusToNextStep(status: unknown): string | null {
  switch (status) {
    case 'proposed':
      return 'spec-compact';
    case 'shaped':
      return 'plan-slice';
    case 'planned':
    case 'in_progress':
      return 'implementation';
    default:
      return null;
  }
}

export function defaultNextStep(status: unknown, step: string): string | null {
  if (step === 'feature-intake') {
    return 'spec-compact';
  }
  if (step === 'spec-compact') {
    return 'plan-slice';
  }
  if (step === 'plan-slice') {
    return 'implementation';
  }

  return statusToNextStep(status);
}
