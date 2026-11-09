import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatExif } from '../lib/image'
import type { ImageItem } from '../types'

export function Lightbox({
  images,
  index,
  onClose,
  onNav,
  showExif = false,
}: {
  images: ImageItem[]
  index: number
  onClose: () => void
  onNav: (i: number) => void
  showExif?: boolean
}) {
  const img = images[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav((index + 1) % images.length)
      if (e.key === 'ArrowLeft') onNav((index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [index, images.length, onClose, onNav])

  if (!img) return null

  const node = (
    <div className="lightbox" onClick={onClose}>
      <img className="lb-img" src={img.full} alt={img.alt || img.caption || ''} onClick={(e) => e.stopPropagation()} />

      <button className="lb-btn lb-close" onClick={onClose} aria-label="Zatvori">
        <X size={22} />
      </button>
      {images.length > 1 && (
        <>
          <button
            className="lb-btn lb-prev"
            onClick={(e) => {
              e.stopPropagation()
              onNav((index - 1 + images.length) % images.length)
            }}
            aria-label="Prethodna"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            className="lb-btn lb-next"
            onClick={(e) => {
              e.stopPropagation()
              onNav((index + 1) % images.length)
            }}
            aria-label="Sljedeća"
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}

      <div className="lb-caption">
        {img.caption ? <div className="cap">{img.caption}</div> : null}
        {showExif && img.exif ? <div className="lb-exif">{formatExif(img.exif).join('  ·  ')}</div> : null}
        <div className="count">
          {index + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="lb-thumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((im, i) => (
            <img
              key={im.id}
              className={`lb-thumb ${i === index ? 'active' : ''}`}
              src={im.placeholder}
              alt=""
              loading="lazy"
              onClick={() => onNav(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )

  // Render into <body> so no transformed ancestor can break `position: fixed`.
  return createPortal(node, document.body)
}
