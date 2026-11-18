import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readMinor, mulDivMinor } from '../../../domain-rev-20260909/case-inputs/F01/money.mjs';

const source = readFileSync(new URL('./preview-input.json', import.meta.url));
const { contract, now, cases } = JSON.parse(source);

function calculate(request) {
  const { id, subjectKey, unitMinor, currency, scale, quantity, expiresAt } = request;
  if (!Number.isSafeInteger(id) || id <= 0 ||
      typeof subjectKey !== 'string' || !/^synthetic-[0-9]+$/u.test(subjectKey) ||
      currency !== 'EUR' || scale !== 2 ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 10 ||
      !Number.isSafeInteger(now) || !Number.isSafeInteger(expiresAt) || expiresAt <= now) {
    throw new Error('INPUT');
  }
  const net = mulDivMinor(readMinor(unitMinor), BigInt(quantity), 1n, 'floor');
  const fee = mulDivMinor(net, 1n, 2n, 'floor');
  const row = { id, subjectKey, netMinor: net.toString(), feeMinor: fee.toString(), expiresAt };
  return { row, export: { id, subjectKey, feeMinor: row.feeMinor } };
}

const results = cases.map(({ case: name, request, expected }) => {
  let actual;
  try {
    actual = calculate(request);
  } catch (error) {
    if (!['INPUT', 'FORMAT', 'RANGE'].includes(error.message)) throw error;
    actual = { error: error.message === 'RANGE' ? 'range' : 'input' };
  }
  assert.deepEqual(actual, expected, name);
  return { case: name, id: request.id, ...actual };
});
const fixtureSha256 = createHash('sha256').update(source).digest('hex');
console.log(JSON.stringify({ contract, node: process.version, fixtureSha256, results }, null, 2));
