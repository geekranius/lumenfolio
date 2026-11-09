import { Hono } from 'hono'
import type { Env } from '../types'
import { json } from '../lib/helpers'
import { mapImage, type ImageRow } from '../lib/serialize'

const app = new Hono<{ Bindings: Env }>()

// Simple full-text-ish search across image captions, alt and tags.
app.get('/', async (c) => {
  const q = (c.req.query('q') || '').trim()
  if (!q) return json([])
  const like = `%${q}%`
  const { results } = await c.env.DB.prepare(
    `SELECT i.* FROM images i
     JOIN galleries g ON g.id = i.gallery_id
     WHERE g.status = 'published'
       AND (i.caption LIKE ? OR i.alt LIKE ? OR i.tags LIKE ?)
     ORDER BY i.created_at DESC
     LIMIT 60`,
  )
    .bind(like, like, like)
    .all<ImageRow>()
  return json(results.map((r) => mapImage(c.env, r)))
})

export default app
