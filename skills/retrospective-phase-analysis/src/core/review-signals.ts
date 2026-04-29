import type { ReviewSignal } from './types.ts';

export function isActionableReviewSignal(signal: ReviewSignal): boolean {
  return signal.classification === 'active_unmatched';
}

export function isContextReviewSignal(signal: ReviewSignal): boolean {
  return signal.classification === 'historical' || signal.classification === 'superseded';
}
