import assert from 'node:assert/strict';
import {
  EUR, createCurrencyEngine, formatEurCents, parseEurCentsDto, roundDiv,
  serializeEurCentsDto, setCompatibilityMode, setMathMode,
} from 'money';

setCompatibilityMode('postgresql');
setMathMode('safe');
const cents = 9007199254740993n;
const tagged = EUR.fromMinorUnits(cents);
const legacyDto = serializeEurCentsDto(cents);
const taggedDto = EUR.serializeDto(tagged);
assert.deepEqual(EUR.definition, { code: 'EUR', minorUnitDigits: 2 });
assert.equal(Object.hasOwn(EUR, 'code'), false);
assert.equal(Object.isFrozen(EUR) && Object.isFrozen(EUR.definition), true);
assert.equal(typeof cents, 'bigint');
assert.deepEqual(tagged, { currency: 'EUR', minorUnitDigits: 2, minorUnits: cents });
assert.deepEqual(legacyDto, { currency: 'EUR', amountCents: '9007199254740993' });
assert.deepEqual(taggedDto, { currency: 'EUR', minorUnitDigits: 2, amountMinorUnits: '9007199254740993' });
assert.equal(parseEurCentsDto(legacyDto), cents);
assert.equal(EUR.toMinorUnits(EUR.parseDto(taggedDto)), cents);
assert.throws(() => EUR.parseDto(legacyDto));
assert.throws(() => parseEurCentsDto(taggedDto));
const yen = createCurrencyEngine({ code: 'JPY', minorUnitDigits: 0 });
const quoted = createCurrencyEngine({ code: 'KWD', minorUnitDigits: 3 });
assert.equal(yen.toMinorUnits(yen.parseMajorUnits('123')), 123n);
assert.equal(quoted.toMinorUnits(quoted.parseMajorUnits('1.234')), 1234n);
assert.throws(() => EUR.add(tagged, yen.fromMinorUnits(cents)));
assert.throws(() => EUR.add(tagged, { ...tagged, minorUnitDigits: 3 }));
assert.throws(() => formatEurCents(cents, { currency: 'USD' }));
assert.equal(roundDiv(-5n, 2n, 'FLOOR'), -3n);
assert.equal(roundDiv(-5n, 2n, 'HALF_AWAY_FROM_ZERO'), -3n);
assert.equal(roundDiv(5n, 2n, 'FLOOR'), 2n);
assert.equal(roundDiv(5n, 2n, 'HALF_AWAY_FROM_ZERO'), 3n);
console.log(JSON.stringify({
  node: process.version, engineDefinition: EUR.definition, codeOnEngine: Object.hasOwn(EUR, 'code'),
  typedAmount: { ...tagged, minorUnits: tagged.minorUnits.toString(), inMemoryType: typeof tagged.minorUnits },
  legacyDto, taggedDto, bothStrictRoundTrips: true, rejectsSwappedDtoContracts: true,
  rejectsWrongCurrencyOrScale: true, rejectsRelabelOption: true,
  JPY_123_major_in_minor: '123', KWD_1_234_major_in_minor: '1234',
  signedRounding: { negative5Floor: '-3', negative5HalfAway: '-3', positive5Floor: '2', positive5HalfAway: '3' }
}, null, 2));
