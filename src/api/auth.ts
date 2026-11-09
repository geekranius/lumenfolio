import { Hono } from 'hono'
import type { Env } from '../types'
import { signToken, requireAdmin } from '../lib/auth'
import { err, json } from '../lib/helpers'

const app = new Hono<{ Bindings: Env }>()

// Log in with the admin password (set as ADMIN_PASSWORD secret on deploy).
app.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const password = body?.password
  if (typeof password !== 'string' || !password) return err('Lozinka je obavezna.', 400)
  if (password !== c.env.ADMIN_PASSWORD) return err('Pogrešna lozinka.', 401)
  const token = await signToken(c.env)
  return json({ token })
})

app.get('/check', requireAdmin, async (c) => {
  return json({ ok: true })
})

export default app
