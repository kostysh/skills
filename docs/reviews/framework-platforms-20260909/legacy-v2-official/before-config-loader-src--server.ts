import express from 'express'
import payload from 'payload'
import config from '../payload.config'
import { host, port, required } from './settings'

async function main() {
  const app = express()
  app.get('/health', (_req, res) => res.json({ ready: true, fixture: 'legacy-v2' }))
  await payload.init({ secret: required('PAYLOAD_SECRET'), express: app, config })
  const server = app.listen(port, host, () => console.log(JSON.stringify({ event: 'listening', host, port })))
  server.on('error', () => { console.error('Legacy fixture listener failed'); process.exit(1) })
  let stopping = false
  function stop() {
    if (stopping) return
    stopping = true
    server.close(() => {
      // v2 Postgres destroy does not close its pool. This owned fixture process exits after HTTP requests finish.
      console.log(JSON.stringify({ event: 'server-stopped' }))
      process.exit(0)
    })
  }
  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)
}
main().catch(() => { console.error('Legacy fixture initialization failed; inspect redacted infrastructure log'); process.exit(1) })
