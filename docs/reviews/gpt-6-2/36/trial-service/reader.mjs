import {randomBytes} from 'node:crypto'
import {mkdtemp,readFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const [code] = process.argv.slice(2)
if (!['Elm','Birch','Ash'].includes(code)) throw Error('Unknown edition.')
const {openDesk,listForShift} = await import('./editions/'+code+'/cms.mjs')
const seed=JSON.parse(await readFile(new URL('./editions/'+code+'/seed.json',import.meta.url)))
const root=await mkdtemp(join(tmpdir(),'skills-payload-desk-'))
let cms
try {
 cms=await openDesk(root)
 const operator=await cms.create({collection:'operators',data:{email:'east@example.invalid',password:randomBytes(24).toString('hex'),desk:'east'}})
 for(const data of seed) await cms.create({collection:'cards',data})
 const result=await listForShift(cms,operator)
 console.log('DESK_READ '+JSON.stringify({reader:'east',boundary:'Payload Local API / SQLite',cards:result}))
}finally {if(cms) await cms.destroy();await rm(root,{recursive:true,force:true})}
