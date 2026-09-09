import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {sql,preview,exportPreview,purge,read,logs,calculate} from './service.mjs';
writeFileSync(logs,'');
const evidence=[];
const record=(id,expected,actual)=>{assert.deepEqual(actual,expected,id);evidence.push({id,expected,actual});writeFileSync(new URL('./evidence.json',import.meta.url),JSON.stringify(evidence,null,2));};
sql(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
record('environment-postgres-major',true,sql('select version()').startsWith('PostgreSQL 18.4'));
const base={id:1,subjectKey:'synthetic-001',unitMinor:'3',currency:'EUR',scale:2,quantity:1,expiresAt:1000};
const cases=[['N0','0',1,'0','0'],['P1','3',1,'3','1'],['N1','-3',1,'-3','-2'],['N2','-4',1,'-4','-2'],['Q10','1',10,'10','5'],['EXACT','9007199254740993',1,'9007199254740993','4503599627370496'],['MAX','9223372036854775807',1,'9223372036854775807','4611686018427387903'],['MIN','-9223372036854775808',1,'-9223372036854775808','-4611686018427387904']];
for(const [label,unitMinor,quantity,netMinor,feeMinor] of cases){const r={...base,id:cases.findIndex(c=>c[0]===label)+1,unitMinor,quantity,extra:'EXTRA-MARKER',netMinor:'999',feeMinor:'999'};const row={id:r.id,subjectKey:r.subjectKey,netMinor,feeMinor,expiresAt:r.expiresAt};record(label+'-node',{netMinor,feeMinor},calculate(r,0));record(label+'-sql',{netMinor,feeMinor},JSON.parse(sql(`select json_build_object('netMinor',n::text,'feeMinor',f::text) from domain_rev_candidate.calc('${unitMinor}',${quantity});`)));record(label+'-service-json',row,JSON.parse(JSON.stringify(preview(r,0))));record(label+'-export',{id:r.id,subjectKey:r.subjectKey,feeMinor},exportPreview(row));}
const initial=read();
const negative=[];
for(const unitMinor of ['9223372036854775808','-9223372036854775809','',' 1','+1','01','-0','1.0',1])negative.push(['unit-'+JSON.stringify(unitMinor),{unitMinor}]);
negative.push(['max-times-two',{unitMinor:'9223372036854775807',quantity:2}],['min-times-two',{unitMinor:'-9223372036854775808',quantity:2}]);
for(const currency of ['USD',1])negative.push(['currency-'+currency,{currency}]);
for(const scale of [3,'2'])negative.push(['scale-'+JSON.stringify(scale),{scale}]);
for(const quantity of [0,11,1.5,'1'])negative.push(['quantity-'+JSON.stringify(quantity),{quantity}]);
for(const id of [0,1.5,9007199254740992])negative.push(['id-'+id,{id}]);
for(const subjectKey of ['actual-1','synthetic-','synthetic-1\n',123])negative.push(['subject-'+JSON.stringify(subjectKey),{subjectKey}]);
for(const expiresAt of [1.5,9007199254740992,0,-1])negative.push(['expiry-'+expiresAt,{expiresAt}]);
for(const key of Object.keys(base)){negative.push(['null-'+key,{[key]:null}]);negative.push(['missing-'+key,{[key]:undefined}]);}
for(const [label,patch] of negative){let error;try{preview({...base,id:200,extra:'EXTRA-MARKER',...patch},0);}catch(e){error=e.message;}record(label+'-reject',true,Boolean(error));evidence.push({id:label+'-error',actual:error});record(label+'-unchanged',initial,read());}
let dbError;try{preview({...base,extra:'EXTRA-MARKER'},0);}catch(e){dbError={message:e.message,postgres:e.evidence};}record('duplicate-db-failed','database failure',dbError?.message);evidence.push({id:'duplicate-db-error',actual:dbError});record('duplicate-db-unchanged',initial,read());
for(const [u,q] of [['9223372036854775807',2],['-9223372036854775808',2]]){let e;try{sql(`select * from domain_rev_candidate.calc('${u}',${q});`);}catch(err){e=err.evidence;}record('sql-overflow-'+u,true,e?.includes('net range')===true);evidence.push({id:'sql-overflow-error',actual:e});}
const add=(id,expiresAt)=>{const row=preview({...base,id,expiresAt},0);exportPreview(row);};
add(100,100);add(101,9999);
record('V4-before',{count:0,...read()},purge(99));
let expected=read();expected={rows:expected.rows.filter(r=>r.id!==100),exports:expected.exports.filter(r=>r.id!==100)};
record('V4-equal',{count:1,...expected},purge(100));record('V4-after-repeat',{count:0,...expected},purge(101));
add(102,200);expected=read();expected={rows:expected.rows.filter(r=>r.id!==102),exports:expected.exports.filter(r=>r.id!==102)};record('V4-first-after',{count:1,...expected},purge(201));
add(103,300);const beforeFailure=read();
sql(`create function domain_rev_candidate.fail_delete() returns trigger language plpgsql as $$ begin raise exception 'synthetic export delete failure'; end $$; create trigger synthetic_failure before delete on domain_rev_candidate.export for each row execute function domain_rev_candidate.fail_delete();`);
let failed;try{purge(300);}catch(e){failed={message:e.message,postgres:e.evidence};}
record('V5-thrown-no-count',true,failed?.message==='database failure'&&!('count' in failed));evidence.push({id:'V5-actual-db-error',actual:failed});record('V5-rollback-readback',beforeFailure,read());
sql('drop trigger synthetic_failure on domain_rev_candidate.export; drop function domain_rev_candidate.fail_delete();');
expected={rows:beforeFailure.rows.filter(r=>r.id!==103),exports:beforeFailure.exports.filter(r=>r.id!==103)};
record('V5-recovery',{count:1,...expected},purge(300));record('V5-repeat',{count:0,...expected},purge(301));
const logText=readFileSync(logs,'utf8'),entries=logText.trim().split('\n').map(JSON.parse);
record('V3-V5-log-allowlist',true,entries.every(e=>JSON.stringify(Object.keys(e))==='["event","status","count"]'&&['preview','export','purge'].includes(e.event)&&['ok','error'].includes(e.status)&&Number.isSafeInteger(e.count)));
record('V3-V5-no-marker-subject-request',false,/EXTRA-MARKER|synthetic-|subjectKey|unitMinor|netMinor|feeMinor|database|DETAIL/.test(logText));
record('V3-log-success-error-present',true,entries.some(e=>e.status==='ok')&&entries.some(e=>e.event==='preview'&&e.status==='error')&&entries.some(e=>e.event==='purge'&&e.status==='error'));
writeFileSync(new URL('./evidence.json',import.meta.url),JSON.stringify(evidence,null,2));
console.log(JSON.stringify({status:'verified',assertions:evidence.filter(x=>'expected'in x).length,negativeCases:negative.length,node:process.version,postgres:sql('select version()'),finalReadback:read()}));
