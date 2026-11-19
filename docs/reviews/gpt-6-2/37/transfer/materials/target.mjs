import {randomBytes} from 'node:crypto'
import {readFile,writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {buildConfig,getPayload} from 'payload'
import {sqliteAdapter} from '@payloadcms/db-sqlite'

const limited=({req})=>req.user?{and:[{desk:{equals:req.user.desk}},{state:{equals:'issued'}}]}:false
const collections=[
 {slug:'operators',auth:true,fields:[{name:'desk',type:'text',required:true}]},
 {slug:'sections',fields:[{name:'sourceKey',type:'text',required:true},{name:'title',type:'text',required:true}]},
 {slug:'records',access:{read:limited},fields:[
  {name:'sourceKey',type:'text',required:true},{name:'title',type:'text',required:true},
  {name:'section',type:'relationship',relationTo:'sections',required:true},{name:'desk',type:'text',required:true},
  {name:'state',type:'select',options:['issued','draft'],required:true}
 ]}
]
export async function open(local){
 let secret
 try{secret=await readFile(join(local,'session'), 'utf8')}catch{secret=randomBytes(32).toString('hex');await writeFile(join(local,'session'),secret,{mode:0o600})}
 const config=buildConfig({secret,telemetry:false,typescript:{autoGenerate:false},db:sqliteAdapter({client:{url:'file:'+join(local,'working.sqlite')},push:true}),collections})
 return getPayload({config})
}
async function all(cms,coll){
 return (await cms.find({collection:coll,limit:100,depth:0,sort:'id'})).docs
}
export async function init(cms){
 if((await all(cms,'operators')).length===0){
  await cms.create({collection:'operators',data:{email:'east@example.invalid',password:randomBytes(24).toString('hex'),desk:'east'}})
  const other=await cms.create({collection:'sections',data:{sourceKey:'LOCAL',title:'Своя полка'}})
  await cms.create({collection:'records',data:{sourceKey:'LOCAL-01',title:'Местная запись',section:other.id,desk:'east',state:'issued'}})
 }
}
