// Client-side image preparation: resize + encode to WebP variants so every
// photo is responsive without paying for server-side image processing.

import exifr from 'exifr'

export const VARIANT_WIDTHS = [320, 640, 1024, 1600, 2400]

export const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp']

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

async function toWebP(img: HTMLImageElement, width: number, quality = 0.82): Promise<Blob> {
  const height = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * width))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encode failed'))),
      'image/webp',
      quality,
    )
  })
}

export interface PreparedImage {
  id: string
  width: number
  height: number
  variants: number[]
  blobs: Record<number, Blob>
  exif: Record<string, any> | null
  name: string
}

const EXIF_TAGS = ['Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength', 'FocalLengthIn35mmFormat', 'DateTimeOriginal']

async function readExif(file: File): Promise<Record<string, any> | null> {
  try {
    const raw = await exifr.parse(file, EXIF_TAGS)
    if (!raw) return null
    const out: Record<string, any> = {}
    for (const k of Object.keys(raw)) {
      if (raw[k] != null && raw[k] !== '') out[k] = raw[k]
    }
    return Object.keys(out).length ? out : null
  } catch {
    return null
  }
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const exif = await readExif(file)
  const img = await loadImage(file)
  const naturalWidth = img.naturalWidth
  const naturalHeight = img.naturalHeight

  const widths = VARIANT_WIDTHS.filter((w) => w < naturalWidth)
  widths.push(Math.min(naturalWidth, 2400))
  const unique = [...new Set(widths)].sort((a, b) => a - b)

  const blobs: Record<number, Blob> = {}
  for (const w of unique) {
    blobs[w] = await toWebP(img, w)
  }

  return {
    id: crypto.randomUUID(),
    width: naturalWidth,
    height: naturalHeight,
    variants: unique,
    blobs,
    exif,
    name: file.name,
  }
}

export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatExif(exif?: Record<string, any> | null): string[] {
  if (!exif || typeof exif !== 'object') return []
  const out: string[] = []
  const cam = [exif.Make, exif.Model].filter(Boolean).join(' ')
  if (cam) out.push(cam)
  if (exif.LensModel) out.push(String(exif.LensModel))
  if (exif.FNumber) out.push(`f/${exif.FNumber}`)
  if (exif.ExposureTime) out.push(exif.ExposureTime < 1 ? `1/${Math.round(1 / exif.ExposureTime)}s` : `${exif.ExposureTime}s`)
  if (exif.ISO) out.push(`ISO ${exif.ISO}`)
  if (exif.FocalLength) out.push(`${exif.FocalLength}mm`)
  return out
}

export function formatMonth(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'hr-HR', { month: 'long', year: 'numeric' })
}
