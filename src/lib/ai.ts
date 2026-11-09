import type { Env } from '../types'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export interface AiResult {
  caption?: string
  tags?: string[]
}

/**
 * Generate a caption for an image using the Moondream vision model.
 * Returns null if AI is unavailable or fails (callers must degrade gracefully).
 */
export async function captionImage(ai: Ai, bytes: Uint8Array): Promise<string | null> {
  try {
    const dataUri = `data:image/jpeg;base64,${toBase64(bytes)}`
    const res: any = await ai.run('@cf/moondream/moondream3.1-9B-A2B', {
      task: 'caption',
      image: dataUri,
      caption_length: 'normal',
      max_tokens: 256,
    })
    const caption = res?.description ?? res?.caption ?? res?.result
    return typeof caption === 'string' && caption.trim() ? caption.trim() : null
  } catch {
    return null
  }
}

/**
 * Detect objects/scene labels in an image. Returns the top labels.
 */
export async function tagImage(ai: Ai, bytes: Uint8Array): Promise<string[]> {
  try {
    const dataUri = `data:image/jpeg;base64,${toBase64(bytes)}`
    const res: any = await ai.run('@cf/facebook/detr-resnet-50', {
      image: dataUri,
    })
    if (!Array.isArray(res)) return []
    return res
      .filter((d: any) => d?.label && (d?.score ?? 0) > 0.5)
      .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 8)
      .map((d: any) => d.label)
  } catch {
    return []
  }
}

/**
 * Use an LLM to derive gallery metadata (title, description, tags) from the
 * user-provided title and the AI captions of the gallery's photos.
 */
export async function galleryMeta(
  ai: Ai,
  userTitle: string,
  captions: string[],
): Promise<{ title: string; description: string; tags: string[] } | null> {
  try {
    const snippet = captions.slice(0, 40).join('\n- ')
    const prompt = [
      'You are helping a professional photographer build a portfolio.',
      'Based on the following image captions, produce concise, professional metadata.',
      '',
      `Working title: ${userTitle || '(none)'}`,
      '',
      'Image captions:',
      `- ${snippet}`,
      '',
      'Respond ONLY with valid JSON of the form:',
      '{"title":"...","description":"...","tags":["...","..."]}',
      'Title max 6 words, description 1-2 sentences, 3-6 tags. Use the language of the captions if possible.',
    ].join('\n')

    const res: any = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    })

    const text: string = (res?.response ?? '').trim()
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    return {
      title: (parsed.title as string)?.trim() || userTitle,
      description: (parsed.description as string)?.trim() || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map(String) : [],
    }
  } catch {
    return null
  }
}

/**
 * Derive a single "best cover" image id from a list of images. Simple heuristic:
 * prefer landscape images with the largest area (good covers).
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
