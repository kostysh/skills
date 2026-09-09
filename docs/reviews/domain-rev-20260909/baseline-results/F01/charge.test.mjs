import assert from 'node:assert/strict';
import { charge } from '../../cases/F01/charge.mjs';
const fixtures = [
  ['0', '0'], ['1', '0'], ['-1', '-1'], ['3', '1'], ['-3', '-2'],
  ['4', '2'], ['-4', '-2'],
  ['9223372036854775807', '4611686018427387903'],
  ['-9223372036854775808', '-4611686018427387904'],
];
for (const [value, expected] of fixtures) {
  const input = Object.freeze({ unit: 'EUR-cent', value });
  assert.deepEqual(charge(input), { unit: 'EUR-cent', value: expected });
}
for (const value of ['01', '-0', '+1', '1.0', '', ' 1', '1e2', '9223372036854775808', '-9223372036854775809', 1, 1n, null]) {
  assert.throws(() => charge({ unit: 'EUR-cent', value }));
}
for (const input of [null, [], {}, { unit: 'EUR-cent' }, { value: '1' }, { unit: 'JPY', value: '1' }, { unit: 'EUR-cent', value: '1', extra: 0 }, { unit: 'EUR-cent', value: '1', [Symbol('extra')]: 0 }, Object.create({ unit: 'EUR-cent', value: '1' })]) {
  assert.throws(() => charge(input));
}
console.log('F01: 9 literal results; 12 invalid values; 9 invalid DTOs checked.');
