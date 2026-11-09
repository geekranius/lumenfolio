import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import { tr, type Locale } from './i18n'
import type { SiteSettings } from './types'

export const defaultSite: SiteSettings = {
  name: 'Moj Portfolio',
  tagline: 'Fotografija događaja, portreta i trenutaka',
  description: 'Profesionalni fotografski portfolio.',
  logo: '',
  avatar: '',
  locale: 'hr',
  theme: 'dark',
  accent: '#c8a24a',
  about: '',
  contact: { email: '', phone: '', address: '', city: '' },
  socials: [],
  embeds: [],
  seo: { title: '', description: '', image: '', keywords: '' },
  showCalendar: true,
  showPosts: true,
}

interface SiteContextValue {
  site: SiteSettings
  loading: boolean
  reload: () => Promise<void>
  setSite: (s: SiteSettings) => void
  t: (key: string) => string
  locale: Locale
}

const SiteContext = createContext<SiteContextValue>({
  site: defaultSite,
  loading: true,
  reload: async () => {},
  setSite: () => {},
  t: (k) => k,
  locale: 'hr',
})

function resolveTheme(theme: SiteSettings['theme']): 'dark' | 'light' {
  if (theme === 'auto') {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return theme
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSiteState] = useState<SiteSettings>(defaultSite)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const s = await api.get<SiteSettings>('/api/site')
      setSiteState({ ...defaultSite, ...s })
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', resolveTheme(site.theme))
    root.style.setProperty('--accent', site.accent || defaultSite.accent)
    root.setAttribute('lang', site.locale || 'hr')
    if (site.name) document.title = site.seo.title || `${site.name} — ${site.tagline}`
  }, [site])

  const t = useCallback((key: string) => tr(site.locale, key), [site.locale])

  const setSite = useCallback((s: SiteSettings) => setSiteState(s), [])

  return (
    <SiteContext.Provider value={{ site, loading, reload, setSite, t, locale: site.locale }}>{children}</SiteContext.Provider>
  )
}

export function useSite() {
  return useContext(SiteContext)
}
