import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Lightbox } from '../components/Lightbox'
import { Reveal } from '../components/Reveal'
import { Loading } from '../components/ui'
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
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="container">
        <Link to="/galleries" className="btn btn-ghost btn-sm" style={{ marginBottom: 28 }}>
          <ArrowLeft size={15} /> {t('gallery.backToGalleries')}
        </Link>

        <div className="section-head" style={{ marginBottom: 14 }}>
          <div>
            <div className="eyebrow">Galerija</div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}>{gallery.title}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 10 }}>
          {gallery.event_date ? (
            <span className="muted" style={{ display: 'inline-flex', gap: 7, alignItems: 'center', fontSize: '0.92rem' }}>
              <Calendar size={16} /> {formatDate(gallery.event_date, locale)}
            </span>
          ) : null}
          {gallery.location ? (
            <span className="muted" style={{ display: 'inline-flex', gap: 7, alignItems: 'center', fontSize: '0.92rem' }}>
              <MapPin size={16} /> {gallery.location}
            </span>
          ) : null}
          <span className="muted" style={{ fontSize: '0.92rem' }}>
            {gallery.image_count} {t('common.photos')}
          </span>
        </div>

        {gallery.description ? (
          <p className="muted" style={{ maxWidth: 720, fontSize: '1.08rem' }}>
            {gallery.description}
          </p>
        ) : null}

        {gallery.tags?.length ? (
          <div style={{ margin: '16px 0 8px' }}>
            {gallery.tags.map((tg) => (
              <span className="tag" key={tg}>
                {tg}
              </span>
            ))}
          </div>
        ) : null}

        {gallery.body ? (
          <div className="prose" style={{ margin: '28px 0 40px' }}>
            {renderBody(gallery.body)}
          </div>
        ) : null}

        <div style={{ margin: '8px 0 28px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>Podijeli:</span>
          <a className="tag" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
          <a className="tag" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(gallery.title)}`} target="_blank" rel="noopener noreferrer">X</a>
          <a className="tag" href={`https://wa.me/?text=${encodeURIComponent(`${gallery.title} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>

        <div className="masonry">
          {images.map((img, i) => (
            <div className="masonry-item" key={img.id}>
              <Reveal delay={(i % 4) * 30}>
                <div className="photo-tile" onClick={() => setLightbox(i)}>
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
                </div>
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
