import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAdmin } from '../lib/auth'
import { json } from '../lib/helpers'

const app = new Hono<{ Bindings: Env }>()

function pathToKey(path: string): string {
  return path.replace(/^\/api\/admin\/files\//, '').replace(/^\/files\//, '')
}

// Upload a binary file straight into R2 under /api/admin/files/<key>.
app.put('/*', requireAdmin, async (c) => {
  const key = pathToKey(c.req.path)
  if (!key) return json({ error: 'Missing key' }, 400)
  const contentType = c.req.header('content-type') || 'application/octet-stream'
  const body = await c.req.arrayBuffer()
  await c.env.BUCKET.put(key, body, { httpMetadata: { contentType } })
  return json({ ok: true, key })
})

app.delete('/*', requireAdmin, async (c) => {
  const key = pathToKey(c.req.path)
  if (!key) return json({ error: 'Missing key' }, 400)
  await c.env.BUCKET.delete(key)
  return json({ ok: true })
})

export default app
