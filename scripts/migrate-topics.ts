import { createClient } from '@sanity/client'
import { projectId, dataset, apiVersion } from '../sanity/env'

async function main() {
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN
  if (!token) {
    console.error('Missing SANITY_API_TOKEN or SANITY_WRITE_TOKEN environment variable. Provide a write token and re-run.')
    process.exit(1)
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  })

  console.log('Fetching posts...')
  const posts: any[] = await client.fetch('*[_type == "post"]{_id, _rev, title, slug, topics, tags}')
  console.log(`Found ${posts.length} posts`)

  let updated = 0
  for (const p of posts) {
    const existing = p.topics
    // If it's already the object shape with safe keys, skip
    const isObject = existing && typeof existing === 'object' && !Array.isArray(existing)
    const hasSafeKeys = isObject && ('cpi' in existing || 'apim' in existing || 'eventMesh' in existing || 'edi' in existing)
    if (hasSafeKeys) continue

    const obj: Record<string, boolean> = { cpi: false, apim: false, eventMesh: false, edi: false }

    // prefer topics array if present
    if (Array.isArray(existing)) {
      for (const t of existing) {
        if (!t) continue
        const s = String(t).toLowerCase()
        if (s === 'cpi') obj.cpi = true
        if (s === 'apim' || s === 'api management') obj.apim = true
        if (s === 'event mesh') obj.eventMesh = true
        if (s === 'edi') obj.edi = true
      }
    } else if (Array.isArray(p.tags)) {
      for (const t of p.tags) {
        if (!t) continue
        const s = String(t).toLowerCase()
        if (s === 'cpi') obj.cpi = true
        if (s === 'apim' || s === 'api management') obj.apim = true
        if (s === 'event mesh') obj.eventMesh = true
        if (s === 'edi') obj.edi = true
      }
    }

    const any = obj.cpi || obj.apim || obj.eventMesh || obj.edi
    if (!any) {
      // nothing to set
      continue
    }

    try {
      console.log(`Patching ${p._id} ->`, obj)
      await client.patch(p._id).set({ topics: obj }).commit({ autoGenerateArrayKeys: false })
      updated++
    } catch (err) {
      console.error('Failed to patch', p._id, err)
    }
  }

  console.log(`Migration complete. Updated ${updated} posts.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
