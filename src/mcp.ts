import type { Env } from './types'
import { getBearer, verifyToken } from './lib/auth'
import { getSite, saveSite } from './lib/site'
import { designFromPrompt } from './lib/designAi'
import { uuid, slugify, nowIso } from './lib/helpers'

const toolDefs = [
  {
    name: 'get_site',
    description: 'Read the current portfolio settings (name, tagline, about, contact, socials, design, seo).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_site',
    description:
      'Update portfolio settings. Pass a partial settings object (name, tagline, description, about, contact{email,phone,address,city}, socials[{platform,url,label}], seo{title,description,image}, showCalendar, showPosts).',
    inputSchema: {
      type: 'object',
      properties: { patch: { type: 'object', description: 'Partial SiteSettings object to merge' } },
      required: ['patch'],
    },
  },
  {
    name: 'apply_design',
    description:
      'Apply a visual design config. Fields: preset, mode(dark|light), accent(hex), fontPair, layout(masonry|grid), hero(cinematic|full|split|minimal), radius(0-24), animations(bool), grain(bool), headingCase(normal|uppercase).',
    inputSchema: {
      type: 'object',
      properties: { design: { type: 'object', description: 'Partial design config to merge' } },
      required: ['design'],
    },
  },
  {
    name: 'design_from_prompt',
    description:
      'Describe the desired look in natural language (e.g. "dark cinematic gold accents, big serif headings"). AI turns it into a design config and applies it.',
    inputSchema: {
      type: 'object',
      properties: { prompt: { type: 'string', description: 'Natural language design description' } },
      required: ['prompt'],
    },
  },
  {
    name: 'list_galleries',
    description: 'List all galleries with id, slug, title, date, location and image count.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_gallery',
    description: 'Create a new (empty) gallery. Add photos later via the admin upload panel.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        event_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        location: { type: 'string' },
        status: { type: 'string', enum: ['published', 'draft'] },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_posts',
    description: 'List blog posts (id, slug, title, status).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_post',
    description: 'Create a blog post. Body supports **bold**, *italic*, [link](url), # heading and bare social URLs become embeds.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        excerpt: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['published', 'draft'] },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_event',
    description: 'Create a calendar event.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        start_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        time: { type: 'string' },
        location: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['title', 'start_date'],
    },
  },
  {
    name: 'list_pages',
    description: 'List static pages (About, Contact…).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_page',
    description: 'Create a static page (e.g. About, Contact).',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        status: { type: 'string', enum: ['published', 'draft'] },
      },
      required: ['title'],
    },
  },
]

function rpc(id: any, result: any): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function rpcError(id: any, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

async function callTool(env: Env, name: string, args: any): Promise<string> {
  switch (name) {
    case 'get_site':
      return JSON.stringify(await getSite(env), null, 2)

    case 'update_site': {
      const cur = await getSite(env)
      const patch = args?.patch ?? args ?? {}
      const next: any = { ...cur, ...patch }
      if (patch.contact) next.contact = { ...cur.contact, ...patch.contact }
      if (patch.seo) next.seo = { ...cur.seo, ...patch.seo }
      if (patch.design) next.design = { ...cur.design, ...patch.design }
      await saveSite(env, next)
      return `Site updated. Name: ${next.name}`
    }

    case 'apply_design': {
      const cur = await getSite(env)
      const next: any = { ...cur, design: { ...cur.design, ...(args?.design ?? args ?? {}) } }
      await saveSite(env, next)
      return `Design applied: ${JSON.stringify(next.design)}`
    }

    case 'design_from_prompt': {
      const d = await designFromPrompt(env.AI, String(args?.prompt || ''))
      if (!d) return 'Could not generate a design from that prompt. Try a more specific description.'
      const cur = await getSite(env)
      await saveSite(env, { ...cur, design: d })
      return `Design generated and applied: ${JSON.stringify(d)}`
    }

    case 'list_galleries': {
      const { results } = await env.DB.prepare(
        `SELECT id, slug, title, event_date, location, status,
                (SELECT COUNT(*) FROM images i WHERE i.gallery_id = galleries.id) AS image_count
         FROM galleries ORDER BY COALESCE(event_date, created_at) DESC`,
      ).all()
      return JSON.stringify(results, null, 2)
    }

    case 'create_gallery': {
      if (!args?.title) throw new Error('title is required')
      const id = uuid()
      const base = slugify(args.slug || args.title)
      let slug = base
      let n = 1
      while (await env.DB.prepare('SELECT id FROM galleries WHERE slug = ?').bind(slug).first()) slug = `${base}-${n++}`
      await env.DB.prepare(
        `INSERT INTO galleries (id, slug, title, description, event_date, location, tags, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(id, slug, args.title, args.description ?? null, args.event_date ?? null, args.location ?? null, JSON.stringify(Array.isArray(args.tags) ? args.tags : []), args.status ?? 'published', nowIso())
        .run()
      return `Gallery created: ${args.title} → /gallery/${slug}`
    }

    case 'list_posts': {
      const { results } = await env.DB.prepare('SELECT id, slug, title, status, published_at FROM posts ORDER BY COALESCE(published_at, created_at) DESC').all()
      return JSON.stringify(results, null, 2)
    }

    case 'create_post': {
      if (!args?.title) throw new Error('title is required')
      const id = uuid()
      const base = slugify(args.slug || args.title)
      let slug = base
      let n = 1
      while (await env.DB.prepare('SELECT id FROM posts WHERE slug = ?').bind(slug).first()) slug = `${base}-${n++}`
      await env.DB.prepare(
        `INSERT INTO posts (id, slug, title, excerpt, body, tags, status, published_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(id, slug, args.title, args.excerpt ?? null, args.body ?? null, JSON.stringify(Array.isArray(args.tags) ? args.tags : []), args.status ?? 'published', nowIso(), nowIso())
        .run()
      return `Post created: ${args.title} → /post/${slug}`
    }

    case 'create_event': {
      if (!args?.title || !args?.start_date) throw new Error('title and start_date are required')
      const id = uuid()
      await env.DB.prepare(
        `INSERT INTO events (id, title, description, start_date, time, location, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`,
      )
        .bind(id, args.title, args.description ?? null, args.start_date, args.time ?? null, args.location ?? null, nowIso())
        .run()
      return `Event created: ${args.title} on ${args.start_date}`
    }

    case 'list_pages': {
      const { results } = await env.DB.prepare('SELECT id, slug, title, status FROM pages ORDER BY created_at ASC').all()
      return JSON.stringify(results, null, 2)
    }

    case 'create_page': {
      if (!args?.title) throw new Error('title is required')
      const id = uuid()
      const base = slugify(args.slug || args.title)
      let slug = base
      let n = 1
      while (await env.DB.prepare('SELECT id FROM pages WHERE slug = ?').bind(slug).first()) slug = `${base}-${n++}`
      await env.DB.prepare('INSERT INTO pages (id, slug, title, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, slug, args.title, args.body ?? null, args.status ?? 'published', nowIso())
        .run()
      return `Page created: ${args.title} → /page/${slug}`
    }

    default:
      throw new Error('Unknown tool: ' + name)
  }
}

export async function handleMcp(c: any): Promise<Response> {
  const env = c.env as Env
  // Accept the key via Authorization header OR ?key= / ?apiKey= query param.
  const token = getBearer(c.req.raw) || c.req.query('key') || c.req.query('apiKey') || ''
  const authed = Boolean(token) && ((env.MCP_API_KEY && token === env.MCP_API_KEY) || (await verifyToken(token, env)))
  if (!authed) return rpcError(null, -32001, 'Unauthorized: send Authorization: Bearer <MCP_API_KEY>')

  if (c.req.method === 'GET') {
    return new Response(
      JSON.stringify({ name: 'lumenfolio', version: '1.0.0', transport: 'streamable-http', tools: toolDefs.map((t) => t.name) }),
      { headers: { 'content-type': 'application/json' } },
    )
  }

  const body = await c.req.json().catch(() => null)
  if (!body || body.jsonrpc !== '2.0') return rpcError(null, -32700, 'Parse error')

  const { id, method, params } = body
  if (method === 'initialize') {
    const protocolVersion = params?.protocolVersion || '2025-06-18'
    return rpc(id, {
      protocolVersion,
      capabilities: { tools: {} },
      serverInfo: { name: 'lumenfolio', version: '1.0.0' },
      instructions:
        'Build and manage a photographer portfolio. Use update_site for text/info, apply_design or design_from_prompt for the look (colors, fonts, layout, theme), and create_gallery/create_post/create_event/create_page for content. Then tell the user what you changed.',
    })
  }
  if (method === 'notifications/initialized' || method === 'initialized') return new Response(null, { status: 202 })
  if (method === 'ping') return rpc(id, {})
  if (method === 'tools/list') return rpc(id, { tools: toolDefs })

  if (method === 'tools/call') {
    try {
      const text = await callTool(env, params?.name, params?.arguments || {})
      return rpc(id, { content: [{ type: 'text', text }], isError: false })
    } catch (e: any) {
      return rpc(id, { content: [{ type: 'text', text: 'Error: ' + String(e?.message || e) }], isError: true })
    }
  }

  return rpcError(id, -32601, 'Method not found: ' + method)
}
