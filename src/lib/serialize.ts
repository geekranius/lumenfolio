import type { Env, Gallery, ImageRecord } from '../types'
import { jsonArr, parseJson } from './helpers'
import { imagePath, pickWidth } from './r2'

export interface GalleryRow {
  id: string
  slug: string
  title: string
  description: string | null
  cover_image_id: string | null
  event_date: string | null
  event_end_date: string | null
  location: string | null
  tags: string | null
  context?: string | null
  body?: string | null
  show_exif?: number
  sort_order: number
  status: string
  created_at: string
  image_count?: number
}

export function mapGallery(env: Env, row: GalleryRow): Gallery {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    cover_image_id: row.cover_image_id,
    event_date: row.event_date,
    event_end_date: row.event_end_date,
    location: row.location,
    tags: jsonArr(row.tags),
    context: row.context ?? null,
    body: row.body ?? null,
    show_exif: Boolean(row.show_exif),
    sort_order: row.sort_order,
    status: row.status,
    created_at: row.created_at,
    image_count: row.image_count ?? 0,
    cover: row.cover_image_id ? imagePath(env, row.id, row.cover_image_id, 640) : null,
  }
}

export interface ImageRow {
  id: string
  gallery_id: string
  width: number | null
  height: number | null
  alt: string | null
  caption: string | null
  tags: string | null
  variants: string | null
  exif?: string | null
  sort_order: number
  created_at: string
}

export function mapImage(env: Env, row: ImageRow) {
  const variants = jsonArr(row.variants)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
  const widths = variants.length ? variants.sort((a, b) => a - b) : [1600]
  const small = pickWidth(widths, 640)
  const thumb = pickWidth(widths, 320)
  const full = widths[widths.length - 1]
  return {
    id: row.id,
    gallery_id: row.gallery_id,
    width: row.width,
    height: row.height,
    alt: row.alt,
    caption: row.caption,
    tags: jsonArr(row.tags),
    sort_order: row.sort_order,
    exif: parseJson(row.exif, null),
    variants: widths,
    src: imagePath(env, row.gallery_id, row.id, small),
    srcset: widths.map((w) => `${imagePath(env, row.gallery_id, row.id, w)} ${w}w`).join(', '),
    placeholder: imagePath(env, row.gallery_id, row.id, thumb),
    full: imagePath(env, row.gallery_id, row.id, full),
  }
}
