import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAdmin } from '../lib/auth'
import { json, err } from '../lib/helpers'
import { designFromPrompt } from '../lib/designAi'

const app = new Hono<{ Bindings: Env }>()

// Natural language -> design config (colors, fonts, layout, theme).
app.post('/admin/ai', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  const prompt = String(body?.prompt || '').trim()
  if (!prompt) return err('Opiši kakav dizajn želiš.', 400)
  const design = await designFromPrompt(c.env.AI, prompt)
  if (!design) return err('AI nije vratio dizajn. Pokušaj ponovno.', 502)
  return json(design)
})

export default app
