import type { Env } from '../types'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// Vision captioning: Meta Llama 3.2 11B Vision (built-in, free tier).
// Requires a one-time license acceptance per account; handled automatically.
const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct'
const TEXT_MODEL = '@cf/meta/llama-3.2-3b-instruct'

async function visionRun(ai: Ai, input: Record<string, unknown>): Promise<any> {
  try {
    return await (ai as any).run(VISION_MODEL, input)
  } catch (e: any) {
    const msg = String(e?.message || e)
    if (/agree|5016/i.test(msg)) {
      try {
        await (ai as any).run(VISION_MODEL, { prompt: 'agree' })
      } catch {
        /* acceptance returns a confirmation "error"; ignore it */
      }
      return await (ai as any).run(VISION_MODEL, input)
    }
    throw e
  }
}

/**
 * Generate a caption for an image using Llama 3.2 Vision.
 * `contentType` must match the actual bytes (WebP for normal uploads, JPEG for
 * rapidraw) so the model can decode the image.
 */
export async function captionImage(ai: Ai, bytes: Uint8Array, contentType = 'image/webp'): Promise<string | null> {
  try {
    const dataUri = `data:${contentType};base64,${toBase64(bytes)}`
    const res: any = await visionRun(ai, {
      prompt:
        'Describe this photo in one clear, concise sentence. Mention the main subject, setting and mood. Do not say that it is an image.',
      image: dataUri,
      max_tokens: 120,
    })
    const text = res?.response ?? res?.choices?.[0]?.message?.content ?? res?.description
    return typeof text === 'string' && text.trim() ? text.trim() : null
  } catch {
    return null
  }
}

/**
 * Per-image tags. Object detection (DETR) is too noisy for photography, so we
 * keep this empty and derive meaningful tags at the gallery level from captions.
 */
export async function tagImage(_ai: Ai, _bytes: Uint8Array): Promise<string[]> {
  return []
}

const STOPWORDS = new Set(
  'the and with that this from into over under while which their there where these those image photo photograph appears depicts depicting shows showing very more some such have has are was were will would could should about above after before below between during through against because being been also onto just only than then them they his her its our your a an of in on at to for by is it as be or we you he she'.split(
    /\s+/,
  ),
)

function extractTags(captions: string[]): string[] {
  const counts = new Map<string, number>()
  for (const c of captions) {
    for (const raw of c.toLowerCase().split(/[^a-zà-ž0-9]+/i)) {
      const w = raw.trim()
      if (w.length < 4 || STOPWORDS.has(w)) continue
      counts.set(w, (counts.get(w) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w)
}

/**
 * Derive gallery metadata (description, tags) from the AI captions using an LLM,
 * with a deterministic fallback so the fields are never left empty.
 */
export async function galleryMeta(
  ai: Ai,
  userTitle: string,
  captions: string[],
): Promise<{ title: string; description: string; tags: string[] }> {
  const fallback = {
    title: userTitle,
    description: captions.slice(0, 2).join(' ').slice(0, 320).trim(),
    tags: extractTags(captions),
  }

  try {
    const snippet = captions.slice(0, 30).join('\n- ')
    const prompt = [
      'You are helping a professional photographer write portfolio metadata.',
      'Based on the image captions below, write a description and tags.',
      '',
      `Working title: ${userTitle || '(none)'}`,
      '',
      'Image captions:',
      `- ${snippet}`,
      '',
      'Respond ONLY with valid JSON, no markdown, in this exact shape:',
      '{"description":"1-2 sentences","tags":["tag1","tag2","tag3"]}',
      'Use the same language as the captions.',
    ].join('\n')

    const res: any = await (ai as any).run(TEXT_MODEL, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 350,
    })

    const text: string = (res?.response ?? res?.choices?.[0]?.message?.content ?? '').trim()
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return fallback

    const parsed = JSON.parse(match[0])
    const description = String(parsed.description || '').trim()
    const tags = Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean).slice(0, 8).map(String) : []

    if (!description && tags.length === 0) return fallback
    return {
      title: userTitle,
      description: description || fallback.description,
      tags: tags.length ? tags : fallback.tags,
    }
  } catch {
    return fallback
  }
}

/**
 * Derive a single "best cover" image id. Prefer large landscape images.
 */
export function pickCover(images: Array<{ id: string; width?: number | null; height?: number | null }>): string | null {
  if (images.length === 0) return null
  const scored = images
    .filter((i) => i.width && i.height)
    .map((i) => {
      const w = i.width as number
      const h = i.height as number
      const ratio = w / h
      const landscapeBonus = ratio >= 1 ? 1 : 0.7
      return { id: i.id, score: w * h * landscapeBonus }
    })
    .sort((a, b) => b.score - a.score)
  return scored[0]?.id ?? images[0].id
}
