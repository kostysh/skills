import { parseEurToCents, mulRatePpm } from './money.mjs';

export function feeFromInput(input) {
  const amount = parseEurToCents(input);
  const fee = mulRatePpm(amount, 500000n);
  return { currency: 'EUR', amountCents: fee.toString() };
}
