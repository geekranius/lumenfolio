import { useEffect, useRef, useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Lightbox } from '../components/Lightbox'
import { Reveal } from '../components/Reveal'
import type { ImageItem } from '../types'

export function Search() {
  const { t } = useSite()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ImageItem[]>([])
  const [lightbox, setLightbox] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(timer.current)
    if (!q.trim()) {
      setResults([])
      return
    }
    timer.current = window.setTimeout(() => {
      api
        .get<ImageItem[]>(`/api/search?q=${encodeURIComponent(q)}`)
        .then(setResults)
        .catch(() => {})
    }, 250)
    return () => window.clearTimeout(timer.current)
  }, [q])

  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Traži</div>
            <h2>{t('nav.search')}</h2>
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 520, marginBottom: 32 }}>
          <SearchIcon size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
          <input
            className="input"
            style={{ paddingLeft: 44 }}
            placeholder={t('common.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>

        {q.trim() && results.length === 0 ? (
          <p className="muted">Nema rezultata za „{q}”.</p>
        ) : (
          <div className="masonry">
            {results.map((img, i) => (
              <div className="masonry-item" key={img.id}>
                <Reveal delay={(i % 4) * 30}>
                  <div className="photo-tile" onClick={() => setLightbox(i)}>
                    <img src={img.src} srcSet={img.srcset} sizes="(max-width: 640px) 100vw, 33vw" alt={img.alt || img.caption || ''} loading="lazy" />
                    <div className="shade" />
                    <div className="zoom">+</div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && results.length > 0 ? (
        <Lightbox images={results} index={lightbox} onClose={() => setLightbox(null)} onNav={setLightbox} />
      ) : null}
    </section>
  )
}
