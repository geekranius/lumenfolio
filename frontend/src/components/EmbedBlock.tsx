import { useEffect, useRef } from 'react'

export function detectPlatform(url: string): string | null {
  const u = (url || '').toLowerCase()
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) return 'facebook'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'x'
  return null
}

const loadedScripts = new Set<string>()

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (loadedScripts.has(src)) return resolve()
    if (document.querySelector(`script[src="${src}"]`)) {
      loadedScripts.add(src)
      return resolve()
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => {
      loadedScripts.add(src)
      resolve()
    }
    s.onerror = () => resolve()
    document.body.appendChild(s)
  })
}

async function mountEmbed(platform: string, el: HTMLDivElement) {
  try {
    if (platform === 'instagram') {
      await loadScript('https://www.instagram.com/embed.js')
      ;(window as any).instgrm?.Embeds?.process?.()
    } else if (platform === 'tiktok') {
      await loadScript('https://www.tiktok.com/embed.js')
    } else if (platform === 'x') {
      await loadScript('https://platform.twitter.com/widgets.js')
    }
    void el
  } catch {
    /* embed is best-effort */
  }
}

export function EmbedBlock({ url, caption }: { url: string; caption?: string }) {
  const platform = detectPlatform(url)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (platform && ref.current) mountEmbed(platform, ref.current)
  }, [platform, url])

  if (!platform) {
    return (
      <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, margin: '12px 0' }}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
          {url}
        </a>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ margin: '20px 0' }}>
      {platform === 'instagram' && (
        <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14" style={{ margin: 0 }}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Pogledaj na Instagramu
          </a>
        </blockquote>
      )}
      {platform === 'tiktok' && (
        <blockquote className="tiktok-embed" cite={url} data-video-id={url.split('/video/')[1]?.split('?')[0] || ''} style={{ margin: 0 }}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Pogledaj na TikToku
          </a>
        </blockquote>
      )}
      {platform === 'x' && (
        <blockquote className="twitter-tweet" style={{ margin: 0 }}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Pogledaj na X-u
          </a>
        </blockquote>
      )}
      {platform === 'facebook' && (
        <iframe
          src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`}
          width="500"
          height="600"
          style={{ border: 'none', overflow: 'hidden', maxWidth: '100%', borderRadius: 12 }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          title="Facebook post"
        />
      )}
      {platform === 'youtube' && (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId(url)}`}
          width="100%"
          height="420"
          style={{ border: 'none', borderRadius: 12 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="YouTube video"
        />
      )}
      {caption ? <div className="muted" style={{ fontSize: '0.82rem', marginTop: 8 }}>{caption}</div> : null}
    </div>
  )
}

function youtubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/)
  return m ? m[1] : ''
}
