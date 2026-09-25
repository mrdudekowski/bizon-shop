import { getPayload } from 'payload'
import config from '@payload-config'
import { parseTireSize } from './src/lib/catalog/domain/parseTireSize.ts'

console.log('parse', parseTireSize('13R22.5'))
console.log('parse 13.00', parseTireSize('13.00R22.5'))

const payload = await getPayload({ config })
try {
  const r = await payload.update({
    collection: 'tire-variants',
    id: 35,
    data: { status: 'published' },
    overrideAccess: true,
  })
  console.log('ok', r.id, r.status, r.sizeNormalized)
} catch (e) {
  console.error('ERR', e.message || e)
  // dump current
  const v = await payload.findByID({ collection: 'tire-variants', id: 35, depth: 0, overrideAccess: true })
  console.log('current', { status: v.status, sizeRaw: v.sizeRaw, sizeNormalized: v.sizeNormalized })
}
process.exit(0)
