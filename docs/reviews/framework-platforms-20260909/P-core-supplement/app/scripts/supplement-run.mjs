import {spawn} from 'node:child_process'
import assert from 'node:assert/strict'
const run=(args)=>new Promise((resolve,reject)=>{const p=spawn('npm',args,{stdio:'inherit'});p.once('error',reject);p.once('exit',code=>code===0?resolve():reject(Error(`npm ${args.join(' ')} exit ${code}`)))})
await run(['run','supplement:setup'])
const server=spawn('npm',['start'],{stdio:'inherit',detached:true})
const stopped=new Promise(resolve=>server.once('exit',resolve))
try{
 let ready=false
 for(let i=0;i<60;i++){try{ready=(await fetch('http://127.0.0.1:18530/api/posts')).ok}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,1000))}
 assert.ok(ready,'existing production server ready')
 await run(['run','queue:report'])
 await run(['run','verify:job','--','queued'])
 await run(['run','supplement:read'])
 await run(['run','jobs:run'])
 await run(['run','verify:job','--','completed'])
}finally{
 try{process.kill(-server.pid,'SIGTERM')}catch(error){if(error.code!=='ESRCH')throw error}
 await stopped
 await run(['run','supplement:setup','--','cleanup-note'])
}
