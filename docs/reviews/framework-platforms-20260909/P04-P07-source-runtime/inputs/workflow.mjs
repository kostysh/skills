import {spawnSync} from 'node:child_process'
import {mkdirSync,rmSync,writeFileSync,readFileSync} from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import workflow,{sideEffects} from './literal-workflow.mjs'
const root=path.dirname(new URL(import.meta.url).pathname)
const stage=process.argv[2]
const db=path.join(root,'observed','workflow.sqlite')
if(!stage){
 mkdirSync(path.join(root,'observed'),{recursive:true})
 for(const suffix of ['','-shm','-wal'])rmSync(db+suffix,{force:true})
 for(const stage of ['operate','observe']){
  const run=spawnSync(process.execPath,['--import','tsx',import.meta.filename,stage],{stdio:'inherit',timeout:45000})
  assert.equal(run.status,0,`${stage}: ${run.error??''}`)
 }
 const observed=JSON.parse(readFileSync(path.join(root,'observed','workflow-observed.json'),'utf8'))
 console.log(JSON.stringify({kind:'literal workflow source probe',persistedJobs:observed.length,completed:observed.filter(x=>x.completedAt).length,errored:observed.filter(x=>x.hasError).length}))
}else{
 const {getPayload,buildConfig}=await import('payload')
 const {sqliteAdapter}=await import('@payloadcms/db-sqlite')
 const payload=await getPayload({config:buildConfig({secret:'synthetic-local-workflow-probe-only',db:sqliteAdapter({client:{url:'file:'+db},push:stage==='operate',transactionOptions:{}}),collections:[],jobs:{deleteJobOnComplete:false,workflows:[workflow]}})})
 try{
  if(stage==='operate'){
   const queued=await payload.jobs.queue({workflow:'onboardUser',input:{userId:'synthetic-user-1'}})
   const before=await payload.findByID({collection:'payload-jobs',id:queued.id,depth:0,overrideAccess:true})
   writeFileSync(path.join(root,'observed','workflow-queued.json'),JSON.stringify(before,null,2)+'\n')
   let runResult=null,runError=null
   try{runResult=await payload.jobs.run({limit:1})}catch(error){runError={name:error.name,message:error.message}}
   writeFileSync(path.join(root,'observed','workflow-operation.json'),JSON.stringify({runResult,runError,sideEffects},null,2)+'\n')
  }else{
   const rows=(await payload.find({collection:'payload-jobs',depth:0,limit:100,overrideAccess:true})).docs
   writeFileSync(path.join(root,'observed','workflow-observed.json'),JSON.stringify(rows,null,2)+'\n')
  }
 }finally{await payload.destroy()}
 process.exit(0)
}
