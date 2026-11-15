export interface DesignConfig {
  preset: string
  mode: 'dark' | 'light'
  accent: string
  fontPair: string
  layout: 'masonry' | 'grid'
  hero: 'cinematic' | 'full' | 'split' | 'minimal'
  radius: number
  animations: boolean
  grain: boolean
  headingCase: 'normal' | 'uppercase'
  palette?: {
    dark: ColorPalette
    light: ColorPalette
  }
}

export interface ColorPalette {
  background: string
  backgroundSoft: string
  surface: string
  surfaceRaised: string
  text: string
  muted: string
  border: string
}

export const STAGE_PALETTE = {
  dark: { background: '#09090b', backgroundSoft: '#101014', surface: '#151519', surfaceRaised: '#1c1c21', text: '#f2eee9', muted: '#aaa7a8', border: '#302a2c' },
  light: { background: '#f5f2ef', backgroundSoft: '#ebe7e4', surface: '#ffffff', surfaceRaised: '#f3efec', text: '#171416', muted: '#60585a', border: '#d9d0d2' },
}

export const SIGNAL_PALETTE = {
  dark: { background: '#0b0f10', backgroundSoft: '#111819', surface: '#172122', surfaceRaised: '#202c2b', text: '#f0f2e9', muted: '#9aa9a2', border: '#33413d' },
  light: { background: '#eff2eb', backgroundSoft: '#e3e9df', surface: '#f9fbf6', surfaceRaised: '#e8ede5', text: '#131a17', muted: '#53615a', border: '#cbd6ce' },
}

export const DEFAULT_DESIGN: DesignConfig = {
  preset: 'signal',
  mode: 'dark',
  accent: '#c4f36a',
  fontPair: 'sora-space',
  layout: 'masonry',
  hero: 'cinematic',
  radius: 8,
  animations: true,
  grain: true,
  headingCase: 'normal',
  palette: SIGNAL_PALETTE,
}

export const FONT_PAIRS: Record<string, { label: string; display: string; body: string; url: string }> = {
  'cormorant-inter': {
    label: 'Cormorant + Inter',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    url: 'family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap',
  },
  'playfair-source': {
    label: 'Playfair + Source Sans',
    display: "'Playfair Display', Georgia, serif",
    body: "'Source Sans 3', system-ui, sans-serif",
    url: 'family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Source+Sans+3:wght@300;400;500;600;700&display=swap',
  },
  'dmserif-dmsans': {
    label: 'DM Serif + DM Sans',
    display: "'DM Serif Display', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    url: 'family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap',
  },
  'bodoni-jost': {
    label: 'Bodoni + Jost',
    display: "'Bodoni Moda', Georgia, serif",
    body: "'Jost', system-ui, sans-serif",
    url: 'family=Bodoni+Moda:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Jost:wght@300;400;500;600;700&display=swap',
  },
  'sora-space': {
    label: 'Sora + Space Grotesk',
    display: "'Sora', system-ui, sans-serif",
    body: "'Space Grotesk', system-ui, sans-serif",
    url: 'family=Sora:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  },
  'fraunces-inter': {
    label: 'Fraunces + Inter',
    display: "'Fraunces', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    url: 'family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Inter:wght@300;400;500;600;700&display=swap',
  },
  'anton-inter': {
    label: 'Anton + Inter',
    display: "'Anton', Impact, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    url: 'family=Anton&family=Inter:wght@300;400;500;600;700&display=swap',
  },
  archivo: {
    label: 'Archivo (all)',
    display: "'Archivo', system-ui, sans-serif",
    body: "'Archivo', system-ui, sans-serif",
    url: 'family=Archivo:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap',
  },
}

export const PRESETS: Record<string, { label: string; design: DesignConfig }> = {
  signal: {
    label: 'Signal / Afterdark',
    design: { preset: 'signal', mode: 'dark', accent: '#c4f36a', fontPair: 'sora-space', layout: 'masonry', hero: 'cinematic', radius: 8, animations: true, grain: true, headingCase: 'normal', palette: SIGNAL_PALETTE },
  },
  stage: {
    label: 'Stage / Rock',
    design: { preset: 'stage', mode: 'dark', accent: '#d52f40', fontPair: 'anton-inter', layout: 'masonry', hero: 'cinematic', radius: 6, animations: true, grain: true, headingCase: 'uppercase', palette: STAGE_PALETTE },
  },
  cinematic: {
    label: 'Cinematic',
    design: { preset: 'cinematic', mode: 'dark', accent: '#c8a24a', fontPair: 'cormorant-inter', layout: 'masonry', hero: 'cinematic', radius: 14, animations: true, grain: true, headingCase: 'normal' },
  },
  editorial: {
    label: 'Editorial',
    design: { preset: 'editorial', mode: 'light', accent: '#b08968', fontPair: 'playfair-source', layout: 'masonry', hero: 'split', radius: 4, animations: true, grain: false, headingCase: 'normal' },
  },
  minimal: {
    label: 'Minimal',
    design: { preset: 'minimal', mode: 'light', accent: '#111111', fontPair: 'dmserif-dmsans', layout: 'grid', hero: 'minimal', radius: 2, animations: true, grain: false, headingCase: 'normal' },
  },
  noir: {
    label: 'Noir',
    design: { preset: 'noir', mode: 'dark', accent: '#f2f2f2', fontPair: 'anton-inter', layout: 'masonry', hero: 'full', radius: 0, animations: true, grain: true, headingCase: 'uppercase' },
  },
  vibrant: {
    label: 'Vibrant',
    design: { preset: 'vibrant', mode: 'dark', accent: '#ff5d5d', fontPair: 'sora-space', layout: 'grid', hero: 'full', radius: 22, animations: true, grain: false, headingCase: 'normal' },
  },
  lux: {
    label: 'Lux',
    design: { preset: 'lux', mode: 'dark', accent: '#d4b06a', fontPair: 'bodoni-jost', layout: 'masonry', hero: 'cinematic', radius: 6, animations: true, grain: true, headingCase: 'normal' },
  },
  gallery: {
    label: 'Gallery Wall',
    design: { preset: 'gallery', mode: 'light', accent: '#111111', fontPair: 'dmserif-dmsans', layout: 'grid', hero: 'minimal', radius: 2, animations: true, grain: false, headingCase: 'normal' },
  },
  nocturne: {
    label: 'Nocturne',
    design: { preset: 'nocturne', mode: 'dark', accent: '#8b5cf6', fontPair: 'bodoni-jost', layout: 'masonry', hero: 'cinematic', radius: 10, animations: true, grain: true, headingCase: 'normal' },
  },
  wander: {
    label: 'Wander',
    design: { preset: 'wander', mode: 'light', accent: '#c96f4a', fontPair: 'fraunces-inter', layout: 'masonry', hero: 'split', radius: 8, animations: true, grain: false, headingCase: 'normal' },
  },
  mono: {
    label: 'Monochrome',
    design: { preset: 'mono', mode: 'light', accent: '#111111', fontPair: 'archivo', layout: 'grid', hero: 'full', radius: 0, animations: true, grain: false, headingCase: 'uppercase' },
  },
  polaroid: {
    label: 'Polaroid',
    design: { preset: 'polaroid', mode: 'light', accent: '#e272b4', fontPair: 'fraunces-inter', layout: 'grid', hero: 'minimal', radius: 18, animations: true, grain: false, headingCase: 'normal' },
  },
  expose: {
    label: 'Exposé',
    design: { preset: 'expose', mode: 'light', accent: '#111111', fontPair: 'playfair-source', layout: 'grid', hero: 'split', radius: 0, animations: true, grain: false, headingCase: 'uppercase' },
  },
  reverie: {
    label: 'Reverie',
    design: { preset: 'reverie', mode: 'light', accent: '#b8a0d8', fontPair: 'bodoni-jost', layout: 'masonry', hero: 'minimal', radius: 16, animations: true, grain: false, headingCase: 'normal' },
  },
}

export function normalizeDesign(d?: Partial<DesignConfig> | null): DesignConfig {
  const input = d || {}
  return {
    ...DEFAULT_DESIGN,
    ...input,
    fontPair: input.fontPair && FONT_PAIRS[input.fontPair] ? input.fontPair : DEFAULT_DESIGN.fontPair,
    palette: {
      dark: { ...STAGE_PALETTE.dark, ...(input.palette?.dark || {}) },
      light: { ...STAGE_PALETTE.light, ...(input.palette?.light || {}) },
    },
  }
}

let injectedFontUrl = ''

export function applyDesign(input: DesignConfig) {
  if (typeof document === 'undefined') return
  const d = normalizeDesign(input)
  const root = document.documentElement
  const pair = FONT_PAIRS[d.fontPair] || FONT_PAIRS['cormorant-inter']

  const override = localStorage.getItem('lf_theme_override')
  const mode = override === 'dark' || override === 'light' ? override : d.mode

  root.setAttribute('data-theme', mode)
  root.setAttribute('data-layout', d.layout)
  root.setAttribute('data-hero', d.hero)
  root.setAttribute('data-anim', d.animations ? 'on' : 'off')
  root.setAttribute('data-grain', d.grain ? 'on' : 'off')
  root.setAttribute('data-heading', d.headingCase)
  root.style.setProperty('--accent', d.accent)
  root.style.setProperty('--radius', `${d.radius}px`)
  root.style.setProperty('--radius-lg', `${d.radius * 1.5}px`)
  root.style.setProperty('--font-display', pair.display)
  root.style.setProperty('--font-sans', pair.body)
  const palette = d.palette?.[mode] || STAGE_PALETTE[mode]
  root.style.setProperty('--bg', palette.background)
  root.style.setProperty('--bg-soft', palette.backgroundSoft)
  root.style.setProperty('--surface', palette.surface)
  root.style.setProperty('--surface-2', palette.surfaceRaised)
  root.style.setProperty('--text', palette.text)
  root.style.setProperty('--text-dim', palette.muted)
  root.style.setProperty('--border', palette.border)

  if (injectedFontUrl !== pair.url) {
    injectedFontUrl = pair.url
    let link = document.getElementById('lf-fonts') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = 'lf-fonts'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = `https://fonts.googleapis.com/css2?${pair.url}`
  }
}
