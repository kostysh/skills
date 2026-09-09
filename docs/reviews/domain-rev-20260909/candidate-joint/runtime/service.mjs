import {spawnSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
export const logs = new URL('./logger.jsonl', import.meta.url);
export function sql(query) {
 const p=spawnSync('docker',['exec','-i','codex-domain-rev-20260909','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres'],{input:query,encoding:'utf8',timeout:10000});
 if(p.status!==0) { const e=new Error('database failure'); e.evidence=p.stderr; throw e; }
 return p.stdout.trim();
}
const log=(event,status,count)=>appendFileSync(logs,JSON.stringify({event,status,count})+'\n');
const lo=-(2n**63n), hi=2n**63n-1n;
const range=n=>n>=lo&&n<=hi;
export function calculate(r,now) {
 if(!r||typeof r!=='object'||!Number.isSafeInteger(now)||!Number.isSafeInteger(r.id)||r.id<=0||typeof r.subjectKey!=='string'||!/^synthetic-[0-9]+$(?![\s\S])/.test(r.subjectKey)||typeof r.unitMinor!=='string'||!/^(0|-?[1-9][0-9]*)$(?![\s\S])/.test(r.unitMinor)||r.currency!=='EUR'||r.scale!==2||!Number.isInteger(r.quantity)||r.quantity<1||r.quantity>10||!Number.isSafeInteger(r.expiresAt)||r.expiresAt<=now) throw new Error('invalid input');
 const unit=BigInt(r.unitMinor); if(!range(unit))throw new Error('unit range');
 const net=unit*BigInt(r.quantity); if(!range(net))throw new Error('net range');
 const fee=net/2n-(net<0n&&net%2n!==0n?1n:0n); if(!range(fee))throw new Error('fee range');
 return {netMinor:String(net),feeMinor:String(fee)};
}
export function read() {return JSON.parse(sql(`select json_build_object('rows',coalesce((select json_agg(t order by id) from domain_rev_candidate.preview t),'[]'::json),'exports',coalesce((select json_agg(t order by id) from domain_rev_candidate.export t),'[]'::json));`));}
export function preview(r,now) {
 try {
 const node=calculate(r,now);
 const calculated=JSON.parse(sql(`select json_build_object('netMinor',n::text,'feeMinor',f::text) from domain_rev_candidate.calc('${r.unitMinor}',${r.quantity});`));
 if(JSON.stringify(node)!==JSON.stringify(calculated))throw new Error('parity');
 sql(`insert into domain_rev_candidate.preview values (${r.id},'${r.subjectKey}','${node.netMinor}','${node.feeMinor}',${r.expiresAt});`);
 const row=read().rows.find(x=>x.id===r.id); log('preview','ok',1); return row;
 }catch(e){log('preview','error',0);throw e;}
}
export function exportPreview(row) {
 try {sql(`insert into domain_rev_candidate.export select id,"subjectKey","feeMinor" from domain_rev_candidate.preview where id=${row.id};`);const result=read().exports.find(x=>x.id===row.id);log('export','ok',1);return result;}catch(e){log('export','error',0);throw e;}
}
export function purge(now){try{
 if(!Number.isSafeInteger(now))throw new Error('invalid input');
 const count=Number(sql(`begin; with d as (delete from domain_rev_candidate.preview where "expiresAt"<=${now} returning id), e as (delete from domain_rev_candidate.export where id in (select id from d) returning id) select count(*) from d; commit;`));
 const reread=read();log('purge','ok',count);return {count,...reread};
 }catch(e){log('purge','error',0);throw e;}}
