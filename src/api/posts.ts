import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAdmin } from '../lib/auth'
import { json, err, uuid, nowIso, slugify, jsonArr } from '../lib/helpers'
import { imagePath } from '../lib/r2'

const app = new Hono<{ Bindings: Env }>()

interface PostRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string | null
  cover_image_id: string | null
  tags: string | null
  status: string
  published_at: string | null
  created_at: string
}

function mapPost(env: Env, row: PostRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    tags: jsonArr(row.tags),
    status: row.status,
    published_at: row.published_at ?? row.created_at,
    created_at: row.created_at,
    // cover_image_id stores a URL (absolute or relative /files/...) chosen in the editor.
    cover: row.cover_image_id || null,
  }
}

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM posts WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC",
  ).all<PostRow>()
  return json(results.map((r) => mapPost(c.env, r)))
})

app.get('/:slug', async (c) => {
  const row = await c.env.DB.prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .bind(c.req.param('slug'))
    .first<PostRow>()
  if (!row) return json({ error: 'Nije pronađeno.' }, 404)
  return json(mapPost(c.env, row))
})

// ---- Admin ----

app.get('/admin/all', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC').all<PostRow>()
  return json(results.map((r) => mapPost(c.env, r)))
})

app.get('/admin/:id', requireAdmin, async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(c.req.param('id')).first<PostRow>()
  if (!row) return json({ error: 'Nije pronađeno.' }, 404)
  return json(mapPost(c.env, row))
})

app.post('/admin', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body?.title) return err('Naslov je obavezan.', 400)
  const id = uuid()
  const baseSlug = slugify(body.slug || body.title)
  let slug = baseSlug
  let n = 1
  while (await c.env.DB.prepare('SELECT id FROM posts WHERE slug = ?').bind(slug).first()) slug = `${baseSlug}-${n++}`
  await c.env.DB.prepare(
    `INSERT INTO posts (id, slug, title, excerpt, body, cover_image_id, tags, status, published_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, slug, body.title, body.excerpt ?? null, body.body ?? null, body.cover_image_id ?? null, JSON.stringify(Array.isArray(body.tags) ? body.tags : []), body.status ?? 'published', body.published_at ?? nowIso(), nowIso())
    .run()
  const row = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first<PostRow>()
  return json(mapPost(c.env, row!), 201)
})

app.put('/admin/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const existing = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first<PostRow>()
  if (!existing) return json({ error: 'Nije pronađeno.' }, 404)
  await c.env.DB.prepare(
    `UPDATE posts SET title=?, excerpt=?, body=?, cover_image_id=?, tags=?, status=?, published_at=?, updated_at=? WHERE id=?`,
  )
    .bind(body.title ?? existing.title, body.excerpt ?? existing.excerpt, body.body ?? existing.body, body.cover_image_id ?? existing.cover_image_id, JSON.stringify(Array.isArray(body.tags) ? body.tags : jsonArr(existing.tags)), body.status ?? existing.status, body.published_at ?? existing.published_at, nowIso(), id)
    .run()
  const row = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first<PostRow>()
  return json(mapPost(c.env, row!))
})

app.delete('/admin/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(c.req.param('id')).run()
  return json({ ok: true })
})

export default app
