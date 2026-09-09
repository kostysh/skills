import {multiTenantPlugin} from './projection.mjs'
import {writeFileSync} from 'node:fs'
const observations=[]
for(const [name,value] of [['false',false],['true',true],['where',{visible:{equals:true}}]])for(const asyncResult of [false,true])for(const tenant of ['alpha','beta',null]){
 const calls=[];const fields=[{name:'origin',type:'text'}]; const hooks={beforeChange:[()=>{}]};const admin={useAsTitle:'origin'};const update=()=>false
 const original={slug:'notes',fields,hooks,admin,access:{update,read:(args)=>{calls.push(args);return asyncResult?Promise.resolve(value):value}}};const untouched={slug:'posts',fields:[]}
 const result=multiTenantPlugin({collections:['notes']})({collections:[original,untouched]});const req={user:tenant?{tenant}:null};const args={req,id:'test-id',data:{origin:'test'}}
 const rule=await result.collections[0].access.read(args)
 const items=rule.and.map(v=>({type:v instanceof Promise?'Promise':typeof v,value:v instanceof Promise?'[Promise]':v}))
 observations.push({name,asyncResult,tenant,ruleItems:items,existingCalls:calls.length,forwardedId:calls[0]?.id??null,forwardedData:calls[0]?.data??null,identities:{fields:result.collections[0].fields===fields,hooks:result.collections[0].hooks===hooks,admin:result.collections[0].admin===admin,update:result.collections[0].access.update===update,untouched:result.collections[1]===untouched}})
}
writeFileSync(new URL('./observations.json',import.meta.url),JSON.stringify({kind:'source callback projection, no HTTP/DB claim',observations},null,2)+'\n')
console.log(JSON.stringify({cases:observations.length,booleanAndItems:observations.filter(x=>x.ruleItems.some(y=>y.type==='boolean')).length,promiseAndItems:observations.filter(x=>x.ruleItems.some(y=>y.type==='Promise')).length}))
