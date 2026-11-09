import { Hono } from 'hono'
import type { Env } from '../types'
import { json, err, uuid, slugify, nowIso } from '../lib/helpers'
import { imageKey } from '../lib/r2'
import { processGalleryAI } from '../lib/process'

const app = new Hono<{ Bindings: Env }>()

interface RapidImage {
  filename?: string
  width?: number
  height?: number
  caption?: string
  alt?: string
  tags?: string[]
  data?: string // base64 or data URI
  url?: string // remote URL
  variants?: Array<{ width: number; data?: string; url?: string }>
}

async function resolveBytes(src: { data?: string; url?: string }): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    if (src.url) {
      const res = await fetch(src.url)
      if (!res.ok) return null
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      return { bytes: new Uint8Array(await res.arrayBuffer()), contentType }
    }
    if (src.data) {
      let b64 = src.data
      let contentType = 'image/jpeg'
      if (b64.startsWith('data:')) {
        const m = b64.match(/^data:([^;]+);base64,(.*)$/s)
        if (!m) return null
        contentType = m[1]
        b64 = m[2]
      }
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return { bytes, contentType }
    }
    return null
  } catch {
    return null
  }
}

// Health check so rapidraw-web can verify connectivity + credentials.
app.get('/health', async (c) => {
  return json({ ok: true, configured: Boolean(c.env.RAPIDRAW_API_KEY) })
})

/**
 * Publish a gallery straight from rapidraw-web.
 * Body: { apiKey, title, slug?, description?, eventDate?, location?, images: [...] }
 * Each image: { url | data, width?, height?, caption?, variants?: [{ width, url|data }] }
 */
app.post('/publish', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return err('Neispravan JSON.', 400)

  const expected = c.env.RAPIDRAW_API_KEY
  if (!expected) return json({ error: 'RAPIDRAW_API_KEY nije postavljen na serveru.' }, 503)
  if (body.apiKey !== expected) return err('Neispravan API ključ.', 401)
  if (!body.title) return err('title je obavezan.', 400)

  const images: RapidImage[] = Array.isArray(body.images) ? body.images : []
  if (!images.length) return err('images[] je obavezan.', 400)

  const id = uuid()
  const baseSlug = slugify(body.slug || body.title)
  let slug = baseSlug
  let n = 1
  while (await c.env.DB.prepare('SELECT id FROM galleries WHERE slug = ?').bind(slug).first()) {
    slug = `${baseSlug}-${n++}`
  }

  await c.env.DB.prepare(
    `INSERT INTO galleries (id, slug, title, description, event_date, location, tags, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
  )
    .bind(id, slug, body.title, body.description ?? null, body.eventDate ?? null, body.location ?? null, JSON.stringify(Array.isArray(body.tags) ? body.tags : []), nowIso())
    .run()

  const insertImage = c.env.DB.prepare(
    `INSERT INTO images (id, gallery_id, width, height, alt, caption, tags, variants, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  let stored = 0
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const imageId = uuid()
    const variants: number[] = []
    const width = img.width || 1600
    const height = img.height || null

    if (Array.isArray(img.variants) && img.variants.length) {
      for (const v of img.variants) {
        const r = await resolveBytes(v)
        if (!r) continue
        const w = v.width || width
        variants.push(w)
        await c.env.BUCKET.put(imageKey(c.env, id, imageId, w), r.bytes, { httpMetadata: { contentType: r.contentType } })
      }
    } else {
      const r = await resolveBytes(img)
      if (!r) continue
      variants.push(width)
      await c.env.BUCKET.put(imageKey(c.env, id, imageId, width), r.bytes, { httpMetadata: { contentType: r.contentType } })
    }

    if (!variants.length) continue
    await insertImage.bind(imageId, id, width, height, img.alt ?? null, img.caption ?? null, JSON.stringify(Array.isArray(img.tags) ? img.tags : []), JSON.stringify(variants), i, nowIso()).run()
    stored++
  }

  c.executionCtx.waitUntil(processGalleryAI(c.env, id))

  return json({ ok: true, slug, galleryId: id, imagesStored: stored })
})

export default app
