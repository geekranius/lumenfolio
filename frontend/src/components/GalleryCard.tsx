import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Gallery } from '../types'
import { formatDate } from '../lib/image'

type GalleryCardProps = {
  gallery: Gallery
  locale: string
  index?: number
  variant?: 'feature' | 'compact' | 'standard'
}

export function GalleryCard({ gallery, locale, index = 1, variant = 'standard' }: GalleryCardProps) {
  const imageCount = gallery.image_count || 0
  const countLabel = locale === 'en' ? (imageCount === 1 ? 'frame' : 'frames') : 'fotografija'

  return (
    <Link to={`/gallery/${gallery.slug}`} className={`signal-card signal-card-${variant}`}>
      <div className="signal-card-image">
        {gallery.cover ? (
          <img src={gallery.cover} alt={gallery.title} loading="lazy" />
        ) : (
          <div className="signal-card-placeholder" aria-hidden="true" />
        )}
        <span className="signal-card-frame">GF / {String(index).padStart(2, '0')}</span>
        <span className="signal-card-open" aria-hidden="true"><ArrowUpRight size={18} /></span>
        <span className="signal-card-image-label">LIVE FRAME — {String(index).padStart(3, '0')}</span>
      </div>
      <div className="signal-card-body">
        <div className="signal-card-meta">
          <span>{gallery.event_date ? formatDate(gallery.event_date, locale) : (locale === 'en' ? 'Undated' : 'Bez datuma')}</span>
          <span>{String(imageCount).padStart(3, '0')} {countLabel}</span>
        </div>
        <h3>{gallery.title}</h3>
        <div className="signal-card-footer">
          <span>{gallery.location || (locale === 'en' ? 'Concert archive' : 'Koncertna arhiva')}</span>
          <span className="signal-card-cta">{locale === 'en' ? 'OPEN SET' : 'OTVORI GALERIJU'} <ArrowUpRight size={14} /></span>
        </div>
      </div>
    </Link>
  )
}
