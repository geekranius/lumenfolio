import type { Env } from '../types'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

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
        /* acceptance confirmation */
      }
      return await (ai as any).run(VISION_MODEL, input)
    }
    throw e
  }
}

async function textRun(ai: Ai, system: string, user: string, maxTokens = 350): Promise<string> {
  const res: any = await (ai as any).run(TEXT_MODEL, {
    messages: [{ role: 'user', content: `${system}\n\n${user}` }],
    max_tokens: maxTokens,
  })
  return (res?.response ?? res?.choices?.[0]?.message?.content ?? '').trim()
}

function parseJson(text: string): Record<string, any> | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

/**
 * Caption one photo. `context` (event/band/atmosphere) makes captions contextual.
 */
export async function captionImage(ai: Ai, bytes: Uint8Array, contentType = 'image/webp', context?: string | null): Promise<string | null> {
  try {
    const dataUri = `data:${contentType};base64,${toBase64(bytes)}`
    const prompt = context
      ? `This photo is from this event: ${context}. Describe THIS specific photo in one concise, evocative sentence (who/what is in the frame, the moment, the mood). Do not mention that it is a photo.`
      : 'Describe this photo in one clear, concise sentence. Mention the main subject, setting and mood. Do not say that it is an image.'
    const res: any = await visionRun(ai, { prompt, image: dataUri, max_tokens: 120 })
    const text = res?.response ?? res?.choices?.[0]?.message?.content ?? res?.description
    return typeof text === 'string' && text.trim() ? text.trim() : null
  } catch {
    return null
  }
}

export async function tagImage(_ai: Ai, _bytes: Uint8Array): Promise<string[]> {
  return []
}

const STOPWORDS = new Set(
  'the and with that this from into over under while which their there where these those image photo photograph appears depicts depicting shows showing very more some such have has are was were will would could should about above after before below between during through against because being been also onto just only than then them they his her its our your a an of in on at to for by is it as be or we you he she'.split(/\s+/),
)

function extractTags(texts: string[]): string[] {
  const counts = new Map<string, number>()
  for (const c of texts) {
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

const PLACEHOLDER_TITLES = ['nova galerija', 'untitled', 'new gallery', 'galerija']

function isPlaceholderTitle(title?: string | null): boolean {
  const t = (title || '').trim().toLowerCase()
  return !t || PLACEHOLDER_TITLES.includes(t)
}

/**
 * Generate gallery title + description + tags from image captions AND event context.
 */
export async function galleryMeta(
  ai: Ai,
  userTitle: string,
  captions: string[],
  context?: string | null,
): Promise<{ title: string; description: string; tags: string[] }> {
  const needTitle = isPlaceholderTitle(userTitle)
  const fallbackDescription = captions.slice(0, 2).join(' ').slice(0, 320).trim()
  const fallback = {
    title: userTitle || 'Galerija',
    description: fallbackDescription || (context ? `Fotografije: ${context.slice(0, 200)}` : ''),
    tags: extractTags([...captions, context || '']),
  }

  try {
    const snippet = captions.slice(0, 30).join('\n- ')
    const user = [
      needTitle ? 'Generate a short, evocative title (max 6 words).' : `Keep this title: "${userTitle}".`,
      'Write a description (1-2 sentences) and 3-6 tags.',
      '',
      context ? `Event context: ${context}` : '',
      snippet ? `\nPhoto captions:\n- ${snippet}` : '',
      '',
      'Respond ONLY with JSON: {"title":"...","description":"...","tags":["..."]}',
      'Use the same language as the context/captions.',
    ].join('\n')

    const text = await textRun(ai, 'You are a professional photographer writing gallery metadata.', user, 350)
    const parsed = parseJson(text)
    if (!parsed) return fallback

    const description = String(parsed.description || '').trim()
    const tags = Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean).slice(0, 8).map(String) : []
    const title = needTitle ? String(parsed.title || '').trim() || userTitle : userTitle

    if (!description && tags.length === 0 && !title) return fallback
    return {
      title: title || fallback.title,
      description: description || fallback.description,
      tags: tags.length ? tags : fallback.tags,
    }
  } catch {
    return fallback
  }
}

/**
 * Pure text generation: event context -> title + description + tags (no images).
 * Used by the "AI sastavi tekst" button and the MCP / design tools.
 */
export async function galleryText(
  ai: Ai,
  context: string,
  userTitle?: string | null,
): Promise<{ title: string; description: string; tags: string[] }> {
  const needTitle = isPlaceholderTitle(userTitle)
  const user = [
    needTitle ? 'Generate a short, evocative title (max 6 words).' : `Keep this title: "${userTitle}".`,
    'Write a description (1-2 sentences) capturing the event and its atmosphere, and 3-6 tags.',
    '',
    `Event context provided by the photographer:\n"""${context}"""`,
    '',
    'Respond ONLY with JSON: {"title":"...","description":"...","tags":["..."]}',
    'Write in the same language as the context.',
  ].join('\n')

  try {
    const text = await textRun(ai, 'You are a professional photographer writing gallery metadata.', user, 350)
    const parsed = parseJson(text)
    if (parsed) {
      return {
        title: String(parsed.title || '').trim() || userTitle || 'Galerija',
        description: String(parsed.description || '').trim(),
        tags: Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean).slice(0, 8).map(String) : [],
      }
    }
  } catch {
    /* fall through to deterministic fallback */
  }
  return {
    title: userTitle || 'Galerija',
    description: context.slice(0, 240),
    tags: extractTags([context]),
  }
}

export function pickCover(images: Array<{ id: string; width?: number | null; height?: number | null }>): string | null {
  if (images.length === 0) return null
  const scored = images
    .filter((i) => i.width && i.height)
    .map((i) => {
      const w = i.width as number
      const h = i.height as number
      const landscapeBonus = w / h >= 1 ? 1 : 0.7
      return { id: i.id, score: w * h * landscapeBonus }
    })
    .sort((a, b) => b.score - a.score)
  return scored[0]?.id ?? images[0].id
}
