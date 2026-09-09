import {getPayload} from 'payload'
import config from '../payload.config.ts'
import {readFileSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const payload=await getPayload({config})
const where={requestKey:{equals:'report-001'}}
try{
 if(process.argv[2]==='cleanup-note'){
  const {note}=JSON.parse(readFileSync('../supplement-setup.json','utf8'))
  await payload.delete({collection:'sync-notes',id:note.id,overrideAccess:true})
  const result=await payload.find({collection:'sync-notes',where:{id:{equals:note.id}},overrideAccess:true,depth:0})
  assert.equal(result.totalDocs,0)
  writeFileSync('../supplement-cleanup.json',JSON.stringify({noteID:note.id,remaining:result.totalDocs})+'\n')
 }else{
  const beforeReports=(await payload.find({collection:'reports',where,limit:100,depth:0,overrideAccess:true})).docs
  const beforeJobs=(await payload.find({collection:'payload-jobs',where:{workflowSlug:{equals:'prepare-report'}},limit:100,depth:0,overrideAccess:true})).docs.filter(job=>job.input?.requestKey==='report-001')
  writeFileSync('../supplement-before-reset.json',JSON.stringify({reports:beforeReports,jobs:beforeJobs},null,2)+'\n')
  for(const job of beforeJobs)await payload.delete({collection:'payload-jobs',id:job.id,overrideAccess:true})
  for(const report of beforeReports)await payload.delete({collection:'reports',id:report.id,overrideAccess:true})
  const afterReports=await payload.find({collection:'reports',where,depth:0,overrideAccess:true})
  const afterJobs=(await payload.find({collection:'payload-jobs',where:{workflowSlug:{equals:'prepare-report'}},limit:100,depth:0,overrideAccess:true})).docs.filter(job=>job.input?.requestKey==='report-001')
  assert.equal(afterReports.totalDocs,0);assert.equal(afterJobs.length,0)
  const note=await payload.create({collection:'sync-notes',overrideAccess:true,depth:0,data:{sourceKey:'assessor-only-hook-invocation',tenant:'alpha',title:'Assessor local hook invocation',visible:true,origin:'before-hook'}})
  assert.equal(note.origin,'existing-note-hook')
  writeFileSync('../supplement-setup.json',JSON.stringify({afterReset:{reports:afterReports.docs,jobs:afterJobs},note},null,2)+'\n')
 }
}finally{await payload.destroy()}
process.exit(0)
