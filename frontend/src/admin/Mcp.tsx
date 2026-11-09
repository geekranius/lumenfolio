import { useEffect, useState } from 'react'
import { Copy, Check, Bot } from 'lucide-react'
import { api } from '../api'

const TOOLS = [
  'get_site', 'update_site', 'apply_design', 'design_from_prompt',
  'list_galleries', 'create_gallery', 'list_posts', 'create_post',
  'create_event', 'list_pages', 'create_page',
]

function Block({ title, file, lang, code, copy }: { title: string; file: string; lang: string; code: string; copy: (k: string, v: string) => void }) {
  const [ok, setOk] = useState(false)
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: '1.12rem', marginBottom: 4 }}>{title}</h3>
      <div className="hint" style={{ marginBottom: 10 }}>Datoteka: <code>{file}</code></div>
      <div style={{ position: 'relative' }}>
        <pre className="code-block">{code}</pre>
        <button
          className="btn btn-ghost btn-sm"
          style={{ position: 'absolute', top: 8, right: 8 }}
          onClick={() => { copy(lang, code); setOk(true); setTimeout(() => setOk(false), 1500) }}
        >
          {ok ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  )
}

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

  const opencode = `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "lumenfolio": {
        "type": "remote",
        "url": "${endpoint}",
        "oauth": false,
        "headers": { "Authorization": "Bearer ${key}" }
      }
    }
  }
}`

  const chatgpt = `# ~/.codex/config.toml  (ChatGPT desktop, Codex CLI i IDE ekstenzija)
[mcp_servers.lumenfolio]
url = "${endpoint}"

[mcp_servers.lumenfolio.http_headers]
"Authorization" = "Bearer ${key}"`

  const claude = `{
  "mcpServers": {
    "lumenfolio": {
      "url": "${endpoint}",
      "headers": { "Authorization": "Bearer ${key}" }
    }
  }
}`

  const cursor = `{
  "mcpServers": {
    "lumenfolio": {
      "type": "http",
      "url": "${endpoint}",
      "headers": { "Authorization": "Bearer ${key}" }
    }
  }
}`

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">MCP</div>
          <h1>Poveži svoj AI alat</h1>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Bot size={22} color="var(--accent)" />
          <h3 style={{ fontSize: '1.25rem' }}>Model Context Protocol</h3>
        </div>
        <p className="muted" style={{ margin: '0 0 18px', maxWidth: 720 }}>
          Spojeći <strong>ChatGPT (desktop), OpenCode, Claude, Cursor</strong> ili bilo koji MCP klijent, pa mu prirodnim
          jezikom zadaš npr. <em>„napravi mračan zlatni dizajn"</em>, <em>„napiši About stranicu"</em> ili{' '}
          <em>„dodaj galeriju za koncert 1.12."</em>.
        </p>

        <div className="row">
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
              <code className="code-block" style={{ flex: 1 }}>{key || '(postavi MCP_API_KEY secret)'}</code>
              <button className="btn btn-ghost btn-sm" onClick={() => copy('key', key)} disabled={!key}>
                {copied === 'key' ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Block title="🟣 OpenCode" file="opencode.json (u projektu) ili ~/.config/opencode/opencode.json" lang="opencode" code={opencode} copy={copy} />
      <Block title="⚫ ChatGPT desktop / Codex" file="~/.codex/config.toml" lang="chatgpt" code={chatgpt} copy={copy} />
      <Block title="🟠 Claude Desktop" file="claude_desktop_config.json" lang="claude" code={claude} copy={copy} />
      <Block title="🔵 Cursor" file=".cursor/mcp.json" lang="cursor" code={cursor} copy={copy} />

      <div className="panel" style={{ marginTop: 4 }}>
        <h3 style={{ fontSize: '1.12rem', marginBottom: 10 }}>ChatGPT desktop — putem sučelja</h3>
        <ol className="muted" style={{ paddingLeft: 20, lineHeight: 1.9, margin: 0, fontSize: '0.92rem' }}>
          <li>ChatGPT desktop → <strong>Settings → MCP servers → Add server</strong></li>
          <li>Tip: <strong>Streamable HTTP</strong>, ime npr. <code>lumenfolio</code></li>
          <li>URL: <code>{endpoint}</code></li>
          <li>Dodaj header: <code>Authorization: Bearer {key}</code></li>
          <li>Spremi → <strong>Restart</strong>. U chatu upiši <code>/mcp</code> da vidiš server.</li>
        </ol>
        <p className="hint" style={{ marginTop: 10 }}>
          Napomena: ChatGPT <em>web</em> (browser) traži OAuth i ne prihvaća statički ključ — zato koristi <strong>desktop app</strong>{' '}
          ili <strong>Codex CLI</strong>. OpenCode, Claude Desktop i Cursor rade izravno s ključem.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '1.12rem', marginBottom: 12 }}>Dostupni alati</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TOOLS.map((t) => (
            <span className="tag" key={t}>{t}</span>
          ))}
        </div>
      </div>
    </>
  )
}
