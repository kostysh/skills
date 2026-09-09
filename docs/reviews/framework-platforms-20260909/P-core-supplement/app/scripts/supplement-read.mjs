import {readFileSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const admin=JSON.parse(readFileSync('source/actors.json','utf8')).find(x=>x.actor==='admin')
const login=await fetch('http://127.0.0.1:18530/api/users/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:admin.email,password:process.env.ADMIN_PASSWORD})})
assert.equal(login.status,200)
const {token}=await login.json()
const headers={Authorization:`JWT ${token}`}
const reportsResponse=await fetch('http://127.0.0.1:18530/api/reports?where[requestKey][equals]=report-001',{headers})
const reports=await reportsResponse.json()
assert.equal(reportsResponse.status,200);assert.equal(reports.totalDocs,0);assert.deepEqual(reports.docs,[])
const {note}=JSON.parse(readFileSync('../supplement-setup.json','utf8'))
const noteResponse=await fetch(`http://127.0.0.1:18530/api/sync-notes/${note.id}?depth=0`,{headers})
const noteRead=await noteResponse.json()
assert.equal(noteResponse.status,200);assert.equal(noteRead.id,note.id);assert.equal(noteRead.sourceKey,'assessor-only-hook-invocation');assert.equal(noteRead.origin,'existing-note-hook')
writeFileSync('../supplement-rest.json',JSON.stringify({reports:{status:reportsResponse.status,result:reports},note:{status:noteResponse.status,result:noteRead}},null,2)+'\n')
console.log('PASS queued Reports absent and newly invoked note hook persisted through REST')
