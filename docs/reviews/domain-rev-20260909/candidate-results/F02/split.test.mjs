import test from 'node:test';
import assert from 'node:assert/strict';
import { splitMinor } from '../../cases/F02/split.mjs';
const min=-(2n**63n), max=2n**63n-1n;
test('RULE-J1: literal results, signed remainder order, zero and full int64', () => {
  const fixtures=[
    [10n,3,[4n,3n,3n]], [-10n,3,[-4n,-3n,-3n]],
    [2n,4,[1n,1n,0n,0n]], [-2n,4,[-1n,-1n,0n,0n]],
    [0n,3,[0n,0n,0n]], [6n,3,[2n,2n,2n]],
    [min,1,[-9223372036854775808n]], [max,1,[9223372036854775807n]],
    [min,3,[-3074457345618258603n,-3074457345618258603n,-3074457345618258602n]],
    [max,3,[3074457345618258603n,3074457345618258602n,3074457345618258602n]]
  ];
  for(const [total,count,expected] of fixtures) assert.deepEqual(splitMinor(total,count),expected);
});
test('accepted count maximum preserves sum, type, sign and remainder ordering', () => {
  for(const total of [min,max,-1001n,-1n,0n,1n,1001n]) {
    const parts=splitMinor(total,1000);
    assert.equal(parts.length,1000);
    assert.equal(parts.reduce((a,b)=>a+b,0n),total);
    for(const value of parts) { assert.equal(typeof value,'bigint'); assert.ok(value>=min&&value<=max); assert.ok(total<0n?value<=0n:value>=0n); }
    const abs=parts.map(x=>x<0n?-x:x);
    assert.ok(abs[0]-abs.at(-1)<=1n);
    for(let i=1;i<abs.length;i++) assert.ok(abs[i-1]>=abs[i]);
  }
});
test('type, range and count rejection, including zero total with invalid count', () => {
  for(const total of [0,'0',null,undefined]) assert.throws(()=>splitMinor(total,1), /TYPE/);
  for(const total of [min-1n,max+1n]) assert.throws(()=>splitMinor(total,1), /RANGE/);
  for(const count of [0,-1,1001,1.5,'2',2n,NaN,Infinity,null,undefined])
    assert.throws(()=>splitMinor(0n,count), /COUNT/);
});
