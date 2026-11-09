import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAdmin } from '../lib/auth'
import { json, err, uuid, nowIso } from '../lib/helpers'
import { mapImage, type ImageRow } from '../lib/serialize'
import { processGalleryAI } from '../lib/process'
import { deleteObjectPrefix } from '../lib/r2'
import { pickCover } from '../lib/ai'

const app = new Hono<{ Bindings: Env }>()

// Public: images for a gallery (list form, without requiring gallery detail).
app.get('/', async (c) => {
  const galleryId = c.req.query('gallery')
  if (!galleryId) return json([])
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM images WHERE gallery_id = ? ORDER BY sort_order ASC, created_at ASC',
  )
    .bind(galleryId)
    .all<ImageRow>()
  return json(results.map((r) => mapImage(c.env, r)))
})

// Admin: register images after their files were uploaded to R2.
app.post('/admin', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  const galleryId: string | undefined = body?.galleryId
  const images: any[] = body?.images
  if (!galleryId || !Array.isArray(images)) return err('galleryId i images[] su obavezni.', 400)

  const gallery = await c.env.DB.prepare('SELECT id FROM galleries WHERE id = ?').bind(galleryId).first()
  if (!gallery) return json({ error: 'Galerija ne postoji.' }, 404)

  const stmt = c.env.DB.prepare(
    `INSERT INTO images (id, gallery_id, width, height, alt, caption, tags, variants, exif, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const batch = []
  const inserted: Array<{ id: string; width: number | null; height: number | null }> = []
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const id = img.id || uuid()
    const variants = Array.isArray(img.variants) ? img.variants.map(Number).filter((n: number) => n > 0) : []
    inserted.push({ id, width: img.width ?? null, height: img.height ?? null })
    batch.push(
      stmt.bind(
        id,
        galleryId,
        img.width ?? null,
        img.height ?? null,
        img.alt ?? null,
        img.caption ?? null,
        JSON.stringify(Array.isArray(img.tags) ? img.tags : []),
        JSON.stringify(variants),
        img.exif ? JSON.stringify(img.exif) : null,
        img.sort_order ?? i,
        nowIso(),
      ),
    )
  }
  await c.env.DB.batch(batch)

  // Set a cover image immediately (no AI needed) so the gallery always has one.
  const coverId = pickCover(inserted)
  if (coverId) {
    await c.env.DB.prepare('UPDATE galleries SET cover_image_id = COALESCE(cover_image_id, ?) WHERE id = ?')
      .bind(coverId, galleryId)
      .run()
  }

  c.executionCtx.waitUntil(processGalleryAI(c.env, galleryId))
  return json({ ok: true, count: images.length })
})

app.put('/admin/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  if (!body) return err('Invalid body', 400)
  const existing = await c.env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(id).first<ImageRow>()
  if (!existing) return json({ error: 'Nije pronađeno.' }, 404)

  await c.env.DB.prepare(
    'UPDATE images SET alt = ?, caption = ?, tags = ?, sort_order = ? WHERE id = ?',
  )
    .bind(
      body.alt ?? existing.alt,
      body.caption ?? existing.caption,
      JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
      body.sort_order ?? existing.sort_order,
      id,
    )
    .run()

  const row = await c.env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(id).first<ImageRow>()
  return json(mapImage(c.env, row!))
})

app.delete('/admin/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const img = await c.env.DB.prepare('SELECT id, gallery_id FROM images WHERE id = ?').bind(id).first()
  if (!img) return json({ error: 'Nije pronađeno.' }, 404)
  await c.env.DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run()
  await deleteObjectPrefix(c.env, `galleries/${img.gallery_id}/${id}/`)
  return json({ ok: true })
})

// Reorder images in a gallery.
app.post('/admin/reorder', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  const ids: string[] = body?.ids
  if (!Array.isArray(ids)) return err('ids[] je obavezan.', 400)
  const stmt = c.env.DB.prepare('UPDATE images SET sort_order = ? WHERE id = ?')
  await c.env.DB.batch(ids.map((id, i) => stmt.bind(i, id)))
  return json({ ok: true })
})

export default app
