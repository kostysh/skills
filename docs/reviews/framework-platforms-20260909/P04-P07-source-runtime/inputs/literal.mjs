import {spawnSync} from 'node:child_process'
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import literal from './literal-hook.mjs'
const root=path.dirname(new URL(import.meta.url).pathname)
const [stage,mode,outcome]=process.argv.slice(2)
if(!stage){
 mkdirSync(path.join(root,'observed'),{recursive:true})
 const results=[]
 for(const mode of ['default','reference-enabled'])for(const outcome of ['success','failure']){
  const stem=`literal-${mode}-${outcome}`
  for(const suffix of ['','-shm','-wal'])rmSync(path.join(root,'observed',stem+'.sqlite'+suffix),{force:true})
  for(const stage of ['operate','observe']){
   const run=spawnSync(process.execPath,['--import','tsx',import.meta.filename,stage,mode,outcome],{stdio:'inherit',timeout:45000})
   assert.equal(run.status,0,`${stem}/${stage}: ${run.error??''}`)
  }
  const observed=JSON.parse(readFileSync(path.join(root,'observed',stem+'.json'),'utf8'))
  const operation=JSON.parse(readFileSync(path.join(root,'observed',stem+'-operation.json'),'utf8'))
  assert.equal(observed.parents.length,outcome==='failure'&&mode==='reference-enabled'?0:1)
  assert.equal(observed['audit-log'].length,outcome==='success'?1:0)
  if(outcome==='success')assert.equal(observed['audit-log'][0].docId,observed.parents[0].id)
  if(outcome==='failure'&&mode==='reference-enabled')assert.deepEqual(observed,operation.before)
  results.push({mode,outcome,operation,observed})
 }
 writeFileSync(path.join(root,'observed','literal-results.json'),JSON.stringify(results,null,2)+'\n')
 console.log(JSON.stringify({kind:'literal root hook source probe',expectationsMatched:true,branches:results.length}))
}else{
 const {getPayload,buildConfig}=await import('payload')
 const {sqliteAdapter}=await import('@payloadcms/db-sqlite')
 const stem=`literal-${mode}-${outcome}`
 let operationError=null
 const payload=await getPayload({config:buildConfig({
  secret:'synthetic-local-literal-probe-only',
  db:sqliteAdapter({client:{url:'file:'+path.join(root,'observed',stem+'.sqlite')},push:stage==='operate',...(mode==='reference-enabled'?{transactionOptions:{}}:{})}),
  collections:[
   {slug:'parents',fields:[{name:'sourceKey',type:'text',required:true}],...literal},
   {slug:'audit-log',fields:[{name:'docId',type:'number',required:true}],hooks:{beforeChange:[({data,req})=>{if(req.context.controlledFailure)throw Error('P04_LITERAL_CONTROLLED_FAILURE');return data}]}},
  ],
 })})
 const read=async()=>{const rows={};for(const collection of ['parents','audit-log'])rows[collection]=(await payload.find({collection,depth:0,limit:100,overrideAccess:true})).docs;return rows}
 try{
  if(stage==='operate'){
   const before=await read()
   try{await payload.create({collection:'parents',data:{sourceKey:'literal-1'},context:{controlledFailure:outcome==='failure'}})}catch(error){operationError=error.message}
   assert.equal(operationError,outcome==='failure'?'P04_LITERAL_CONTROLLED_FAILURE':null)
   writeFileSync(path.join(root,'observed',stem+'-operation.json'),JSON.stringify({before,operationError},null,2)+'\n')
  }else writeFileSync(path.join(root,'observed',stem+'.json'),JSON.stringify(await read(),null,2)+'\n')
 }finally{await payload.destroy()}
 process.exit(0)
}
