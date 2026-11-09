import { useEffect, useState } from 'react'
import { Copy, Check, Bot } from 'lucide-react'
import { api } from '../api'

const TOOLS = [
  'get_site',
  'update_site',
  'apply_design',
  'design_from_prompt',
  'list_galleries',
  'create_gallery',
  'list_posts',
  'create_post',
  'create_event',
  'list_pages',
  'create_page',
]

export function Mcp() {
  const [info, setInfo] = useState<{ endpoint: string; apiKey: string | null } | null>(null)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    api.get<{ endpoint: string; apiKey: string | null }>('/api/admin/mcp-info').then(setInfo).catch(() => {})
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const endpoint = `${origin}/mcp`
  const key = info?.apiKey || ''

  const copy = (label: string, text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  const claude = `{\n  "mcpServers": {\n    "lumenfolio": {\n      "url": "${endpoint}",\n      "headers": { "Authorization": "Bearer ${key}" }\n    }\n  }\n}`
  const cursor = `LumenFolio MCP\nURL: ${endpoint}\nHeader: Authorization: Bearer ${key}`

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">MCP</div>
          <h1>Poveži svoj AI alat</h1>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Bot size={22} color="var(--accent)" />
          <h3 style={{ fontSize: '1.25rem' }}>Model Context Protocol</h3>
        </div>
        <p className="muted" style={{ margin: '0 0 20px', maxWidth: 680 }}>
          Spoji bilo koji MCP klijent (Claude Desktop, Cursor, Windsurf…) na svoj portfolio i zadaj mu prirodnim jezikom:
          <em> „napravi mračan zlatni dizajn"</em>, <em>„napiši About stranicu"</em>, <em>„dodaj objavu"</em> — i on to napravi kroz ove alate.
        </p>

        <div className="field">
          <label>Endpoint</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <code className="code-block" style={{ flex: 1 }}>{endpoint}</code>
            <button className="btn btn-ghost btn-sm" onClick={() => copy('endpoint', endpoint)}>
              {copied === 'endpoint' ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        <div className="field">
          <label>API ključ (Bearer token)</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <code className="code-block" style={{ flex: 1 }}>{key || '(postavi MCP_API_KEY secret na Workeru)'}</code>
            <button className="btn btn-ghost btn-sm" onClick={() => copy('key', key)} disabled={!key}>
              {copied === 'key' ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          {!key ? <div className="hint">Ključ postaviš u Cloudflare dashboardu → Worker → Settings → Variables & Secrets → MCP_API_KEY.</div> : null}
        </div>
      </div>

      <div className="row">
        <div className="panel">
          <h3 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Claude Desktop (claude_desktop_config.json)</h3>
          <div style={{ position: 'relative' }}>
            <code className="code-block">{claude}</code>
            <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => copy('claude', claude)}>
              {copied === 'claude' ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Cursor / ostali klijenti</h3>
          <div style={{ position: 'relative' }}>
            <code className="code-block" style={{ whiteSpace: 'pre-wrap' }}>{cursor}</code>
            <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => copy('cursor', cursor)}>
              {copied === 'cursor' ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Dostupni alati</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TOOLS.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
