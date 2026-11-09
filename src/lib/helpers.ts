export function uuid(): string {
  return crypto.randomUUID()
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    š: 's', đ: 'dj', ž: 'z', č: 'c', ć: 'c', Š: 'S', Đ: 'Dj', Ž: 'Z', Č: 'C', Ć: 'C',
  }
  const transliterated = input.replace(/[šđžčćŠĐŽČĆ]/g, (c) => map[c] ?? c)
  return transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item'
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function jsonArr(value: string | null | undefined): string[] {
  return parseJson<string[]>(value, [])
}

export function json<T>(data: T, status = 200): Response {
  return Response.json(data, { status })
}

export function err(message: string, status = 400): Response {
  return Response.json({ error: message }, { status })
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
