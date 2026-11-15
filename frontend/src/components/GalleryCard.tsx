import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Gallery } from '../types'
import { formatDate } from '../lib/image'

type GalleryCardProps = {
  gallery: Gallery
  locale: string
  variant?: 'feature' | 'compact' | 'standard'
}

export function GalleryCard({ gallery, locale, variant = 'standard' }: GalleryCardProps) {
  const imageCount = gallery.image_count || 0
  const countLabel = locale === 'en' ? (imageCount === 1 ? 'photo' : 'photos') : 'fotografija'

  return (
    <Link to={`/gallery/${gallery.slug}`} className={`signal-card signal-card-${variant}`}>
      <div className="signal-card-image">
        {gallery.cover ? (
          <img src={gallery.cover} alt={gallery.title} loading="lazy" />
        ) : (
          <div className="signal-card-placeholder" aria-hidden="true" />
        )}
        <span className="signal-card-open" aria-hidden="true"><ArrowUpRight size={18} /></span>
      </div>
      <div className="signal-card-body">
        <div className="signal-card-meta">
          <span>{gallery.event_date ? formatDate(gallery.event_date, locale) : (locale === 'en' ? 'Undated' : 'Bez datuma')}</span>
          <span>{String(imageCount).padStart(3, '0')} {countLabel}</span>
        </div>
        <h3>{gallery.title}</h3>
        {gallery.tags?.some((tag) => tag.startsWith('#')) ? (
          <div className="signal-card-hashtags" aria-label={locale === 'en' ? 'Gallery topics' : 'Teme galerije'}>
            {gallery.tags.filter((tag) => tag.startsWith('#')).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        ) : null}
        <div className="signal-card-footer">
          <span>{gallery.location || (locale === 'en' ? 'Concert archive' : 'Koncertna arhiva')}</span>
          <span className="signal-card-cta">{locale === 'en' ? 'VIEW GALLERY' : 'POGLEDAJ GALERIJU'} <ArrowUpRight size={14} /></span>
        </div>
      </div>
    </Link>
  )
}
