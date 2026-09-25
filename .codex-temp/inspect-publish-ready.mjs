import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const types = await payload.find({ collection: 'tire-types', limit: 50, depth: 0, overrideAccess: true })
console.log('tire-types', types.docs.map(d => ({ id: d.id, name: d.name, slug: d.slug, status: d.status, _status: d._status })))

const media = await payload.find({ collection: 'media', limit: 5, depth: 0, overrideAccess: true, sort: '-createdAt' })
console.log('media count', media.totalDocs, 'sample', media.docs.map(d => ({ id: d.id, filename: d.filename, url: d.url })))

const models = await payload.find({ collection: 'tire-models', limit: 3, depth: 0, overrideAccess: true, depth: 0 })
console.log('model sample keys', Object.keys(models.docs[0] || {}))
console.log('model sample', models.docs.slice(0,2).map(d => ({ id: d.id, name: d.name, slug: d.slug, status: d.status, _status: d._status, mainImage: d.mainImage, tireType: d.tireType })))
process.exit(0)
