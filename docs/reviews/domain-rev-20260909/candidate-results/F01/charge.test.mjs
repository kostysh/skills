import test from 'node:test';
import assert from 'node:assert/strict';
import { charge } from '../../cases/F01/charge.mjs';

test('RULE-E1: exact fixed floor values including negative ties and int64 limits', () => {
  const fixtures = [
    ['0','0'], ['1','0'], ['-1','-1'], ['3','1'], ['-3','-2'],
    ['4','2'], ['-4','-2'], ['9223372036854775807','4611686018427387903'],
    ['-9223372036854775808','-4611686018427387904']
  ];
  for(const [value,expected] of fixtures) {
    const dto={unit:'EUR-cent',value};
    assert.deepEqual(charge(dto),{unit:'EUR-cent',value:expected});
    assert.deepEqual(dto,{unit:'EUR-cent',value});
  }
});
test('exact DTO shape and currency unit reject invalid inputs', () => {
  const bad=[null,[],undefined,{}, {unit:'EUR-cent'}, {value:'1'},
    {unit:'JPY',value:'1'}, {unit:'EUR',value:'1'},
    {unit:'EUR-cent',value:'1',extra:true},
    {unit:'EUR-cent',value:'1',[Symbol('extra')]:true}];
  for(const dto of bad) assert.throws(()=>charge(dto), /DTO/);
});
test('engine parser rejects noncanonical strings, wrong value types and over-range', () => {
  for(const value of ['', ' 1', '1 ', '+1', '-0', '01', '1.0', '1e2', '1,00', 1, 1n, null])
    assert.throws(()=>charge({unit:'EUR-cent',value}), /FORMAT/);
  for(const value of ['9223372036854775808','-9223372036854775809'])
    assert.throws(()=>charge({unit:'EUR-cent',value}), /RANGE/);
});
