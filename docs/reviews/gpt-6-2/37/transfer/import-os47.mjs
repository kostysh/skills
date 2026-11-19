import { createHash } from 'node:crypto'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { open } from './materials/target.mjs'

const collections = ['sections', 'records']
const exportPath = new URL('./materials/export.json', import.meta.url)
const checkpointName = 'os47-checkpoint.json'
const namespace = 'ОС-47'

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

async function loadExport() {
  const bytes = await readFile(exportPath)
  const source = JSON.parse(bytes)
  const keys = {}
  for (const collection of collections) {
    if (!Array.isArray(source?.[collection])) {
      throw new Error(`Expected an array for ${collection}`)
    }
    keys[collection] = new Set()
    for (const row of source[collection]) {
      if (!isText(row?.key) || !isText(row.title) || keys[collection].has(row.key)) {
        throw new Error(`Invalid or duplicate source row in ${collection}: ${row?.key}`)
      }
      keys[collection].add(row.key)
    }
  }
  for (const { key, section, desk, state } of source.records) {
    if (!keys.sections.has(section) || !isText(desk) || !['issued', 'draft'].includes(state)) {
      throw new Error(`Invalid section, desk or state for records/${key}`)
    }
  }
  return { source, sha256: createHash('sha256').update(bytes).digest('hex') }
}

async function loadCheckpoint(path, sha256, source) {
  let checkpoint
  try {
    checkpoint = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
  if (checkpoint?.namespace !== namespace || checkpoint.sha256 !== sha256) {
    throw new Error('Checkpoint belongs to a different export')
  }
  for (const collection of collections) {
    const entries = checkpoint[collection]
    // Rows are checkpointed in export order, one confirmed write at a time.
    if (!Array.isArray(entries) || entries.length > source[collection].length ||
      entries.some((entry, index) =>
        entry?.sourceKey !== source[collection][index].key || !Number.isSafeInteger(entry.id))) {
      throw new Error(`Invalid checkpoint entries for ${collection}`)
    }
  }
  if (checkpoint.records.length && checkpoint.sections.length !== source.sections.length) {
    throw new Error('Card checkpoint exists before the section phase completed')
  }
  return checkpoint
}

async function saveCheckpoint(path, checkpoint) {
  const temporary = `${path}.tmp`
  await writeFile(temporary, JSON.stringify(checkpoint, null, 2) + '\n')
  await rename(temporary, path)
}

async function findByKey(cms, collection, sourceKey) {
  const { docs, totalDocs } = await cms.find({
    collection, where: { sourceKey: { equals: sourceKey } },
    limit: 2, depth: 0, overrideAccess: true,
  })
  if (totalDocs > 1) throw new Error(`Duplicate target identity ${collection}/${sourceKey}`)
  return docs[0]
}

function matches(doc, data) {
  return doc && Object.entries(data).every(([field, value]) => doc[field] === value)
}

async function run(directory, interrupt) {
  const { source, sha256 } = await loadExport()
  const path = join(directory, checkpointName)
  let checkpoint = await loadCheckpoint(path, sha256, source)
  if (interrupt && checkpoint) throw new Error('Fault injection requires a fresh import')

  const counts = {
    sections: { created: 0, recovered: 0, skipped: 0 },
    records: { created: 0, recovered: 0, skipped: 0 },
  }
  let current = null
  const cms = await open(directory)
  try {
    if (!checkpoint) {
      // Establish that the source keys are unused before claiming this export.
      for (const collection of collections) {
        for (const { key } of source[collection]) {
          current = { collection, sourceKey: key }
          if (await findByKey(cms, collection, key)) {
            throw new Error(`Source key already belongs to a target row: ${collection}/${key}`)
          }
        }
      }
      current = null
      checkpoint = { namespace, sha256, sections: [], records: [] }
      await saveCheckpoint(path, checkpoint)
    }

    const sectionIds = new Map()
    for (const collection of collections) {
      for (const [index, row] of source[collection].entries()) {
        const sourceKey = row.key
        current = { collection, sourceKey }
        const data = { sourceKey, title: row.title }
        if (collection === 'records') {
          Object.assign(data, { section: sectionIds.get(row.section), desk: row.desk, state: row.state })
        }

        const saved = checkpoint[collection][index]
        let doc = await findByKey(cms, collection, sourceKey)
        if (saved) {
          if (!matches(doc, data) || doc.id !== saved.id) {
            throw new Error(`Checkpoint and target disagree for ${collection}/${sourceKey}`)
          }
          counts[collection].skipped++
        } else {
          if (doc) {
            if (!matches(doc, data)) {
              throw new Error(`Conflicting target row ${collection}/${sourceKey}`)
            }
            counts[collection].recovered++
          } else {
            const created = await cms.create({ collection, data, depth: 0, overrideAccess: true })
            doc = await findByKey(cms, collection, sourceKey)
            if (!matches(doc, data) || doc.id !== created.id) {
              throw new Error(`Could not confirm write for ${collection}/${sourceKey}`)
            }
            counts[collection].created++
            if (interrupt && collection === 'records' && index === 0) {
              // Interrupt the process while the row exists and its checkpoint does not.
              process.kill(process.pid, 'SIGKILL')
            }
          }
          checkpoint[collection].push({ sourceKey, id: doc.id })
          await saveCheckpoint(path, checkpoint)
        }
        if (collection === 'sections') sectionIds.set(sourceKey, doc.id)
      }
    }
    console.log(JSON.stringify({ sha256, counts, failed: 0 }))
  } catch (error) {
    console.error(JSON.stringify({ sha256, counts, failed: 1, current, error: error.message }))
    process.exitCode = 1
  } finally {
    await cms.destroy()
  }
}

const [directory, flag, ...extra] = process.argv.slice(2)
if (!directory || extra.length || (flag && flag !== '--interrupt-after-first-record')) {
  console.error('Usage: ./node import-os47.mjs <existing-db-directory> [--interrupt-after-first-record]')
  process.exitCode = 1
} else {
  try {
    await run(resolve(directory), flag === '--interrupt-after-first-record')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
