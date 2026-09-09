import {spawnSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
export const dir=new URL('.',import.meta.url);
export function db(query){
 const input='SET search_path=domain_rev_base;\n'+query;
 const p=spawnSync('docker',['exec','-i','codex-domain-rev-20260909','psql','-X','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'],{input,encoding:'utf8',timeout:15000});
 appendFileSync(new URL('sql-transcript.jsonl',dir),JSON.stringify({command:'docker exec -i codex-domain-rev-20260909 psql -X -U postgres -v ON_ERROR_STOP=1 -Atq',input,status:p.status,stdout:p.stdout,stderr:p.stderr})+'\n');
 if(p.status!==0)throw new Error('storage failure');
 return p.stdout.trim()?JSON.parse(p.stdout.trim()):null;
}
export const literal=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
function log(event,status,count){appendFileSync(new URL('logger.jsonl',dir),JSON.stringify({event,status,count})+'\n');}
const min=-9223372036854775808n,max=9223372036854775807n;
export function calculate(r,now){
 if(!r||typeof r!=='object'||!Number.isSafeInteger(now)||!Number.isSafeInteger(r.id)||r.id<=0||typeof r.subjectKey!=='string'||!/^synthetic-[0-9]+$/.test(r.subjectKey)||r.subjectKey.includes('\n')||!Number.isSafeInteger(r.expiresAt)||r.expiresAt<=now||r.currency!=='EUR'||r.scale!==2||!Number.isInteger(r.quantity)||r.quantity<1||r.quantity>10||typeof r.unitMinor!=='string'||!/^(0|-?[1-9][0-9]*)$/.test(r.unitMinor)||r.unitMinor.includes('\n'))throw new Error('invalid input');
 const u=BigInt(r.unitMinor); if(u<min||u>max)throw new Error('invalid input');
 const n=u*BigInt(r.quantity);if(n<min||n>max)throw new Error('net overflow');
 const f=n/2n-(n<0n&&n%2n!==0n?1n:0n);if(f<min||f>max)throw new Error('fee overflow');
 return {id:r.id,subjectKey:r.subjectKey,netMinor:String(n),feeMinor:String(f),expiresAt:r.expiresAt};
}
const projection=`jsonb_build_object('id',id,'subjectKey',"subjectKey",'netMinor',"netMinor"::text,'feeMinor',"feeMinor"::text,'expiresAt',"expiresAt")`;
export function read(id){return db(`SELECT jsonb_build_object('row',(SELECT ${projection} FROM previews WHERE id=${id}),'export',(SELECT jsonb_build_object('id',id,'subjectKey',"subjectKey",'feeMinor',"feeMinor"::text) FROM exports WHERE id=${id}));`);}
export function preview(r,now){try{
 const row=calculate(r,now);
 const sql=db(`SELECT calculate(${literal(r)},${now});`);
 if(JSON.stringify(Object.entries(row).sort())!==JSON.stringify(Object.entries(sql).sort()))throw new Error('parity failure');
 db(`INSERT INTO previews VALUES (${row.id},'${row.subjectKey}',${row.netMinor},${row.feeMinor},${row.expiresAt});`);
 const reread=read(row.id).row;log('preview','success',1);return {row,reread};
 }catch(e){log('preview','failure',0);throw e;}}
export function exportPreview(row){try{db(`INSERT INTO exports SELECT id,"subjectKey","feeMinor" FROM previews WHERE id=${row.id};`);const reread=read(row.id).export;log('export','success',1);return reread;}catch(e){log('export','failure',0);throw e;}}
export function purge(now){try{
 if(!Number.isSafeInteger(now))throw new Error('invalid input');
 const ids=db(`SELECT coalesce(jsonb_agg(id),'[]') FROM previews WHERE "expiresAt"<=${now};`);
 db(`BEGIN; DELETE FROM exports WHERE id IN (SELECT id FROM previews WHERE "expiresAt"<=${now}); DELETE FROM previews WHERE "expiresAt"<=${now}; COMMIT;`);
 const reread=ids.map(id=>({id,...read(id)}));if(reread.some(x=>x.row||x.export))throw new Error('purge incomplete');
 log('purge','success',ids.length);return {count:ids.length,reread};
 }catch(e){log('purge','failure',0);throw e;}}
