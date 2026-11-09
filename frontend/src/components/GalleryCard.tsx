import { useNavigate } from 'react-router-dom'
import type { Gallery } from '../types'
import { formatDate } from '../lib/image'

export function GalleryCard({ gallery, locale }: { gallery: Gallery; locale: string }) {
  const navigate = useNavigate()
  return (
    <div className="gallery-card" onClick={() => navigate(`/gallery/${gallery.slug}`)}>
      {gallery.cover ? (
        <img src={gallery.cover} alt={gallery.title} loading="lazy" />
      ) : (
        <div style={{ aspectRatio: '3/4', background: 'var(--surface-2)' }} />
      )}
      <div className="gallery-card-overlay">
        <div className="title">{gallery.title}</div>
        <div className="meta">
          {formatDate(gallery.event_date, locale)}
          {gallery.location ? ` · ${gallery.location}` : ''} · {gallery.image_count}{' '}
          {locale === 'en' ? 'photos' : 'fotografija'}
        </div>
      </div>
    </div>
  )
}
