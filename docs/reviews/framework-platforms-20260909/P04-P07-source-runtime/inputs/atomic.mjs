import {spawnSync} from 'node:child_process'
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.dirname(new URL(import.meta.url).pathname)
const [stage,mode,outcome]=process.argv.slice(2)
if(!stage){
 mkdirSync(path.join(root,'observed'),{recursive:true})
 const results=[]
 for(const mode of ['default','reference-enabled']) for(const outcome of ['success','failure']){
  const db=path.join(root,'observed',`${mode}-${outcome}.sqlite`)
  for(const suffix of ['','-shm','-wal'])rmSync(db+suffix,{force:true})
  for(const stage of ['operate','observe']){
   const run=spawnSync(process.execPath,['--import','tsx',import.meta.filename,stage,mode,outcome],{stdio:'inherit',timeout:45000})
   if(run.status!==0)throw Error(`${mode}/${outcome}/${stage} exited ${run.status} ${run.error??''}`)
  }
  const observed=JSON.parse(readFileSync(path.join(root,'observed',`${mode}-${outcome}.json`),'utf8'))
  const expected=outcome==='success'?{stock:8,orders:1,audit:1}:mode==='reference-enabled'?{stock:10,orders:0,audit:0}:{stock:8,orders:1,audit:0}
  assert.equal(observed.inventory.length,1)
  assert.equal(observed.inventory[0].sourceKey,'sku-1')
  assert.equal(observed.inventory[0].stock,expected.stock)
  assert.equal(observed.orders.length,expected.orders)
  assert.equal(observed.audit.length,expected.audit)
  for(const order of observed.orders){assert.equal(order.sourceKey,'order-1');assert.equal(order.quantity,2);assert.equal(order.inventory,observed.inventory[0].id)}
  for(const audit of observed.audit){assert.equal(audit.order,observed.orders[0].id);assert.equal(audit.inventory,observed.inventory[0].id);assert.equal(audit.quantity,2)}
  const operation=JSON.parse(readFileSync(path.join(root,'observed',`${mode}-${outcome}-operation.json`),'utf8'))
  assert.equal(operation.transactionPresent,mode==='reference-enabled')
  if(outcome==='failure'&&mode==='reference-enabled')assert.deepEqual(observed,operation.before)
  results.push({mode,outcome,expected,operation,observed})
 }
 writeFileSync(path.join(root,'observed','results.json'),JSON.stringify(results,null,2)+'\n')
 console.log(JSON.stringify({sourceProbe:true,branches:results.length,pass:true}))
}else{
 const {getPayload,buildConfig}=await import('payload')
 const {sqliteAdapter}=await import('@payloadcms/db-sqlite')
 const db=path.join(root,'observed',`${mode}-${outcome}.sqlite`)
 let transactionPresent=null,operationError=null
 const payload=await getPayload({config:buildConfig({
  secret:'synthetic-local-atomic-probe-only',
  db:sqliteAdapter({client:{url:'file:'+db},push:stage==='operate',...(mode==='reference-enabled'?{transactionOptions:{}}:{})}),
  collections:[
   {slug:'inventory',fields:[{name:'sourceKey',type:'text',required:true,unique:true},{name:'stock',type:'number',required:true}]},
   {slug:'orders',fields:[{name:'sourceKey',type:'text',required:true,unique:true},{name:'quantity',type:'number',required:true},{name:'inventory',type:'relationship',relationTo:'inventory',required:true}],hooks:{afterChange:[async({doc,req})=>{
    transactionPresent=Boolean(await req.transactionID)
    const inventory=await req.payload.findByID({collection:'inventory',id:doc.inventory,req})
    await req.payload.update({collection:'inventory',id:inventory.id,data:{stock:inventory.stock-doc.quantity},req})
    if(req.context.controlledFailure)throw Error('P04_CONTROLLED_FAILURE')
    await req.payload.create({collection:'audit',data:{order:doc.id,inventory:inventory.id,quantity:doc.quantity},req})
    return doc
   }]}},
   {slug:'audit',fields:[{name:'order',type:'relationship',relationTo:'orders',required:true},{name:'inventory',type:'relationship',relationTo:'inventory',required:true},{name:'quantity',type:'number',required:true}]},
  ],
 })})
 try{
  if(stage==='operate'){
   const inv=await payload.create({collection:'inventory',data:{sourceKey:'sku-1',stock:10}})
   const before={}
   for(const collection of ['inventory','orders','audit'])before[collection]=(await payload.find({collection,limit:100,depth:0,overrideAccess:true})).docs
   try{await payload.create({collection:'orders',depth:0,data:{sourceKey:'order-1',quantity:2,inventory:inv.id},context:{controlledFailure:outcome==='failure'}})}catch(error){operationError=error.message}
   assert.equal(operationError,outcome==='failure'?'P04_CONTROLLED_FAILURE':null)
   writeFileSync(path.join(root,'observed',`${mode}-${outcome}-operation.json`),JSON.stringify({transactionPresent,operationError,before},null,2)+'\n')
  }else{
   const observed={}
   for(const collection of ['inventory','orders','audit'])observed[collection]=(await payload.find({collection,limit:100,depth:0,overrideAccess:true})).docs
   writeFileSync(path.join(root,'observed',`${mode}-${outcome}.json`),JSON.stringify(observed,null,2)+'\n')
  }
 }finally{await payload.destroy()}
 process.exit(0)
}
