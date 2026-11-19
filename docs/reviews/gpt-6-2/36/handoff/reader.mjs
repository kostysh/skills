export async function eastReader(cms) {
  const matches = await cms.find({
    collection: 'operators', where: { email: { equals: 'east@example.invalid' } },
    overrideAccess: true, limit: 2, depth: 0,
  })
  if (matches.totalDocs !== 1 || matches.docs[0].desk !== 'east') throw new Error('Expected the seeded east operator')
  return { ...matches.docs[0], collection: 'operators' }
}

export async function visible(cms, user, key) {
  const rows = await cms.find({
    collection: 'records', user, overrideAccess: false, depth: 0, limit: 100,
    ...(key ? { where: { sourceKey: { equals: key } } } : {}), sort: 'id',
  })
  return rows.docs.map(({ id, sourceKey, title, desk, state, section }) =>
    ({ id, sourceKey, title, desk, state, section }))
}
