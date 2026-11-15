import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import api from './api'
import { imagePath, pickWidth, serveObject } from './lib/r2'
import { getSite } from './lib/site'
import { handleMcp } from './mcp'

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization'], allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }))

// API
app.route('/api', api)

// Public image serving from R2 (with immutable cache headers).
app.get('/files/*', async (c) => {
  const key = c.req.path.replace(/^\/files\//, '')
  return serveObject(c.env, key)
})

// MCP server (Model Context Protocol) — connect external AI tools.
app.all('/mcp', (c) => handleMcp(c))

// Search engine discovery endpoints are generated from the live published archive.
app.get('/robots.txt', async (c) => {
  const origin = new URL(c.req.url).origin
  return c.text(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /mcp\nSitemap: ${origin}/sitemap.xml\n`, 200, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=3600',
  })
})

app.get('/sitemap.xml', async (c) => {
  const origin = new URL(c.req.url).origin
  const [galleries, posts, pages] = await Promise.all([
    c.env.DB.prepare("SELECT id, slug, title, description, updated_at, created_at FROM galleries WHERE status = 'published' ORDER BY sort_order, event_date DESC").all<{ id: string; slug: string; title: string; description: string | null; updated_at: string | null; created_at: string | null }>(),
    c.env.DB.prepare("SELECT slug, updated_at, published_at, created_at FROM posts WHERE status = 'published'").all<{ slug: string; updated_at: string | null; published_at: string | null; created_at: string | null }>(),
    c.env.DB.prepare("SELECT slug, updated_at, created_at FROM pages WHERE status = 'published'").all<{ slug: string; updated_at: string | null; created_at: string | null }>(),
  ])
  const imageRows = await c.env.DB.prepare(
    "SELECT i.gallery_id, i.id, i.alt, i.caption, i.variants, i.sort_order, g.slug FROM images i JOIN galleries g ON g.id = i.gallery_id WHERE g.status = 'published' ORDER BY g.sort_order, i.sort_order",
  ).all<{ gallery_id: string; id: string; alt: string | null; caption: string | null; variants: string | null; sort_order: number; slug: string }>()
  const photosByGallery = new Map<string, typeof imageRows.results>()
  for (const image of imageRows.results || []) {
    const list = photosByGallery.get(image.gallery_id) || []
    list.push(image)
    photosByGallery.set(image.gallery_id, list)
  }
  const xml = (value: string) => value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch] as string))
  const urls: string[] = [`<url><loc>${xml(origin + '/')}</loc></url>`, `<url><loc>${xml(origin + '/galleries')}</loc></url>`]
  for (const gallery of galleries.results || []) {
    const path = `/gallery/${gallery.slug}`
    const lastmod = gallery.updated_at || gallery.created_at
    const lastmodXml = lastmod ? `<lastmod>${xml(lastmod.slice(0, 10))}</lastmod>` : ''
    const galleryImages = photosByGallery.get(gallery.id) || []
    const imageXml = galleryImages.map((img) => {
      let variants: number[] = []
      try { variants = JSON.parse(img.variants || '[]') } catch { /* use the default image width */ }
      const width = pickWidth(variants, 1600)
      const imageUrl = origin + imagePath(c.env, gallery.id, img.id, width)
      const imageTitle = img.caption || img.alt || gallery.title
      const imageCaption = img.alt || img.caption || `${gallery.title} — koncertna fotografija`
      return `<image:image><image:loc>${xml(imageUrl)}</image:loc><image:caption>${xml(imageCaption)}</image:caption><image:title>${xml(imageTitle)}</image:title></image:image>`
    }).join('')
    urls.push(`<url><loc>${xml(origin + path)}</loc>${lastmodXml}${imageXml}</url>`)
  }
  for (const post of posts.results || []) {
    const lastmod = post.updated_at || post.published_at || post.created_at
    urls.push(`<url><loc>${xml(origin + `/post/${post.slug}`)}</loc>${lastmod ? `<lastmod>${xml(lastmod.slice(0, 10))}</lastmod>` : ''}</url>`)
  }
  for (const page of pages.results || []) {
    const lastmod = page.updated_at || page.created_at
    urls.push(`<url><loc>${xml(origin + `/page/${page.slug}`)}</loc>${lastmod ? `<lastmod>${xml(lastmod.slice(0, 10))}</lastmod>` : ''}</url>`)
  }
  return c.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls.join('')}</urlset>`, 200, {
    'content-type': 'application/xml; charset=utf-8',
    'cache-control': 'public, max-age=3600',
  })
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
  siteName: string
  description: string
  image: string
  url: string
  type: string
  keywords: string
  imageAlt: string
  schema: Record<string, unknown>
}

async function buildMeta(env: Env, path: string, origin: string): Promise<Meta> {
  const site = await getSite(env)
  const abs = (p: string) => (p.startsWith('http') ? p : `${origin}${p.startsWith('/') ? '' : '/'}${p}`)

  const base: Meta = {
    title: site.seo.title || `${site.name} — ${site.tagline}`,
    siteName: site.name,
    description: site.seo.description || site.description || '',
    image: site.seo.image ? abs(site.seo.image) : '',
    url: origin + path,
    type: 'website',
    keywords: site.seo.keywords || '',
    imageAlt: site.name,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: `${origin}/`,
      description: site.seo.description || site.description || site.tagline,
      inLanguage: site.locale || 'hr',
    },
  }

  const galleryMatch = path.match(/^\/gallery\/([^/]+)/)
  if (galleryMatch) {
    const g = await env.DB.prepare(
      "SELECT id, title, description, cover_image_id, tags, event_date, location FROM galleries WHERE slug = ? AND status = 'published'",
    )
      .bind(galleryMatch[1])
      .first<{ id: string; title: string; description: string | null; cover_image_id: string | null; tags: string | null; event_date: string | null; location: string | null }>()
    if (g) {
      base.title = `${g.title} — ${site.name}`
      base.description = g.description || base.description
      if (g.cover_image_id) {
        base.image = abs(`/files/galleries/${g.id}/${g.cover_image_id}/640.webp`)
      }
      let galleryTags: string[] = []
      try { galleryTags = JSON.parse(g.tags || '[]') } catch { /* no gallery tags */ }
      base.keywords = [...new Set([...galleryTags, ...(site.seo.keywords || '').split(',').map((tag) => tag.trim()).filter(Boolean)])].join(', ')
      base.imageAlt = `${g.title} — koncertna fotografija${g.location ? `, ${g.location}` : ''}`
      base.schema = {
        '@context': 'https://schema.org',
        '@type': 'ImageGallery',
        name: g.title,
        url: origin + path,
        description: g.description || base.description,
        datePublished: g.event_date || undefined,
        contentLocation: g.location ? { '@type': 'Place', name: g.location } : undefined,
        keywords: galleryTags.join(', '),
        image: base.image || undefined,
        isPartOf: { '@type': 'WebSite', name: site.name, url: `${origin}/` },
      }
    }
  }

  const postMatch = path.match(/^\/post\/([^/]+)/)
  if (postMatch) {
    const p = await env.DB.prepare("SELECT title, excerpt, body, cover_image_id, tags, published_at FROM posts WHERE slug = ? AND status = 'published'")
      .bind(postMatch[1])
      .first<{ title: string; excerpt: string | null; body: string | null; cover_image_id: string | null; tags: string | null; published_at: string | null }>()
    if (p) {
      base.title = `${p.title} — ${site.name}`
      base.description = p.excerpt || base.description
      if (p.cover_image_id) base.image = abs(p.cover_image_id)
      base.type = 'article'
      let postTags: string[] = []
      try { postTags = JSON.parse(p.tags || '[]') } catch { /* no post tags */ }
      base.keywords = [...new Set([...postTags, ...base.keywords.split(',').map((tag) => tag.trim()).filter(Boolean)])].join(', ')
      base.schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt || base.description, datePublished: p.published_at || undefined, image: base.image || undefined, keywords: postTags.join(', '), mainEntityOfPage: base.url, author: { '@type': 'Person', name: site.name }, publisher: { '@type': 'Organization', name: site.name } }
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
      base.schema = { '@context': 'https://schema.org', '@type': 'WebPage', name: p.title, description: base.description, url: base.url, isPartOf: { '@type': 'WebSite', name: site.name, url: `${origin}/` } }
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
  if (meta.keywords) tags.push(`<meta name="keywords" content="${escapeHtml(meta.keywords)}">`)
  tags.push('<meta name="robots" content="index,follow,max-image-preview:large">')
  tags.push(`<link rel="canonical" href="${escapeHtml(meta.url)}">`)
  if (meta.title) tags.push(`<meta property="og:title" content="${escapeHtml(meta.title)}">`)
  if (meta.description) tags.push(`<meta property="og:description" content="${escapeHtml(meta.description)}">`)
  tags.push(`<meta property="og:type" content="${meta.type}">`)
  tags.push(`<meta property="og:url" content="${escapeHtml(meta.url)}">`)
  tags.push(`<meta property="og:site_name" content="${escapeHtml(meta.siteName)}">`)
  if (meta.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(meta.image)}">`)
    tags.push(`<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}">`)
    tags.push(`<meta name="twitter:card" content="summary_large_image">`)
    tags.push(`<meta name="twitter:image" content="${escapeHtml(meta.image)}">`)
  }
  if (meta.title) tags.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}">`)
  if (meta.description) tags.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}">`)
  tags.push(`<script type="application/ld+json">${JSON.stringify(meta.schema).replace(/</g, '\\u003c')}</script>`)

  if (tags.length) out = out.replace(/<\/head>/i, `    ${tags.join('\n    ')}\n  </head>`)
  return out
}

export default app
