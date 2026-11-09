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
}

export const DEFAULT_DESIGN: DesignConfig = {
  preset: 'cinematic',
  mode: 'dark',
  accent: '#c8a24a',
  fontPair: 'cormorant-inter',
  layout: 'masonry',
  hero: 'cinematic',
  radius: 14,
  animations: true,
  grain: true,
  headingCase: 'normal',
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
}

export function normalizeDesign(d?: Partial<DesignConfig> | null): DesignConfig {
  return { ...DEFAULT_DESIGN, ...(d || {}) }
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
