import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const p=fileURLToPath(new URL('./state.json',import.meta.url));
const s=JSON.parse(readFileSync(p,'utf8'));const id='synthetic-1';
s.people=s.people.filter(x=>x.id!==id);s.exports=s.exports.filter(x=>x.id!==id);s.audit.push({event:'erase',count:1});writeFileSync(p,JSON.stringify(s,null,2)+'\n');console.log(JSON.stringify(s));
