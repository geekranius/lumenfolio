import type { Env } from '../types'
import { captionImage, tagImage, galleryMeta, pickCover } from './ai'
import { jsonArr, nowIso } from './helpers'
import { imageKey, pickWidth } from './r2'

/**
 * Asynchronously enrich a gallery after images are registered:
 *  - caption + tag every photo that doesn't have a caption yet
 *  - fill missing description / tags / cover image using an LLM
 * This runs in the background (ctx.waitUntil) and never blocks the upload.
 */
export async function processGalleryAI(env: Env, galleryId: string): Promise<void> {
  if ((env.ENABLE_AI ?? 'true') === 'false') return

  try {
    const images = await env.DB.prepare(
      'SELECT id, width, height, caption, tags, variants FROM images WHERE gallery_id = ? ORDER BY sort_order ASC, created_at ASC',
    )
      .bind(galleryId)
      .all<{ id: string; width: number | null; height: number | null; caption: string | null; tags: string | null; variants: string | null }>()

    const captions: string[] = []

    for (const img of images.results) {
      if (img.caption && img.caption.trim()) {
        captions.push(img.caption)
        continue
      }
      const variants = jsonArr(img.variants).map(Number).filter((n) => n > 0)
      const width = pickWidth(variants, 640)
      const key = imageKey(env, galleryId, img.id, width)
      const obj = await env.BUCKET.get(key)
      if (!obj) continue

      const bytes = new Uint8Array(await obj.arrayBuffer())
      const contentType = obj.httpMetadata?.contentType || 'image/webp'
      const caption = await captionImage(env.AI, bytes, contentType)
      const tags = await tagImage(env.AI, bytes)

      await env.DB.prepare('UPDATE images SET caption = ?, alt = ?, tags = ?, ai_caption = 1 WHERE id = ?')
        .bind(caption ?? '', caption ?? '', JSON.stringify(tags), img.id)
        .run()

      if (caption) captions.push(caption)
    }

    const gallery = await env.DB.prepare('SELECT title, description, tags, cover_image_id FROM galleries WHERE id = ?')
      .bind(galleryId)
      .first<{ title: string; description: string | null; tags: string | null; cover_image_id: string | null }>()

    if (gallery && captions.length) {
      const meta = await galleryMeta(env.AI, gallery.title, captions)
      const description = gallery.description || meta?.description || null
      const existingTags = jsonArr(gallery.tags)
      const tags = existingTags.length ? existingTags : meta?.tags ?? []
      const coverId = gallery.cover_image_id || pickCover(images.results)

      if (description || tags.length || coverId) {
        await env.DB.prepare(
          'UPDATE galleries SET description = ?, tags = ?, cover_image_id = ?, ai_generated = 1, updated_at = ? WHERE id = ?',
        )
          .bind(description ?? '', JSON.stringify(tags), coverId, nowIso(), galleryId)
          .run()
      }
    }
  } catch {
    // AI is best-effort; never surface failures to the client.
  }
}
