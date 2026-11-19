
const [dir,edition,operation]=process.argv.slice(2)
if(!['Copper','Silver','Amber'].includes(edition)||!['prepare','interrupt','resume','inspect','read'].includes(operation))throw Error('Unknown rehearsal.')
const {open,init,run,inspect}=await import('./editions/'+edition+'/edition.mjs')
const p=await open(dir)
try {
 await init(p)
 const sample=operation==='prepare'?{ready:true}:['resume','interrupt'].includes(operation)?await run(p,dir,edition,operation==='interrupt'):await inspect(p,dir,operation==='read')
 console.log('PAYLOAD_DESK '+JSON.stringify(sample))
}finally{await p.destroy()}
