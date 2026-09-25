import { getPayload } from 'payload'
import config from '@payload-config'
const payload = await getPayload({ config })
const models = await payload.find({ collection: 'tire-models', limit: 100, pagination: false, depth: 1, overrideAccess: true })
const byType = {}
for (const m of models.docs) {
  const t = typeof m.tireType === 'object' ? m.tireType?.slug : String(m.tireType)
  byType[t] = (byType[t] ?? 0) + 1
}
console.log('modelsByType', byType)
console.log('wheelModels', (await payload.find({ collection: 'wheel-models', limit: 20, depth: false, depth: 0, overrideAccess: true })).docs.map(d => ({ slug: d.slug, status: d.status, hasImage: !!d.mainImage })))
process.exit(0)
