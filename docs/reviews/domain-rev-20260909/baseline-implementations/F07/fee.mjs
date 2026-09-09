import { parseEurToCents, mulRatePpm } from './money.mjs';

export function feeFromInput(input) {
  const cents = parseEurToCents(input);
  const fee = mulRatePpm(cents, 500000n);
  return { currency: 'EUR', amountCents: fee.toString() };
}
