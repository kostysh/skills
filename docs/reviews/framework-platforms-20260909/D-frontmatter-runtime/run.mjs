import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const records=[];
for(const variant of ['baseline','candidate']) for(const kind of ['positive','negative']) {
 const cwd=new URL(`./${variant}-${kind}/`,import.meta.url).pathname;
 const command=['/tmp/framework-platforms-20260909/node-tools/node_modules/.bin/pnpm','run','lint'];
 const r=spawnSync(command[0],command.slice(1),{cwd,encoding:'utf8'});
 records.push({variant,kind,command,status:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message});
}
writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(records,null,2)+'\n');
console.log(JSON.stringify(records));
if(records.find(r=>r.variant==='baseline'&&r.kind==='positive').status===0 || records.find(r=>r.variant==='candidate'&&r.kind==='positive').status!==0 || records.find(r=>r.variant==='candidate'&&r.kind==='negative').status===0) process.exitCode=1;
