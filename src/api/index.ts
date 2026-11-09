import { Hono } from 'hono'
import type { Env } from '../types'
import auth from './auth'
import settings from './settings'
import galleries from './galleries'
import images from './images'
import events from './events'
import posts from './posts'
import pages from './pages'
import search from './search'
import rapidraw from './rapidraw'
import files from './files'
import design from './design'
import { requireAdmin } from '../lib/auth'
import { json } from '../lib/helpers'

const api = new Hono<{ Bindings: Env }>()

api.route('/auth', auth)
api.route('/site', settings)
api.route('/galleries', galleries)
api.route('/images', images)
api.route('/events', events)
api.route('/posts', posts)
api.route('/pages', pages)
api.route('/search', search)
api.route('/rapidraw', rapidraw)
api.route('/design', design)
api.route('/admin/files', files) // PUT/DELETE /api/admin/files/*

// MCP connection info for the admin panel (protected).
api.get('/admin/mcp-info', requireAdmin, async (c) => {
  return json({ endpoint: '/mcp', apiKey: c.env.MCP_API_KEY || null, server: 'lumenfolio', version: '1.0.0' })
})

export default api
