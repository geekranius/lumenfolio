import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Camera } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Lightbox } from '../components/Lightbox'
import { Reveal } from '../components/Reveal'
import { Loading } from '../components/ui'
import { SignalPageHeader } from '../components/SignalPageHeader'
import { renderBody } from '../lib/render'
import type { Gallery, ImageItem } from '../types'
import { formatDate } from '../lib/image'

export function GalleryDetail() {
  const { slug } = useParams()
  const { t, locale } = useSite()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    setLoading(true)
    setLightbox(null)
    api
      .get<{ gallery: Gallery; images: ImageItem[] }>(`/api/galleries/${slug}`)
      .then((d) => {
        setGallery(d.gallery)
        setImages(Array.isArray(d.images) ? d.images : [])
      })
      .catch(() => setGallery(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <Loading />
  if (!gallery) {
    return (
      <div className="container section">
        <div className="empty">Galerija nije pronađena.</div>
      </div>
    )
  }

  return (
    <section className="signal-subpage signal-gallery-detail section">
      <div className="container">
        <div className="signal-detail-top">
          <Link to="/galleries" className="signal-back-link"><ArrowLeft size={15} /> {t('gallery.backToGalleries')}</Link>
          <span>GEEKRANIUS / ARCHIVE FILE</span>
        </div>

        <SignalPageHeader
          code="GALLERY / LIVE FILE"
          label={gallery.event_date ? formatDate(gallery.event_date, locale) : (locale === 'en' ? 'Undated session' : 'Nedatirana sesija')}
          title={gallery.title}
          description={gallery.description || undefined}
          aside={(
            <div className="signal-detail-readouts">
              {gallery.location ? <div><span>{locale === 'en' ? 'VENUE' : 'LOKACIJA'}</span><strong><MapPin size={14} /> {gallery.location}</strong></div> : null}
              <div><span>{locale === 'en' ? 'FRAME COUNT' : 'BROJ FOTOGRAFIJA'}</span><strong><Camera size={14} /> {gallery.image_count} {t('common.photos')}</strong></div>
            </div>
          )}
        />

        {gallery.tags?.some((tag) => tag.startsWith('#')) ? (
          <div className="signal-detail-tags" aria-label={locale === 'en' ? 'Gallery hashtags' : 'Hashtagovi galerije'}>
            <span className="signal-hashtag-label">{locale === 'en' ? 'DISCOVERY TAGS' : 'HASHTAGOVI'}</span>
            {gallery.tags.filter((tag) => tag.startsWith('#')).map((tag) => <span className="signal-hashtag" key={tag}>{tag}</span>)}
          </div>
        ) : null}
        {gallery.body ? <div className="prose signal-gallery-story">{renderBody(gallery.body)}</div> : null}

        <div className="signal-share-row">
          <span>{locale === 'en' ? 'SHARE THIS FILE' : 'PODIJELI OVAJ ZAPIS'}</span>
          <a className="tag" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
          <a className="tag" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(gallery.title)}`} target="_blank" rel="noopener noreferrer">X</a>
          <a className="tag" href={`https://wa.me/?text=${encodeURIComponent(`${gallery.title} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <span className="signal-share-count">{images.length} / {locale === 'en' ? 'FRAMES' : 'FOTOGRAFIJA'}</span>
        </div>

        <div className="signal-photo-grid">
          {images.map((img, i) => (
            <div className="signal-photo-cell" key={img.id}>
              <Reveal delay={(i % 4) * 30}>
                <button className="photo-tile signal-photo-tile" type="button" onClick={() => setLightbox(i)} aria-label={`${locale === 'en' ? 'Open photo' : 'Otvori fotografiju'} ${i + 1}`}>
                  <img
                    src={img.src}
                    srcSet={img.srcset}
                    sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
                    width={img.width || undefined}
                    height={img.height || undefined}
                    alt={img.alt || img.caption || ''}
                    loading={i < 8 ? 'eager' : 'lazy'}
                  />
                  <div className="shade" />
                  <div className="zoom">+</div>
                  <span className="signal-photo-number">{String(i + 1).padStart(3, '0')}</span>
                </button>
              </Reveal>
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && images.length > 0 ? (
        <Lightbox images={images} index={lightbox} showExif={gallery.show_exif} onClose={() => setLightbox(null)} onNav={setLightbox} />
      ) : null}
    </section>
  )
}
