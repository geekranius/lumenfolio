import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ImageItem } from '../types'

type ExifRow = { label: string; value: string; wide?: boolean }

function cameraReadout(exif?: Record<string, any> | null, locale = 'hr'): ExifRow[] {
  if (!exif) return []
  const english = locale === 'en'
  const labels = english
    ? { camera: 'CAMERA BODY', lens: 'LENS', aperture: 'APERTURE', shutter: 'SHUTTER', iso: 'SENSITIVITY', focal: 'FOCAL LENGTH', captured: 'CAPTURED' }
    : { camera: 'TIJELO KAMERE', lens: 'OBJEKTIV', aperture: 'BLENDA', shutter: 'EKSPOZICIJA', iso: 'OSJETLJIVOST', focal: 'ŽARIŠNA DULJINA', captured: 'SNIMLJENO' }
  const rows: ExifRow[] = []
  const camera = [exif.Make, exif.Model].filter(Boolean).join(' ')
  if (camera) rows.push({ label: labels.camera, value: camera, wide: true })
  if (exif.LensModel) rows.push({ label: labels.lens, value: String(exif.LensModel), wide: true })
  const aperture = Number(exif.FNumber)
  if (Number.isFinite(aperture) && aperture > 0) rows.push({ label: labels.aperture, value: `f/${aperture}` })
  const exposure = Number(exif.ExposureTime)
  if (Number.isFinite(exposure) && exposure > 0) rows.push({ label: labels.shutter, value: exposure < 1 ? `1/${Math.round(1 / exposure)} s` : `${exposure} s` })
  if (Number(exif.ISO) > 0) rows.push({ label: labels.iso, value: `ISO ${exif.ISO}` })
  if (Number(exif.FocalLength) > 0) rows.push({ label: labels.focal, value: `${exif.FocalLength} mm` })
  if (exif.DateTimeOriginal) {
    const date = new Date(exif.DateTimeOriginal)
    rows.push({ label: labels.captured, value: Number.isNaN(date.getTime()) ? String(exif.DateTimeOriginal) : date.toLocaleString(english ? 'en-GB' : 'hr-HR', { dateStyle: 'medium', timeStyle: 'short' }), wide: true })
  }
  return rows
}

export function Lightbox({
  images,
  index,
  onClose,
  onNav,
  showExif = false,
  locale = 'hr',
}: {
  images: ImageItem[]
  index: number
  onClose: () => void
  onNav: (i: number) => void
  showExif?: boolean
  locale?: string
}) {
  const img = images[index]
  const english = locale === 'en'
  const readout = cameraReadout(img?.exif, locale)

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
    <div className={`lightbox${images.length > 1 ? ' has-thumbs' : ' no-thumbs'}`} onClick={onClose} role="dialog" aria-modal="true" aria-label={english ? 'Photo viewer' : 'Pregled fotografije'}>
      <div className="lb-stage" onClick={(e) => e.stopPropagation()}>
        <div className="lb-stage-readout">{english ? 'PHOTO' : 'FOTOGRAFIJA'}</div>
        <img className="lb-img" src={img.full} alt={img.alt || img.caption || ''} />
        {images.length > 1 && (
          <>
            <button className="lb-btn lb-prev" onClick={() => onNav((index - 1 + images.length) % images.length)} aria-label="Prethodna fotografija">
              <ChevronLeft size={24} />
            </button>
            <button className="lb-btn lb-next" onClick={() => onNav((index + 1) % images.length)} aria-label="Sljedeća fotografija">
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      <aside className="lb-panel" onClick={(e) => e.stopPropagation()}>
        <button className="lb-btn lb-close" onClick={onClose} aria-label="Zatvori pregled"><X size={20} /></button>
        <div className="lb-panel-topline"><span><Camera size={14} /> {english ? 'CAMERA DATA' : 'PODACI KAMERE'}</span><span>EXIF</span></div>
        {img.caption ? <p className="lb-panel-caption">{img.caption}</p> : null}
        {showExif ? (
          readout.length ? (
            <div className="lb-exif-grid">
              {readout.map((item) => (
                <div className={`lb-exif-cell${item.wide ? ' is-wide' : ''}`} key={item.label}>
                  <span>{item.label}</span><strong title={item.value}>{item.value}</strong>
                </div>
              ))}
            </div>
          ) : <p className="lb-exif-empty">{english ? 'No embedded camera data for this frame.' : 'Za ovaj kadar nema ugrađenih EXIF podataka.'}</p>
        ) : null}
        <div className="lb-counter"><span>{english ? 'PHOTO' : 'FOTOGRAFIJA'}</span><strong>{String(index + 1).padStart(3, '0')}</strong><i>/</i><span>{String(images.length).padStart(3, '0')}</span></div>
      </aside>

      {images.length > 1 ? (
        <div className="lb-thumbs" onClick={(e) => e.stopPropagation()} aria-label={english ? 'Photo filmstrip' : 'Filmska traka fotografija'}>
          {images.map((im, i) => (
            <button key={im.id} type="button" className={`lb-thumb${i === index ? ' active' : ''}`} onClick={() => onNav(i)} aria-label={`Otvori fotografiju ${i + 1}`} aria-current={i === index ? 'true' : undefined}>
              <img src={im.placeholder} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )

  // Render into <body> so no transformed ancestor can break `position: fixed`.
  return createPortal(node, document.body)
}
