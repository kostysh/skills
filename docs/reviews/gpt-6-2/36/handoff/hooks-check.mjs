import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { buildConfig, getPayload } from 'payload';
import { sqliteAdapter } from '@payloadcms/db-sqlite';

const [directory, mode] = process.argv.slice(2);
assert.ok(['default', 'enabled'].includes(mode));
const enabled = mode === 'enabled';
const Seen = [];
const config = buildConfig({
  secret: randomBytes(32).toString('hex'), telemetry:false, typescript:{autoGenerate:false},
  db: sqliteAdapter({client:{url:'file:' + resolve(directory,mode + '.sqlite')},push:true,
    ...(enabled ? {transactionOptions:{}} : {})}),
  collections: [
    {slug:'receipts',fields:[{name:'code',type:'text',required:true}]},
    {slug:'letters',fields:[{name:'code',type:'text',required:true}],hooks:{
      beforeChange:[({data}) => ({...data,code:data.code.trim().toUpperCase()})],
      afterChange:[async ({doc,req}) => {
        Seen.push({code:doc.code,transactionIDPresent:(await req.transactionID) != null});
        await req.payload.create({collection:'receipts',req,overrideAccess:true,data:{code:doc.code}});
        if (doc.code === 'DEFER') throw new Error('Fixture postpones this letter');
      }],
    }},
  ],
});
const cms = await getPayload({config});
const read = async collection => (await cms.find({collection,overrideAccess:true,sort:'id',depth:0})).docs.map(row=>row.code);
try {
  await cms.create({collection:'letters',data:{code:' ready '},overrideAccess:true});
  assert.deepEqual(await read('receipts'),['READY']);
  await assert.rejects(cms.create({collection:'letters',data:{code:' defer '},overrideAccess:true}),/Fixture postpones/);
  const output = {mode,hookEvents:Seen,letters:await read('letters'),receipts:await read('receipts')};
  const expected = enabled ? ['READY'] : ['READY','DEFER'];
  assert.deepEqual(output.letters,expected);
  assert.deepEqual(output.receipts,expected);
  assert.ok(Seen.every(event=>event.transactionIDPresent === enabled));
  console.log('HOOK-CHECK ' + JSON.stringify(output));
} finally {await cms.destroy()}
