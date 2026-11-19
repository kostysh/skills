// Research-only readback of a completed, privately copied SQLite.
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [modulesDirectory, databaseDirectory] = process.argv.slice(2)
const load = (name) => import(pathToFileURL(resolve(modulesDirectory, name)))
const { open } = await load('target.mjs')
const { eastReader, visible } = await load('reader.mjs')
const cms = await open(resolve(databaseDirectory))

try {
  const all = async (collection) =>
    (await cms.find({ collection, overrideAccess: true, depth: 0, pagination: false, sort: 'id' })).docs
  const sections = (await all('sections')).map(({ id, sourceKey, title }) => ({ id, sourceKey, title }))
  const sectionKeys = new Map(sections.map(({ id, sourceKey }) => [id, sourceKey]))
  const project = ({ id, sourceKey, title, section, desk, state }) =>
    ({ id, sourceKey, title, section, sectionKey: sectionKeys.get(section), desk, state })
  const records = (await all('records')).map(project)
  const reader = await eastReader(cms)
  const east = (await visible(cms, reader)).map(project)
  console.log('READBACK ' + JSON.stringify({ node: process.version, sections, records, desk: reader.desk, east }))
} finally {
  await cms.destroy()
}
