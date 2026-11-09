import type { ReactNode } from 'react'
import { EmbedBlock, detectPlatform } from '../components/EmbedBlock'

function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (m) {
      return (
        <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      )
    }
    return p
  })
}

/**
 * Minimal, XSS-safe renderer. Blank lines split paragraphs, `**bold**`,
 * `*italic*`, `[label](url)`, `# heading` and a bare social URL become an embed.
 */
export function renderBody(body: string | null | undefined): ReactNode {
  if (!body) return null
  const blocks = body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks.map((block, i) => {
    const url = block.trim()
    if (/^https?:\/\/\S+$/.test(url) && detectPlatform(url)) {
      return <EmbedBlock key={i} url={url} />
    }
    if (block.startsWith('## ')) return <h2 key={i}>{block.slice(3)}</h2>
    if (block.startsWith('# ')) return <h2 key={i}>{block.slice(2)}</h2>
    return (
      <p key={i}>
        {block.split('\n').map((line, j) => (
          <span key={j}>
            {j > 0 ? <br /> : null}
            {inline(line)}
          </span>
        ))}
      </p>
    )
  })
}
