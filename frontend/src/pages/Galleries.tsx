import { useEffect, useState } from 'react'
import { useSite } from '../store'
import { api } from '../api'
import { GalleryCard } from '../components/GalleryCard'
import { Reveal } from '../components/Reveal'
import { Loading, Empty } from '../components/ui'
import type { Gallery } from '../types'

export function Galleries() {
  const { t, locale } = useSite()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Gallery[]>('/api/galleries')
      .then(setGalleries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Radovi</div>
            <h2>{t('nav.galleries')}</h2>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : galleries.length === 0 ? (
          <Empty label={t('common.empty')} />
        ) : (
          <div className="masonry">
            {galleries.map((g, i) => (
              <div className="masonry-item" key={g.id}>
                <Reveal delay={(i % 4) * 40}>
                  <GalleryCard gallery={g} locale={locale} />
                </Reveal>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
