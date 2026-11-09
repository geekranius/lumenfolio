import type { Env, SiteSettings } from '../types'
import { parseJson } from './helpers'

export const DEFAULT_SITE: SiteSettings = {
  name: 'Moj Portfolio',
  tagline: 'Fotografija događaja, portreta i trenutaka',
  description: 'Profesionalni fotografski portfolio.',
  logo: '',
  avatar: '',
  locale: 'hr',
  theme: 'dark',
  accent: '#c8a24a',
  about: 'Dobrodošli! Ovdje možete upisati nešto o sebi i svom radu.',
  contact: { email: '', phone: '', address: '', city: '' },
  socials: [],
  embeds: [],
  seo: { title: '', description: '', image: '', keywords: '' },
  showCalendar: true,
  showPosts: true,
  design: {
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
  },
}

export async function getSite(env: Env): Promise<SiteSettings> {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('site').first<{ value: string }>()
  const stored = row ? parseJson<Partial<SiteSettings>>(row.value, {}) : {}
  return deepMerge(DEFAULT_SITE, stored)
}

export async function saveSite(env: Env, site: SiteSettings): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  )
    .bind('site', JSON.stringify(site))
    .run()
}

function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const out: any = { ...base }
  for (const key of Object.keys(override) as Array<keyof T>) {
    const b = base[key]
    const o = override[key]
    if (o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object' && !Array.isArray(b)) {
      out[key] = deepMerge(b, o)
    } else if (o !== undefined) {
      out[key] = o
    }
  }
  return out
}
