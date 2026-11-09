import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAdmin } from '../lib/auth'
import { json, err, uuid, nowIso, slugify } from '../lib/helpers'

const app = new Hono<{ Bindings: Env }>()

interface PageRow {
  id: string
  slug: string
  title: string
  body: string | null
  status: string
  created_at: string
}

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM pages WHERE status = 'published' ORDER BY created_at ASC").all<PageRow>()
  return json(results)
})

app.get('/:slug', async (c) => {
  const row = await c.env.DB.prepare("SELECT * FROM pages WHERE slug = ? AND status = 'published'").bind(c.req.param('slug')).first<PageRow>()
  if (!row) return json({ error: 'Nije pronađeno.' }, 404)
  return json(row)
})

// ---- Admin ----

app.get('/admin/all', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM pages ORDER BY created_at ASC').all<PageRow>()
  return json(results)
})

app.post('/admin', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body?.title) return err('Naslov je obavezan.', 400)
  const id = uuid()
  const baseSlug = slugify(body.slug || body.title)
  let slug = baseSlug
  let n = 1
  while (await c.env.DB.prepare('SELECT id FROM pages WHERE slug = ?').bind(slug).first()) slug = `${baseSlug}-${n++}`
  await c.env.DB.prepare('INSERT INTO pages (id, slug, title, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, slug, body.title, body.body ?? null, body.status ?? 'published', nowIso())
    .run()
  const row = await c.env.DB.prepare('SELECT * FROM pages WHERE id = ?').bind(id).first<PageRow>()
  return json(row, 201)
})

app.put('/admin/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const existing = await c.env.DB.prepare('SELECT * FROM pages WHERE id = ?').bind(id).first<PageRow>()
  if (!existing) return json({ error: 'Nije pronađeno.' }, 404)
  await c.env.DB.prepare('UPDATE pages SET title=?, body=?, status=?, updated_at=? WHERE id=?')
    .bind(body.title ?? existing.title, body.body ?? existing.body, body.status ?? existing.status, nowIso(), id)
    .run()
  const row = await c.env.DB.prepare('SELECT * FROM pages WHERE id = ?').bind(id).first<PageRow>()
  return json(row)
})

app.delete('/admin/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM pages WHERE id = ?').bind(c.req.param('id')).run()
  return json({ ok: true })
})

export default app
