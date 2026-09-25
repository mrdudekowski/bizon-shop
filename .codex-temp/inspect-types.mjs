import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
const types = await payload.find({ collection: 'tire-types', limit: 50, pagination: false, overrideAccess: true })
console.log(JSON.stringify(types.docs.map(d => ({ id: d.id, name: d.name, slug: d.slug, status: d.status })), null, 2))
process.exit(0)
