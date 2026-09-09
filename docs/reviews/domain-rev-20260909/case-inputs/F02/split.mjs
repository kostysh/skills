const MIN = -(2n ** 63n);
const MAX = 2n ** 63n - 1n;

export function splitMinor(total, count) {
  if (typeof total !== 'bigint') throw new Error('TYPE');
  if (total < MIN || total > MAX) throw new Error('RANGE');
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('COUNT');
  const sign = total < 0n ? -1n : 1n;
  const absolute = total < 0n ? -total : total;
  const divisor = BigInt(count);
  const quotient = absolute / divisor;
  const remainder = absolute % divisor;
  return Array.from({ length: count }, (_, index) =>
    (quotient + (BigInt(index) < remainder ? 1n : 0n)) * sign);
}
