// Client-side image preparation: resize + encode to WebP variants so every
// photo is responsive without paying for server-side image processing.

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
  name: string
}

export async function prepareImage(file: File): Promise<PreparedImage> {
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
    name: file.name,
  }
}

export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatMonth(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'hr-HR', { month: 'long', year: 'numeric' })
}
