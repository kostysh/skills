import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {db,literal,preview,exportPreview,purge,read,dir} from './service.mjs';
for(const file of ['sql-transcript.jsonl','logger.jsonl'])writeFileSync(new URL(file,dir),'');
const evidence=[]; const record=(label,expected,actual)=>{evidence.push({label,expected,actual});writeFileSync(new URL('results.json',dir),JSON.stringify(evidence,null,2));assert.deepEqual(actual,expected,label);};
db(readFileSync(new URL('schema.sql',dir),'utf8'));
record('environment PostgreSQL','18.4 (Debian 18.4-1.pgdg13+1)',db(`SELECT to_jsonb(current_setting('server_version'));`));
const base=id=>({id,subjectKey:`synthetic-${id}`,unitMinor:'3',currency:'EUR',scale:2,quantity:1,expiresAt:200});
const reset=()=>db('TRUNCATE exports,previews;');
const fixtures=[['0',1,'0','0'],['3',1,'3','1'],['-3',1,'-3','-2'],['-4',1,'-4','-2'],['9007199254740993',1,'9007199254740993','4503599627370496'],['9223372036854775807',1,'9223372036854775807','4611686018427387903'],['-9223372036854775808',1,'-9223372036854775808','-4611686018427387904'],['922337203685477580',10,'9223372036854775800','4611686018427387900'],['922337203685477581',10],['-922337203685477581',10]];
for(const [i,[unitMinor,quantity,netMinor,feeMinor]] of fixtures.entries()){
 const request={...base(i+1),unitMinor,quantity};
 for(const engine of ['Node','SQL']){reset();let result,error;try{result=engine==='Node'?preview(request,100).reread:db(`SELECT sql_preview(${literal(request)},100);`);}catch(e){error=e.message;}
 if(netMinor!==undefined){const expected={id:i+1,subjectKey:`synthetic-${i+1}`,netMinor,feeMinor,expiresAt:200};record(`E1 ${engine} ${i+1}`,expected,result);record(`E1 ${engine} read ${i+1}`,expected,read(i+1).row);}
 else {record(`E1 ${engine} rejection ${i+1}`,true,!!error);record(`E1 ${engine} absent ${i+1}`,{row:null,export:null},read(i+1));}}
}
let id=100;
const invalid=[];
for(const v of ['9223372036854775808','-9223372036854775809','+1','01','-0','1.0','1e2',' 1','',1,null,undefined])invalid.push(['unitMinor',v]);
invalid.push(['currency','USD'],['scale',3],['scale','2'],...([0,11,1.5,'1'].map(v=>['quantity',v])));
for(const [key,value]of invalid){const r={...base(++id),[key]:value};if(value===undefined)delete r[key];for(const engine of ['Node','SQL']){let error;try{engine==='Node'?preview(r,100):db(`SELECT sql_preview(${literal(r)},100);`);}catch(e){error=e.message;}
record(`E2 ${engine} ${id} ${key}=${JSON.stringify(value)}`,true,!!error);record(`E2 absent ${engine} ${id}`,{row:null,export:null},read(id));}}
reset();
const privacy=[...([0,1.5,'5',9007199254740992].map(v=>['id',v])),['subjectKey','PAYLOAD_MARKER'],['subjectKey',1],...([100,99,100.5,'200',9007199254740992].map(v=>['expiresAt',v]))];
for(const key of Object.keys(base(1)))for(const v of [null,undefined])privacy.push([key,v]);
for(const [key,value] of privacy){const r={...base(++id),[key]:value,extra:'PAYLOAD_MARKER'};if(value===undefined)delete r[key];let error;try{preview(r,100);}catch(e){error=e.message;}record(`E3 ${id} ${key}=${JSON.stringify(value)}`,true,!!error);record(`E3 global absence ${id}`,{rows:0,exports:0},db(`SELECT jsonb_build_object('rows',(SELECT count(*) FROM previews),'exports',(SELECT count(*) FROM exports));`));}
for(const [unitMinor,netMinor,feeMinor]of [['9007199254740993','9007199254740993','4503599627370496'],['-3','-3','-2']]){const r={...base(++id),unitMinor,netMinor:'999',feeMinor:'999',extra:'PAYLOAD_MARKER'};const expected={id,subjectKey:r.subjectKey,netMinor,feeMinor,expiresAt:200};record(`E4 preview ${id}`,{row:expected,reread:expected},preview(r,100));record(`E4 export ${id}`,{id,subjectKey:r.subjectKey,feeMinor},exportPreview(expected));record(`E4 stored ${id}`,{row:expected,export:{id,subjectKey:r.subjectKey,feeMinor}},read(id));}
record('E4 physical columns',{previews:['id','subjectKey','netMinor','feeMinor','expiresAt'],exports:['id','subjectKey','feeMinor']},db(`SELECT jsonb_object_agg(table_name,cols) FROM (SELECT table_name,jsonb_agg(column_name ORDER BY ordinal_position) cols FROM information_schema.columns WHERE table_schema='domain_rev_base' GROUP BY table_name) x;`));
reset();
const expired=preview({...base(500),expiresAt:200},100).row;exportPreview(expired);
const future=preview({...base(501),expiresAt:300},100).row;exportPreview(future);
const expCopy={id:500,subjectKey:'synthetic-500',feeMinor:'1'},futureCopy={id:501,subjectKey:'synthetic-501',feeMinor:'1'};
record('E5 before count',{count:0,reread:[]},purge(199));record('E5 before copies',{row:expired,export:expCopy},read(500));
record('E5 boundary',{count:1,reread:[{id:500,row:null,export:null}]},purge(200));record('E5 future preserved',{row:future,export:futureCopy},read(501));record('E5 repeat',{count:0,reread:[]},purge(200));
const failure=preview({...base(502),expiresAt:210},100).row;exportPreview(failure);
db(`CREATE FUNCTION fail_export_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic export deletion failure'; END $$; CREATE TRIGGER fail_export_delete BEFORE DELETE ON exports FOR EACH ROW EXECUTE FUNCTION fail_export_delete();`);
let purgeError;try{purge(210);}catch(e){purgeError=e.message;}
record('E6 real failure','storage failure',purgeError);record('E6 rollback copies',{row:failure,export:{id:502,subjectKey:'synthetic-502',feeMinor:'1'}},read(502));
db('DROP TRIGGER fail_export_delete ON exports; DROP FUNCTION fail_export_delete();');
record('E6 recovery',{count:1,reread:[{id:502,row:null,export:null}]},purge(210));record('E6 future preserved',{row:future,export:futureCopy},read(501));
const logs=readFileSync(new URL('logger.jsonl',dir),'utf8');for(const line of logs.trim().split('\n')){const l=JSON.parse(line);assert.deepEqual(Object.keys(l),['event','status','count']);assert.ok(['preview','export','purge'].includes(l.event));assert.ok(['success','failure'].includes(l.status));assert.ok(Number.isSafeInteger(l.count));}record('E3 E4 E5 E6 logger payload marker absent',false,logs.includes('PAYLOAD_MARKER'));record('E6 logger failure observed',true,logs.includes('"event":"purge","status":"failure","count":0'));
writeFileSync(new URL('summary.json',dir),JSON.stringify({status:'verified',checks:evidence.length,node:process.version,scope:'temporary direct Node service and real PostgreSQL 18.4; no HTTP deployment'},null,2));
console.log(`PASS ${evidence.length} checks`);
