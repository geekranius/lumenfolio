import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAdmin } from '../lib/auth'
import { json, err, uuid, nowIso } from '../lib/helpers'

const app = new Hono<{ Bindings: Env }>()

interface EventRow {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  time: string | null
  location: string | null
  gallery_id: string | null
  status: string
  created_at: string
}

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM events WHERE status = 'published' ORDER BY start_date DESC",
  ).all<EventRow>()
  return json(results)
})

app.get('/admin', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM events ORDER BY start_date DESC').all<EventRow>()
  return json(results)
})

app.post('/admin', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body?.title || !body?.start_date) return err('title i start_date su obavezni.', 400)
  const id = uuid()
  await c.env.DB.prepare(
    `INSERT INTO events (id, title, description, start_date, end_date, time, location, gallery_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, body.title, body.description ?? null, body.start_date, body.end_date ?? null, body.time ?? null, body.location ?? null, body.gallery_id ?? null, body.status ?? 'published', nowIso())
    .run()
  return json({ id }, 201)
})

app.put('/admin/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const existing = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<EventRow>()
  if (!existing) return json({ error: 'Nije pronađeno.' }, 404)
  await c.env.DB.prepare(
    `UPDATE events SET title=?, description=?, start_date=?, end_date=?, time=?, location=?, gallery_id=?, status=? WHERE id=?`,
  )
    .bind(body.title ?? existing.title, body.description ?? existing.description, body.start_date ?? existing.start_date, body.end_date ?? existing.end_date, body.time ?? existing.time, body.location ?? existing.location, body.gallery_id ?? existing.gallery_id, body.status ?? existing.status, id)
    .run()
  return json({ ok: true })
})

app.delete('/admin/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(c.req.param('id')).run()
  return json({ ok: true })
})

export default app
