import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { init, open } from './target.mjs'
import { eastReader, visible } from './reader.mjs'

const [directory, operation, value] = process.argv.slice(2)
const cms = await open(resolve(directory))
let server
try {
  await init(cms)
  const user = await eastReader(cms)
  if (operation === 'seed') {
    const [local] = await visible(cms, user, 'LOCAL-01')
    assert.ok(local)
    for (const [sourceKey, desk, state] of [['PROBE-DRAFT', 'east', 'draft'], ['PROBE-WEST', 'west', 'issued']]) {
      await cms.create({collection: 'records', overrideAccess: true, data: {
        sourceKey, desk, state, title: sourceKey, section: local.section,
      }})
    }
    const full = await cms.find({collection: 'records', overrideAccess: true, sort: 'id', depth: 0})
    const observed = await visible(cms, user)
    assert.deepEqual(full.docs.map(row => row.sourceKey), ['LOCAL-01', 'PROBE-DRAFT', 'PROBE-WEST'])
    assert.deepEqual(observed.map(row => row.sourceKey), ['LOCAL-01'])
    console.log('CMS-RESULT ' + JSON.stringify({
      actor: {id: user.id, desk: user.desk, collection: user.collection},
      stored: full.docs.map(({id,sourceKey,section,desk,state})=>({id,sourceKey,section,desk,state})),
      visible: observed,
    }))
  } else if (operation === 'serve') {
    server = createServer(async (req, res) => {
      try {
        const match = /^\/records\/([A-Z0-9-]+)$/.exec(req.url ?? '')
        if (req.method !== 'GET' || !match) return res.writeHead(404).end()
        const result = await visible(cms, user, match[1])
        res.writeHead(result.length === 1 ? 200 : 404, {'content-type': 'application/json', 'cache-control':'no-store'})
        res.end(JSON.stringify(result.length === 1 ? result[0] : {}))
      } catch { res.writeHead(500).end() }
    })
    await new Promise(resolve => server.listen(Number(value), '127.0.0.1', resolve))
    console.log('CMS-READY ' + server.address().port)
    await new Promise(resolve => {process.on('SIGTERM',resolve);process.on('SIGINT',resolve)})
  } else if (operation === 'retitle') {
    const [row] = await visible(cms,user,'LOCAL-01')
    const written = await cms.update({collection:'records',id:row.id,data:{title:value},overrideAccess:true})
    console.log('CMS-RESULT ' + JSON.stringify({id:written.id,sourceKey:written.sourceKey,title:written.title}))
  } else if (operation === 'read') {
    console.log('CMS-RESULT ' + JSON.stringify(await visible(cms,user,value)))
  } else throw new Error('Expected seed, read, retitle or serve')
} finally {
  if (server) await new Promise(resolve => server.close(resolve))
  await cms.destroy()
}
