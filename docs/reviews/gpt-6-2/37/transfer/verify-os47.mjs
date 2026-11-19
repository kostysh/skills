import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { eastReader, visible } from './materials/reader.mjs'
import { init, open } from './materials/target.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))
const collections = ['sections', 'records']
const readJson = async (path) => JSON.parse(await readFile(path))

async function snapshot(directory, seed) {
  const cms = await open(directory)
  try {
    if (seed) await init(cms)
    const state = {}
    for (const collection of collections) {
      const { docs } = await cms.find({
        collection, pagination: false, depth: 0, sort: 'id', overrideAccess: true,
      })
      state[collection] = docs
    }
    const operator = await eastReader(cms)
    state.east = await visible(cms, operator)
    console.log(JSON.stringify(state))
  } finally {
    await cms.destroy()
  }
}

function child(script, ...args) {
  const result = spawnSync(process.execPath, [join(root, script), ...args], {
    encoding: 'utf8', cwd: root, timeout: 30000,
  })
  if (result.error) throw result.error
  return result
}

function resultJson(result) {
  assert.equal(result.signal, null, result.stderr)
  assert.equal(result.status, 0, result.stderr)
  const line = result.stdout.trimEnd().split('\n').findLast((line) => line.startsWith('{'))
  assert.ok(line, 'Expected JSON output')
  return JSON.parse(line)
}

function compare(expected, actual, description) {
  assert.deepEqual(actual, expected, description)
}

function verifyState(state, baseline, source, recordCount) {
  const sections = state.sections.slice(baseline.sections.length)
  const records = state.records.slice(baseline.records.length)
  const project = ({ id, sourceKey, title, desk, state, section }) =>
    ({ id, sourceKey, title, desk, state, section })

  for (const collection of collections) {
    compare(baseline[collection], state[collection].slice(0, baseline[collection].length),
      `Preserve the preexisting ${collection}`)
  }
  compare(source.sections.map(({ key, title }) => ({ sourceKey: key, title })),
    sections.map(({ sourceKey, title }) => ({ sourceKey, title })), 'All imported sections')
  const sectionIds = new Map(sections.map(({ sourceKey, id }) => [sourceKey, id]))
  const expectedRecords = source.records.slice(0, recordCount).map(({ key, title, section, desk, state }) =>
    ({ sourceKey: key, title, section: sectionIds.get(section), desk, state }))
  compare(expectedRecords, records.map(({ sourceKey, title, section, desk, state }) =>
    ({ sourceKey, title, section, desk, state })), 'All imported cards and their section IDs')
  compare([...baseline.east, ...records.filter(({ desk, state }) => desk === 'east' && state === 'issued')
    .map(project)], state.east, 'Shipped east reader')
}

async function verify() {
  const bytes = await readFile(join(root, 'materials', 'export.json'))
  const source = JSON.parse(bytes)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const directory = await mkdtemp(join(root, 'os47-check-'))
  const checkpointPath = join(directory, 'os47-checkpoint.json')

  const baseline = resultJson(child('verify-os47.mjs', '--snapshot', directory, '--seed'))
  compare(['LOCAL'], baseline.sections.map(({ sourceKey }) => sourceKey), 'Seeded section')
  compare(['LOCAL-01'], baseline.records.map(({ sourceKey }) => sourceKey), 'Seeded card')
  compare(['LOCAL-01'], baseline.east.map(({ sourceKey }) => sourceKey), 'East reader before import')
  await assert.rejects(access(checkpointPath), { code: 'ENOENT' })

  const crashResult = child('import-os47.mjs', directory, '--interrupt-after-first-record')
  compare('SIGKILL', crashResult.signal, crashResult.stderr)
  compare(null, crashResult.status, 'Interrupted process exit status')
  const interrupted = resultJson(child('verify-os47.mjs', '--snapshot', directory))
  const interruptedCheckpoint = await readJson(checkpointPath)
  verifyState(interrupted, baseline, source, 1)
  const entries = (docs) => docs.map(({ sourceKey, id }) => ({ sourceKey, id }))
  compare({
    namespace: 'ОС-47', sha256,
    sections: entries(interrupted.sections.slice(baseline.sections.length)), records: [],
  }, interruptedCheckpoint, 'Checkpoint after crash')

  const resumeResult = resultJson(child('import-os47.mjs', directory))
  compare({
    sha256, failed: 0,
    counts: {
      sections: { created: 0, recovered: 0, skipped: 2 },
      records: { created: 3, recovered: 1, skipped: 0 },
    },
  }, resumeResult, 'Resume actions')
  const resumed = resultJson(child('verify-os47.mjs', '--snapshot', directory))
  const resumedCheckpoint = await readJson(checkpointPath)
  verifyState(resumed, baseline, source, source.records.length)
  compare(interrupted.sections, resumed.sections, 'Persisted sections survived resume')
  compare(interrupted.records, resumed.records.slice(0, interrupted.records.length),
    'The first card retained its original ID and fields')
  compare({
    ...interruptedCheckpoint, records: entries(resumed.records.slice(baseline.records.length)),
  }, resumedCheckpoint, 'Final checkpoint matches every imported target ID')

  const repeatResult = resultJson(child('import-os47.mjs', directory))
  compare({
    sha256, failed: 0,
    counts: {
      sections: { created: 0, recovered: 0, skipped: 2 },
      records: { created: 0, recovered: 0, skipped: 4 },
    },
  }, repeatResult, 'Repeat actions')
  const repeated = resultJson(child('verify-os47.mjs', '--snapshot', directory))
  const repeatedCheckpoint = await readJson(checkpointPath)
  compare(resumed, repeated, 'Repeat preserved all rows, IDs, timestamps and the east read')
  compare(resumedCheckpoint, repeatedCheckpoint, 'Repeat preserved the checkpoint')

  const reportPath = join(directory, 'verification.json')
  const observations = {
    node: process.version, sha256, baseline,
    interrupted: { signal: crashResult.signal, checkpoint: interruptedCheckpoint, ...interrupted },
    resumed: { import: resumeResult, checkpoint: resumedCheckpoint, ...resumed },
    repeated: { import: repeatResult, checkpoint: repeatedCheckpoint, ...repeated },
  }
  await writeFile(reportPath, JSON.stringify(observations, null, 2) + '\n')
  console.log(reportPath)
}

if (process.argv[2] === '--snapshot') {
  await snapshot(process.argv[3], process.argv[4] === '--seed')
} else {
  await verify()
}
