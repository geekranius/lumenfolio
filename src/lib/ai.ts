import type { Env } from '../types'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct'
const TEXT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

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

async function textRun(ai: Ai, system: string, user: string, maxTokens = 500): Promise<string> {
  const res: any = await (ai as any).run(TEXT_MODEL, {
    messages: [{ role: 'user', content: `${system}\n\n${user}` }],
    max_tokens: maxTokens,
  })
  return (res?.response ?? res?.choices?.[0]?.message?.content ?? '').trim()
}

function parseJson(text: string): Record<string, any> | null {
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const match = t.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

// Robust parser for the plain-text format (handles multi-paragraph bodies with real newlines).
function parseStructured(text: string): { title: string; description: string; tags: string[]; body: string } {
  const norm = text.replace(/\r\n/g, '\n').replace(/\*\*/g, '').trim()
  const bodyIdx = norm.search(/^\s*BODY\s*:/im)
  const head = bodyIdx >= 0 ? norm.slice(0, bodyIdx) : norm
  const body = bodyIdx >= 0 ? norm.slice(bodyIdx).replace(/^\s*BODY\s*:\s*/i, '').trim() : ''
  const grab = (labels: string[]) => {
    for (const label of labels) {
      const m = head.match(new RegExp(`^\\s*(?:#+\\s*)?${label}\\s*[:\\-]\\s*(.+)$`, 'im'))
      if (m) return m[1].trim().replace(/^["']|["']$/g, '')
    }
    return ''
  }
  const title = grab(['TITLE', 'NASLOV'])
  const description = grab(['DESCRIPTION', 'OPIS', 'DESCRIPCIJA'])
  const tagsLine = grab(['TAGS', 'TAGOVI'])
  const tags = tagsLine.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 8)
  return { title, description, tags, body }
}

/** Caption one photo. `context` makes captions contextual. */
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
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w)
}

function trimSentence(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return (dot > 40 ? cut.slice(0, dot + 1) : cut).trim()
}

const PLACEHOLDER_TITLES = ['nova galerija', 'untitled', 'new gallery', 'galerija']
function isPlaceholderTitle(title?: string | null): boolean {
  const t = (title || '').trim().toLowerCase()
  return !t || PLACEHOLDER_TITLES.includes(t)
}

export interface GalleryText {
  title: string
  description: string
  tags: string[]
  body: string
}

const FORMAT_HINT = [
  'Respond in EXACTLY this plain-text format (no JSON, no markdown):',
  'TITLE: <short title, max 6 words>',
  'DESCRIPTION: <1-2 sentences>',
  'TAGS: tag1, tag2, tag3',
  'BODY:',
  '<2-3 short paragraphs about the event (atmosphere, highlights, feeling). You may use blank lines between paragraphs.>',
].join('\n')

/**
 * Generate gallery metadata + story body from image captions and event context.
 */
export async function galleryMeta(
  ai: Ai,
  userTitle: string,
  captions: string[],
  context?: string | null,
): Promise<GalleryText> {
  const needTitle = isPlaceholderTitle(userTitle)
  const fallbackDesc = trimSentence(captions.slice(0, 2).join(' '), 600)
  const fallbackBody = trimSentence([context || '', captions.slice(0, 5).join(' ')].filter(Boolean).join(' '), 1600)
  const fallback: GalleryText = {
    title: userTitle || 'Galerija',
    description: fallbackDesc || (context ? context.slice(0, 200) : ''),
    tags: extractTags([...captions, context || '']),
    body: fallbackBody,
  }

  try {
    const snippet = captions.slice(0, 20).join('\n- ')
    const user = [
      needTitle ? 'Generate a short, evocative title (max 6 words).' : `Keep this title: "${userTitle}".`,
      'Write a description, tags, and a STORY body (2-3 short paragraphs) that tells a visitor about this event.',
      '',
      context ? `Event context: ${context}` : '',
      snippet ? `\nPhoto captions:\n- ${snippet}` : '',
      '',
      FORMAT_HINT,
      'Use the same language as the context/captions.',
    ].join('\n')

    const text = await textRun(ai, 'You are a professional photographer and writer crafting portfolio text.', user, 800)
    const s = parseStructured(text)
    if (!s.description && !s.body && s.tags.length === 0) return fallback
    return {
      title: (needTitle ? s.title : userTitle) || fallback.title,
      description: s.description || fallback.description,
      tags: s.tags.length ? s.tags : fallback.tags,
      body: s.body || fallback.body,
    }
  } catch {
    return fallback
  }
}

/**
 * Pure text generation: event context -> title + description + tags + story body.
 */
export async function galleryText(ai: Ai, context: string, userTitle?: string | null): Promise<GalleryText> {
  const needTitle = isPlaceholderTitle(userTitle)
  const user = [
    needTitle ? 'Generate a short, evocative title (max 6 words).' : `Keep this title: "${userTitle}".`,
    'Write a description, tags, and a STORY body (2-3 short paragraphs) about this event: atmosphere, highlights, feeling. Warm, professional tone.',
    '',
    `Event context from the photographer:\n"""${context}"""`,
    '',
    FORMAT_HINT,
    'Write in the same language as the context.',
  ].join('\n')

  try {
    const text = await textRun(ai, 'You are a professional photographer and writer crafting portfolio text.', user, 800)
    const s = parseStructured(text)
    if (s.title || s.description || s.body) {
      return {
        title: (needTitle ? s.title : userTitle) || userTitle || 'Galerija',
        description: s.description,
        tags: s.tags,
        body: s.body,
      }
    }
  } catch {
    /* fall through */
  }
  return {
    title: userTitle || 'Galerija',
    description: trimSentence(context, 300),
    tags: extractTags([context]),
    body: trimSentence(context, 1600),
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
