import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import api from './api'
import { serveObject } from './lib/r2'
import { getSite } from './lib/site'

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization'], allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }))

// API
app.route('/api', api)

// Public image serving from R2 (with immutable cache headers).
app.get('/files/*', async (c) => {
  const key = c.req.path.replace(/^\/files\//, '')
  return serveObject(c.env, key)
})

// Static assets (js/css/fonts/etc.) + SPA navigation with server-rendered meta tags.
app.all('*', async (c) => {
  const url = new URL(c.req.url)
  const path = url.pathname

  try {
    // Real static files: serve directly from the ASSETS binding.
    if (path.startsWith('/assets/') || path.startsWith('/favicon') || path.startsWith('/robots') || /\.[a-z0-9]{1,6}$/i.test(path)) {
      return c.env.ASSETS.fetch(c.req.raw)
    }

    // Navigation route → return the SPA shell with SSR meta injected.
    const index = await c.env.ASSETS.fetch(new Request(url.origin + '/index.html'))
    if (!index.ok) {
      return new Response('Frontend nije izgrađen. Pokreni `npm run build` pa ponovno deployaj.', {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }

    const html = await index.text()
    const meta = await buildMeta(c.env, path, url.origin)
    return new Response(injectMeta(html, meta), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch (e) {
    return new Response(`Server error: ${(e as Error).message}`, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
})

interface Meta {
  title: string
  description: string
  image: string
  url: string
  type: string
}

async function buildMeta(env: Env, path: string, origin: string): Promise<Meta> {
  const site = await getSite(env)
  const abs = (p: string) => (p.startsWith('http') ? p : `${origin}${p.startsWith('/') ? '' : '/'}${p}`)

  const base: Meta = {
    title: site.seo.title || `${site.name} — ${site.tagline}`,
    description: site.seo.description || site.description || '',
    image: site.seo.image ? abs(site.seo.image) : '',
    url: origin + path,
    type: 'website',
  }

  const galleryMatch = path.match(/^\/gallery\/([^/]+)/)
  if (galleryMatch) {
    const g = await env.DB.prepare(
      "SELECT id, title, description, cover_image_id FROM galleries WHERE slug = ? AND status = 'published'",
    )
      .bind(galleryMatch[1])
      .first<{ id: string; title: string; description: string | null; cover_image_id: string | null }>()
    if (g) {
      base.title = `${g.title} — ${site.name}`
      base.description = g.description || base.description
      if (g.cover_image_id) {
        base.image = abs(`/files/galleries/${g.id}/${g.cover_image_id}/640.webp`)
      }
    }
  }

  const postMatch = path.match(/^\/post\/([^/]+)/)
  if (postMatch) {
    const p = await env.DB.prepare("SELECT title, excerpt, cover_image_id FROM posts WHERE slug = ? AND status = 'published'")
      .bind(postMatch[1])
      .first<{ title: string; excerpt: string | null; cover_image_id: string | null }>()
    if (p) {
      base.title = `${p.title} — ${site.name}`
      base.description = p.excerpt || base.description
      if (p.cover_image_id) base.image = abs(p.cover_image_id)
      base.type = 'article'
    }
  }

  const pageMatch = path.match(/^\/page\/([^/]+)/)
  if (pageMatch) {
    const p = await env.DB.prepare("SELECT title, body FROM pages WHERE slug = ? AND status = 'published'")
      .bind(pageMatch[1])
      .first<{ title: string; body: string | null }>()
    if (p) {
      base.title = `${p.title} — ${site.name}`
      base.description = (p.body || '').replace(/<[^>]+>/g, '').trim().slice(0, 160) || base.description
    }
  }

  return base
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string))
}

function injectMeta(html: string, meta: Meta): string {
  let out = html
  if (meta.title) out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`)

  const tags: string[] = []
  if (meta.description) tags.push(`<meta name="description" content="${escapeHtml(meta.description)}">`)
  if (meta.title) tags.push(`<meta property="og:title" content="${escapeHtml(meta.title)}">`)
  if (meta.description) tags.push(`<meta property="og:description" content="${escapeHtml(meta.description)}">`)
  tags.push(`<meta property="og:type" content="${meta.type}">`)
  tags.push(`<meta property="og:url" content="${escapeHtml(meta.url)}">`)
  tags.push(`<meta property="og:site_name" content="${escapeHtml(meta.title.split(' — ')[0] || meta.title)}">`)
  if (meta.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(meta.image)}">`)
    tags.push(`<meta name="twitter:card" content="summary_large_image">`)
    tags.push(`<meta name="twitter:image" content="${escapeHtml(meta.image)}">`)
  }
  if (meta.title) tags.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}">`)
  if (meta.description) tags.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}">`)

  if (tags.length) out = out.replace(/<\/head>/i, `    ${tags.join('\n    ')}\n  </head>`)
  return out
}

export default app
