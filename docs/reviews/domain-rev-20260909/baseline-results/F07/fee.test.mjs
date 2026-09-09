import assert from 'node:assert/strict';
import { feeFromInput } from '../../cases/F07/fee.mjs';
const fixtures = [
  ['1999', '99950'], ['0', '0'], ['-0.00', '0'], ['0.01', '1'], ['-0.01', '-1'],
  ['1.23', '62'], ['-1.23', '-62'], ['1.2', '60'], ['-1.2', '-60'],
  ['184467440737095516.14', '9223372036854775807'],
  ['-184467440737095516.16', '-9223372036854775808'],
];
for (const [input, expected] of fixtures) assert.deepEqual(feeFromInput(input), { currency: 'EUR', amountCents: expected });
for (const input of ['', ' 1', '1 ', '+1', '.5', '1.', '1,20', '1e3', '01', '1.001', 'NaN', 1, 1n, null, {}, undefined]) assert.throws(() => feeFromInput(input));
for (const input of ['184467440737095516.15', '-184467440737095516.17']) assert.throws(() => feeFromInput(input), /RANGE/);
console.log('F07: 11 literal results; 16 invalid inputs; 2 output overflows checked.');
