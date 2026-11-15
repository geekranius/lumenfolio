import type { Env } from '../types'

const PRESETS = 'signal, stage, cinematic, editorial, minimal, noir, vibrant, lux, gallery, nocturne, wander, mono, polaroid, expose, reverie'
const FONTS = 'cormorant-inter, playfair-source, dmserif-dmsans, bodoni-jost, sora-space, fraunces-inter, anton-inter, archivo'

const SYSTEM = [
  'You are a senior web design director for photographers.',
  'Translate the request into a complete, production-ready visual design system for the entire photography site.',
  'This design applies across the home page, gallery listings, gallery details, posts, events, search, static pages, navigation, and footer.',
  'Preserve every existing page, gallery, photo, event, post, and site setting. Only return safe visual design tokens and options; never invent content or CSS.',
  'Output a single JSON object, no markdown, no code fences, with exactly these keys:',
  `"preset" (one of ${PRESETS})`,
  '"mode" ("dark" or "light")',
  '"accent" (hex like "#c8a24a")',
  `"fontPair" (one of ${FONTS})`,
  '"layout" ("masonry" or "grid")',
  '"hero" ("cinematic", "full", "split" or "minimal")',
  '"radius" (number 0-24)',
  '"animations" (true or false)',
  '"grain" (true or false)',
  '"headingCase" ("normal" or "uppercase")',
  '"palette" (object with "dark" and "light" objects; each object has hex color keys "background", "backgroundSoft", "surface", "surfaceRaised", "text", "muted", and "border")',
].join('\n')

const STAGE_PALETTE = {
  dark: { background: '#09090b', backgroundSoft: '#101014', surface: '#151519', surfaceRaised: '#1c1c21', text: '#f2eee9', muted: '#aaa7a8', border: '#302a2c' },
  light: { background: '#f5f2ef', backgroundSoft: '#ebe7e4', surface: '#ffffff', surfaceRaised: '#f3efec', text: '#171416', muted: '#60585a', border: '#d9d0d2' },
}

const SIGNAL_PALETTE = {
  dark: { background: '#0b0f10', backgroundSoft: '#111819', surface: '#172122', surfaceRaised: '#202c2b', text: '#f0f2e9', muted: '#9aa9a2', border: '#33413d' },
  light: { background: '#eff2eb', backgroundSoft: '#e3e9df', surface: '#f9fbf6', surfaceRaised: '#e8ede5', text: '#131a17', muted: '#53615a', border: '#cbd6ce' },
}

function parseJson(text: string): Record<string, any> | null {
  let t = text.trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const match = t.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

// Deterministic fallback so the builder always returns something useful.
function fallbackDesign(prompt: string): Record<string, any> {
  const p = prompt.toLowerCase()
  const d: Record<string, any> = {
    preset: 'signal', mode: 'dark', accent: '#c4f36a', fontPair: 'sora-space',
    layout: 'masonry', hero: 'cinematic', radius: 8, animations: true, grain: true, headingCase: 'normal', palette: SIGNAL_PALETTE,
  }
  if (/svijetl|light|bright|airy|bijel|white|čist|clean|pastel/.test(p)) d.mode = 'light'
  if (/minimal|čist|simple|clean/.test(p)) {
    d.preset = 'minimal'; d.layout = 'grid'; d.hero = 'minimal'; d.radius = 2; d.grain = false; d.fontPair = 'dmserif-dmsans'; d.accent = '#111111'
  }
  if (/noir|crno|black|monokrom|crno-bijel/.test(p)) {
    d.preset = 'noir'; d.fontPair = 'anton-inter'; d.headingCase = 'uppercase'; d.accent = '#f2f2f2'; d.radius = 0
  }
  if (/vibrant|šaren|colorful|neon|jarke/.test(p)) {
    d.preset = 'vibrant'; d.accent = '#ff5d5d'; d.fontPair = 'sora-space'; d.layout = 'grid'; d.radius = 22
  }
  if (/editorial|elegant|serif|lux|luksuz|klas/.test(p)) {
    d.preset = 'editorial'; d.fontPair = 'playfair-source'; d.grain = false; d.radius = 4
  }
  if (/metal|rock|concert|koncert/.test(p)) {
    d.preset = 'stage'; d.mode = 'dark'; d.accent = '#cf3443'; d.fontPair = 'anton-inter'; d.layout = 'masonry'; d.hero = 'cinematic'; d.radius = 5; d.headingCase = 'normal'; d.palette = STAGE_PALETTE
  } else if (/signal|geek|terenski|afterdark|archive|arhiv/.test(p)) {
    d.preset = 'signal'; d.mode = 'dark'; d.accent = '#c4f36a'; d.fontPair = 'sora-space'; d.layout = 'masonry'; d.hero = 'cinematic'; d.radius = 8; d.headingCase = 'normal'; d.palette = SIGNAL_PALETTE
  }
  if (/mozaik|masonry/.test(p)) d.layout = 'masonry'
  if (/mrež|grid|kvadrat/.test(p)) d.layout = 'grid'
  const colors: Record<string, string> = {
    zlatn: '#c8a24a', gold: '#c8a24a', žut: '#d4b06a', plav: '#4f7cff', blue: '#4f7cff',
    crven: '#cf3443', red: '#cf3443', crimson: '#cf3443', burgundy: '#8d1b27', zelen: '#34d399', green: '#34d399',
    lime: '#c4f36a', chartreuse: '#c4f36a', 'fosforno-zelen': '#c4f36a',
    ljubičast: '#7c5cff', purple: '#7c5cff', roza: '#e272b4', pink: '#e272b4', bež: '#b08968', beige: '#b08968',
  }
  for (const [k, v] of Object.entries(colors)) {
    const word = new RegExp(`(?:^|\\W)${k}(?:$|\\W)`, 'i')
    const excluded = new RegExp(`(?:no|not|avoid|without|bez|ne)\\s+(?:\\w+\\s+){0,2}${k}(?:$|\\W)`, 'i')
    if (word.test(p) && !excluded.test(p)) d.accent = v
  }
  return d
}

function sanitizePalette(value: unknown) {
  const source = value && typeof value === 'object' ? value as Record<string, any> : {}
  const keys = ['background', 'backgroundSoft', 'surface', 'surfaceRaised', 'text', 'muted', 'border'] as const
  const clean = (mode: 'dark' | 'light') => {
    const input = source[mode] && typeof source[mode] === 'object' ? source[mode] : {}
    return Object.fromEntries(keys.map((key) => [key, /^#[0-9a-f]{6}$/i.test(input[key]) ? input[key] : STAGE_PALETTE[mode][key]]))
  }
  return { dark: clean('dark'), light: clean('light') }
}

function sanitize(parsed: Record<string, any>, prompt: string): Record<string, any> {
  const fb = fallbackDesign(prompt)
  const accent = /^#[0-9a-f]{6}$/i.test(parsed.accent) ? parsed.accent : fb.accent
  return {
    preset: PRESETS.includes(parsed.preset) ? parsed.preset : fb.preset,
    mode: parsed.mode === 'light' || parsed.mode === 'dark' ? parsed.mode : fb.mode,
    accent,
    fontPair: FONTS.includes(parsed.fontPair) ? parsed.fontPair : fb.fontPair,
    layout: parsed.layout === 'grid' || parsed.layout === 'masonry' ? parsed.layout : fb.layout,
    hero: ['cinematic', 'full', 'split', 'minimal'].includes(parsed.hero) ? parsed.hero : fb.hero,
    radius: Math.max(0, Math.min(24, Number(parsed.radius) || fb.radius)),
    animations: typeof parsed.animations === 'boolean' ? parsed.animations : fb.animations,
    grain: typeof parsed.grain === 'boolean' ? parsed.grain : fb.grain,
    headingCase: parsed.headingCase === 'uppercase' ? 'uppercase' : fb.headingCase,
    palette: sanitizePalette(parsed.palette || fb.palette),
  }
}

export async function designFromPrompt(ai: Ai, prompt: string): Promise<Record<string, any> | null> {
  try {
    const res: any = await (ai as any).run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: `${SYSTEM}\n\nUser request: ${prompt}` }],
      max_tokens: 700,
    })
    const text: string = (res?.response ?? res?.choices?.[0]?.message?.content ?? '').trim()
    const parsed = parseJson(text)
    if (parsed) return sanitize(parsed, prompt)
    return fallbackDesign(prompt)
  } catch {
    return fallbackDesign(prompt)
  }
}
