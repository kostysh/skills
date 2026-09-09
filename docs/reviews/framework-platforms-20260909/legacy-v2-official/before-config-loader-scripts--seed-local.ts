import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import payload from 'payload'
import config from '../payload.config'
import { required } from '../src/settings'

async function main() {
  const email = required('LEGACY_ADMIN_EMAIL')
  const password = required('LEGACY_ADMIN_PASSWORD')
  await payload.init({ secret: required('PAYLOAD_SECRET'), config, local: true })
  const users = await payload.find({ collection: 'users', where: { email: { equals: email } }, depth: 0, limit: 2, overrideAccess: true })
  assert.ok(users.totalDocs <= 1, 'Duplicate bootstrap identity')
  if (users.totalDocs === 0) await payload.create({ collection: 'users', data: { email, password }, overrideAccess: true })
  const bytes = await readFile(path.resolve('source/legacy-image.png'))
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: 'legacy-image.png' } }, depth: 0, limit: 2, overrideAccess: true })
  assert.ok(existing.totalDocs <= 1, 'Duplicate baseline image')
  const image = existing.docs[0] ?? await payload.create({
    collection: 'media', data: { alt: 'Existing image' }, overrideAccess: true,
    file: { name: 'legacy-image.png', data: bytes, mimetype: 'image/png', size: bytes.length },
  })
  assert.equal(image.filename, 'legacy-image.png')
  const stored = await readFile(path.resolve('uploads', image.filename as string))
  assert.deepEqual(stored, bytes)
  const evidence = { fixture: 'legacy-v2', bootstrapUserPresent: true, image: { id: image.id, filename: image.filename, alt: image.alt, sha256: createHash('sha256').update(stored).digest('hex') } }
  await mkdir('evidence', { recursive: true })
  await writeFile('evidence/seed.json', JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify(evidence))
}
// All mutations and file writes are awaited. This does not attest natural driver shutdown.
main().then(() => process.exit(0), () => { console.error('Legacy fixture seed failed; inspect redacted infrastructure log'); process.exit(1) })
