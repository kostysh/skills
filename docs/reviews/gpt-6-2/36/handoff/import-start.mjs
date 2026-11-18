import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { init, open } from './target.mjs';
import { eastReader, visible } from './reader.mjs';

const cms = await open(resolve(process.argv[2]));
try {
  await init(cms);
  const sections = (await cms.find({collection:'sections',overrideAccess:true,depth:0,sort:'id'}))
    .docs.map(({id, sourceKey, title}) => ({id, sourceKey, title}));
  const records = await visible(cms, await eastReader(cms));
  const result = records.map(row => ({...row, sectionKey:sections.find(s => s.id === row.section)?.sourceKey}));
  assert.deepEqual(result.map(row=>[row.sourceKey,row.sectionKey]),[['LOCAL-01','LOCAL']]);
  console.log('IMPORT-START ' + JSON.stringify({sections,reader:'east',records:result}));
} finally { await cms.destroy(); }
