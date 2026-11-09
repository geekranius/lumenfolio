import { Hono } from 'hono'
import type { Env, SiteSettings } from '../types'
import { getSite, saveSite } from '../lib/site'
import { requireAdmin } from '../lib/auth'
import { json } from '../lib/helpers'

const app = new Hono<{ Bindings: Env }>()

// Public site settings (safe for everyone; no secrets live here).
app.get('/', async (c) => {
  const site = await getSite(c.env)
  return json(site)
})

// Admin: read full settings.
app.get('/admin', requireAdmin, async (c) => {
  return json(await getSite(c.env))
})

// Admin: update settings (partial merge on the backend via saveSite + deep merge).
app.put('/admin', requireAdmin, async (c) => {
  const body = (await c.req.json().catch(() => null)) as Partial<SiteSettings> | null
  if (!body) return json({ error: 'Invalid body' }, 400)
  const current = await getSite(c.env)
  const next: SiteSettings = { ...current, ...body }
  // merge nested objects manually for the common ones
  if (body.contact) next.contact = { ...current.contact, ...body.contact }
  if (body.seo) next.seo = { ...current.seo, ...body.seo }
  await saveSite(c.env, next)
  return json(next)
})

export default app
