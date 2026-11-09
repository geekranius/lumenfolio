import type { Env } from '../types'

const PRESETS = 'cinematic, editorial, minimal, noir, vibrant, lux'
const FONTS = 'cormorant-inter, playfair-source, dmserif-dmsans, bodoni-jost, sora-space, fraunces-inter, anton-inter, archivo'

const SYSTEM = [
  'You are a senior web design director for photographers.',
  'Translate the user request into a portfolio design config.',
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
].join('\n')

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
    preset: 'cinematic', mode: 'dark', accent: '#c8a24a', fontPair: 'cormorant-inter',
    layout: 'masonry', hero: 'cinematic', radius: 14, animations: true, grain: true, headingCase: 'normal',
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
  if (/mozaik|masonry/.test(p)) d.layout = 'masonry'
  if (/mrež|grid|kvadrat/.test(p)) d.layout = 'grid'
  const colors: Record<string, string> = {
    zlatn: '#c8a24a', gold: '#c8a24a', žut: '#d4b06a', plav: '#4f7cff', blue: '#4f7cff',
    crven: '#ff5d5d', red: '#ff5d5d', zelen: '#34d399', green: '#34d399',
    ljubičast: '#7c5cff', purple: '#7c5cff', roza: '#e272b4', pink: '#e272b4', bež: '#b08968', beige: '#b08968',
  }
  for (const [k, v] of Object.entries(colors)) if (p.includes(k)) d.accent = v
  return d
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
  }
}

export async function designFromPrompt(ai: Ai, prompt: string): Promise<Record<string, any> | null> {
  try {
    const res: any = await (ai as any).run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [{ role: 'user', content: `${SYSTEM}\n\nUser request: ${prompt}` }],
      max_tokens: 300,
    })
    const text: string = (res?.response ?? res?.choices?.[0]?.message?.content ?? '').trim()
    const parsed = parseJson(text)
    if (parsed) return sanitize(parsed, prompt)
    return fallbackDesign(prompt)
  } catch {
    return fallbackDesign(prompt)
  }
}
