import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAdmin } from '../lib/auth'
import { json, err, slugify, uuid, nowIso, jsonArr } from '../lib/helpers'
import { mapGallery, mapImage, type GalleryRow, type ImageRow } from '../lib/serialize'
import { deleteObjectPrefix } from '../lib/r2'
import { processGalleryAI } from '../lib/process'

const app = new Hono<{ Bindings: Env }>()

const LIST_SQL = `
  SELECT g.*, (SELECT COUNT(*) FROM images i WHERE i.gallery_id = g.id) AS image_count
  FROM galleries g
  WHERE g.status = 'published'
  ORDER BY COALESCE(g.event_date, g.created_at) DESC, g.sort_order ASC
`

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(LIST_SQL).all<GalleryRow>()
  return json(results.map((r) => mapGallery(c.env, r)))
})

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const gallery = await c.env.DB.prepare(
    `SELECT g.*, (SELECT COUNT(*) FROM images i WHERE i.gallery_id = g.id) AS image_count
     FROM galleries g WHERE g.slug = ? AND g.status = 'published'`,
  )
    .bind(slug)
    .first<GalleryRow>()

  if (!gallery) return json({ error: 'Galerija nije pronađena.' }, 404)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM images WHERE gallery_id = ? ORDER BY sort_order ASC, created_at ASC',
  )
    .bind(gallery.id)
    .all<ImageRow>()

  return json({ gallery: mapGallery(c.env, gallery), images: results.map((r) => mapImage(c.env, r)) })
})

// ---- Admin ----

app.get('/admin/all', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT g.*, (SELECT COUNT(*) FROM images i WHERE i.gallery_id = g.id) AS image_count
     FROM galleries g ORDER BY COALESCE(g.event_date, g.created_at) DESC`,
  ).all<GalleryRow>()
  return json(results.map((r) => mapGallery(c.env, r)))
})

app.post('/admin', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body?.title) return err('Naslov je obavezan.', 400)
  const id = uuid()
  const baseSlug = slugify(body.slug || body.title)
  let slug = baseSlug
  let n = 1
  while (await c.env.DB.prepare('SELECT id FROM galleries WHERE slug = ?').bind(slug).first()) {
    slug = `${baseSlug}-${n++}`
  }
  await c.env.DB.prepare(
    `INSERT INTO galleries (id, slug, title, description, event_date, event_end_date, location, tags, sort_order, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      body.title,
      body.description ?? null,
      body.event_date ?? null,
      body.event_end_date ?? null,
      body.location ?? null,
      JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
      body.sort_order ?? 0,
      body.status ?? 'published',
      nowIso(),
    )
    .run()
  const row = await c.env.DB.prepare('SELECT * FROM galleries WHERE id = ?').bind(id).first<GalleryRow>()
  return json(mapGallery(c.env, row!), 201)
})

app.put('/admin/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  if (!body) return err('Invalid body', 400)
  const existing = await c.env.DB.prepare('SELECT * FROM galleries WHERE id = ?').bind(id).first<GalleryRow>()
  if (!existing) return json({ error: 'Nije pronađeno.' }, 404)

  await c.env.DB.prepare(
    `UPDATE galleries SET title = ?, description = ?, event_date = ?, event_end_date = ?, location = ?, tags = ?, sort_order = ?, status = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(
      body.title ?? existing.title,
      body.description ?? existing.description,
      body.event_date ?? existing.event_date,
      body.event_end_date ?? existing.event_end_date,
      body.location ?? existing.location,
      JSON.stringify(Array.isArray(body.tags) ? body.tags : jsonArr(existing.tags)),
      body.sort_order ?? existing.sort_order,
      body.status ?? existing.status,
      nowIso(),
      id,
    )
    .run()

  const row = await c.env.DB.prepare('SELECT * FROM galleries WHERE id = ?').bind(id).first<GalleryRow>()
  return json(mapGallery(c.env, row!))
})

app.delete('/admin/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM galleries WHERE id = ?').bind(id).run()
  await deleteObjectPrefix(c.env, `galleries/${id}/`)
  return json({ ok: true })
})

// Re-run AI enrichment (caption/tags/description/cover) for a gallery.
app.post('/admin/:id/ai', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const gallery = await c.env.DB.prepare('SELECT id FROM galleries WHERE id = ?').bind(id).first()
  if (!gallery) return json({ error: 'Nije pronađeno.' }, 404)
  c.executionCtx.waitUntil(processGalleryAI(c.env, id))
  return json({ ok: true, queued: true })
})

export default app
