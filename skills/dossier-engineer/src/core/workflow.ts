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
