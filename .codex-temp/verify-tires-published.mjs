import { getPayload } from 'payload'
import config from '@payload-config'
const payload = await getPayload({ config })
const models = await payload.count({ collection: 'tire-models', where: { status: { equals: 'published' } }, overrideAccess: true })
const variants = await payload.count({ collection: 'tire-variants', where: { status: { equals: 'published' } }, overrideAccess: true })
const noImage = await payload.find({
  collection: 'tire-models',
  where: { and: [{ status: { equals: 'published' } }, { mainImage: { exists: false } }] },
  limit: 5,
  depth: 0,
  overrideAccess: true,
})
console.log(JSON.stringify({
  publishedModels: models.totalDocs,
  publishedVariants: variants.totalDocs,
  publishedWithoutMainImage: noImage.totalDocs,
}, null, 2))
process.exit(0)
