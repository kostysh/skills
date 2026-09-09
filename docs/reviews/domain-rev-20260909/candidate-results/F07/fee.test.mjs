import test from 'node:test';
import assert from 'node:assert/strict';
import {feeFromInput} from '../../cases/F07/fee.mjs';
test('RULE-E7: human EUR input, half-away ties and preserved EUR DTO',()=>{
  for(const [input,expected] of [['0','0'],['-0','0'],['1999','99950'],['19.99','1000'],['0.01','1'],['-0.01','-1'],['0.03','2'],['-0.03','-2'],['1.2','60'],['-1.20','-60']])
    assert.deepEqual(feeFromInput(input),{currency:'EUR',amountCents:expected});
});
test('public parser rejects unsupported syntax and non-string inputs',()=>{
  for(const input of ['', ' 1', '1 ', '+1', '01', '.1', '1.', '1.001', '1,20', '1e2', 1, 1n, null, undefined, {}, ['1']])
    assert.throws(()=>feeFromInput(input),/FORMAT/);
});
test('public arithmetic checks output int64 without inventing an input bound',()=>{
  assert.deepEqual(feeFromInput('184467440737095516.14'),{currency:'EUR',amountCents:'9223372036854775807'});
  assert.deepEqual(feeFromInput('-184467440737095516.16'),{currency:'EUR',amountCents:'-9223372036854775808'});
  for(const input of ['184467440737095516.15','-184467440737095516.17'])
    assert.throws(()=>feeFromInput(input),/RANGE/);
});
