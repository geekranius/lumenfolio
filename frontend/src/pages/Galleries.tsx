import { useEffect, useState } from 'react'
import { useSite } from '../store'
import { api } from '../api'
import { GalleryCard } from '../components/GalleryCard'
import { Reveal } from '../components/Reveal'
import { SignalPageHeader } from '../components/SignalPageHeader'
import { Loading, Empty } from '../components/ui'
import type { Gallery } from '../types'

const pad = (value: number) => String(value).padStart(2, '0')

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

  const totalPhotos = galleries.reduce((sum, gallery) => sum + (gallery.image_count || 0), 0)
  const number = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'hr-HR')

  return (
    <section className="signal-subpage signal-galleries-page section">
      <div className="container">
        <SignalPageHeader
          code="ARCHIVE / 02"
          label={locale === 'en' ? 'Field index' : 'Terenski indeks'}
          title={t('nav.galleries')}
          description={locale === 'en' ? 'Live music, caught between the first note and the last light.' : 'Glazba uživo, uhvaćena između prvog tona i posljednjeg svjetla.'}
          aside={(
            <div className="signal-page-readout">
              <span>{locale === 'en' ? 'COLLECTION SIZE' : 'VELIČINA ARHIVE'}</span>
              <strong>{pad(galleries.length)} <i>/</i> {number.format(totalPhotos)}</strong>
              <small>{locale === 'en' ? 'sets / photographs' : 'galerije / fotografije'}</small>
            </div>
          )}
        />

        {loading ? (
          <Loading />
        ) : galleries.length === 0 ? (
          <Empty label={t('common.empty')} />
        ) : (
          <div className="signal-gallery-grid signal-gallery-grid-page">
            {galleries.map((gallery, i) => (
              <div className={`signal-gallery-cell signal-gallery-cell-${i + 1}`} key={gallery.id}>
                <Reveal delay={(i % 3) * 50}>
                  <GalleryCard gallery={gallery} locale={locale} index={i + 1} variant={i === 0 ? 'feature' : i < 3 ? 'compact' : 'standard'} />
                </Reveal>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
