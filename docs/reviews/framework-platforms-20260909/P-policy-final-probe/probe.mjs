import vm from 'node:vm';
import {readFileSync,writeFileSync} from 'node:fs';
const codes=JSON.parse(readFileSync(new URL('./input.json',import.meta.url),'utf8'));const rows=[];
for(const [variant,code] of Object.entries(codes)) {
 for(let mask=0;mask<8;mask++) {
  const states={orgs:Boolean(mask&4),teams:Boolean(mask&2),subs:Boolean(mask&1)};
  const ctx=vm.createContext({checkOrgStatus:async()=>states.orgs});vm.runInContext(code,ctx);
  const req={user:{orgId:1,teamId:2,subId:3},context:{},payload:{findByID:async({collection})=>({active:states[collection]})}};
  const actual=await ctx.fastAccess({req});const expected=Object.values(states).every(Boolean);rows.push({variant,case:mask,actual,expected,pass:actual===expected});
 }
 const ctx=vm.createContext({checkOrgStatus:async()=>true});vm.runInContext(code,ctx);
 const guest=await ctx.fastAccess({req:{user:null,context:{}}});rows.push({variant,case:'guest',pass:guest===false});
 let denied=false;try {await ctx.fastAccess({req:{user:{orgId:1,teamId:2,subId:3},context:{},payload:{findByID:async()=>{throw new Error('lookup unavailable')}}}})}catch{denied=true}
 rows.push({variant,case:'lookup-error-not-allow',pass:denied});
}
writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify({boundary:'Exact extracted pre-remediation/current fastAccess bodies; export/type annotation adapted. Stubbed lookups test policy logic, not Payload API runtime.',rows},null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(['before','candidate'].map(v=>[v,{pass:rows.filter(r=>r.variant===v&&r.pass).length,total:rows.filter(r=>r.variant===v).length}]))));
if(rows.some(r=>r.variant==='candidate'&&!r.pass))process.exitCode=1;
