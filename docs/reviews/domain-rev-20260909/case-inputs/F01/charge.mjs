import { readMinor, mulDivMinor } from './money.mjs';

export function charge(dto) {
  if (dto === null || typeof dto !== 'object' || Array.isArray(dto)) {
    throw new Error('DTO');
  }
  const keys = Reflect.ownKeys(dto);
  if (keys.length !== 2 || !keys.includes('unit') || !keys.includes('value') || dto.unit !== 'EUR-cent') {
    throw new Error('DTO');
  }
  const amount = readMinor(dto.value);
  return { unit: 'EUR-cent', value: mulDivMinor(amount, 1n, 2n, 'floor').toString() };
}
