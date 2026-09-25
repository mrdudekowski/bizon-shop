import { getPayload } from 'payload'
import config from '@payload-config'
const payload = await getPayload({ config })
for (const id of [35, 36]) {
  const v = await payload.findByID({ collection: 'tire-variants', id, depth: 0, overrideAccess: true })
  console.log(JSON.stringify({ id: v.id, sku: v.sku, sizeRaw: v.sizeRaw, sizeNormalized: v.sizeNormalized, rimDiameter: v.rimDiameter, status: v.status }, null, 2))
}
process.exit(0)
