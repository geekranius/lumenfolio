import type { Env } from '../types'
import { captionImage, galleryMeta, pickCover } from './ai'
import { jsonArr, nowIso } from './helpers'
import { imageKey, pickWidth } from './r2'

/**
 * Asynchronously enrich a gallery after images are registered:
 *  - caption each photo (using the event context when provided)
 *  - generate title (if placeholder), description, tags, and cover image
 * Runs in the background (ctx.waitUntil) and never blocks the upload.
 */
export async function processGalleryAI(env: Env, galleryId: string): Promise<void> {
  if ((env.ENABLE_AI ?? 'true') === 'false') return

  try {
    const gallery = await env.DB.prepare(
      'SELECT title, description, tags, cover_image_id, context FROM galleries WHERE id = ?',
    )
      .bind(galleryId)
      .first<{ title: string; description: string | null; tags: string | null; cover_image_id: string | null; context: string | null }>()

    if (!gallery) return
    const context = gallery.context || null

    const images = await env.DB.prepare(
      'SELECT id, width, height, caption, variants FROM images WHERE gallery_id = ? ORDER BY sort_order ASC, created_at ASC',
    )
      .bind(galleryId)
      .all<{ id: string; width: number | null; height: number | null; caption: string | null; variants: string | null }>()

    const captions: string[] = []
    const started = Date.now()

    for (const img of images.results) {
      if (img.caption && img.caption.trim()) {
        captions.push(img.caption)
        continue
      }
      if (Date.now() - started > 20000) break

      const variants = jsonArr(img.variants).map(Number).filter((n) => n > 0)
      const width = pickWidth(variants, 640)
      const key = imageKey(env, galleryId, img.id, width)
      const obj = await env.BUCKET.get(key)
      if (!obj) continue

      const bytes = new Uint8Array(await obj.arrayBuffer())
      const contentType = obj.httpMetadata?.contentType || 'image/webp'
      const caption = await captionImage(env.AI, bytes, contentType, context)

      await env.DB.prepare('UPDATE images SET caption = ?, alt = ?, ai_caption = 1 WHERE id = ?')
        .bind(caption ?? '', caption ?? '', img.id)
        .run()

      if (caption) captions.push(caption)
    }

    // Generate/refresh gallery metadata once we have captions or a context.
    if (captions.length || context) {
      const meta = await galleryMeta(env.AI, gallery.title, captions, context)
      const title = meta.title && meta.title !== gallery.title ? meta.title : gallery.title
      const description = gallery.description || meta.description || null
      const existingTags = jsonArr(gallery.tags)
      const tags = existingTags.length ? existingTags : meta.tags ?? []
      const coverId = gallery.cover_image_id || pickCover(images.results)

      if (title !== gallery.title || description || tags.length || coverId) {
        await env.DB.prepare(
          'UPDATE galleries SET title = ?, description = ?, tags = ?, cover_image_id = ?, ai_generated = 1, updated_at = ? WHERE id = ?',
        )
          .bind(title, description ?? '', JSON.stringify(tags), coverId, nowIso(), galleryId)
          .run()
      }
    }
  } catch {
    // AI is best-effort; never surface failures to the client.
  }
}
