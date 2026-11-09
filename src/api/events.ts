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
  const { results: evs } = await c.env.DB.prepare("SELECT * FROM events WHERE status = 'published'").all<EventRow>()
  // Auto-populate the calendar from galleries: each published gallery becomes an
  // event on its event_date (or its upload date when no date is set).
  const { results: gals } = await c.env.DB.prepare(
    "SELECT id, slug, title, description, event_date, location, created_at FROM galleries WHERE status = 'published'",
  ).all<{ id: string; slug: string; title: string; description: string | null; event_date: string | null; location: string | null; created_at: string }>()

  const covered = new Set(evs.map((e) => e.gallery_id).filter(Boolean))
  const extra: EventRow[] = gals
    .filter((g) => !covered.has(g.id))
    .map((g) => ({
      id: 'gallery-' + g.id,
      title: g.title,
      description: g.description,
      start_date: g.event_date || (g.created_at || '').slice(0, 10),
      end_date: null,
      time: null,
      location: g.location,
      gallery_id: g.id,
      status: 'published',
      created_at: g.created_at,
    }))

  const all = [...evs, ...extra].sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''))
  return json(all)
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
