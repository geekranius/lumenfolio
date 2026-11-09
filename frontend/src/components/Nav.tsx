import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon, Search } from 'lucide-react'
import { useSite } from '../store'
import type { PageItem } from '../types'

export function Nav({ pages }: { pages: PageItem[] }) {
  const { site, t } = useSite()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('lf_theme')
    if (stored === 'light' || stored === 'dark') return stored
    return site.theme === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('lf_theme', theme)
  }, [theme])

  useEffect(() => setOpen(false), [location.pathname])

  const links: Array<{ to: string; label: string }> = [
    { to: '/', label: t('nav.home') },
    { to: '/galleries', label: t('nav.galleries') },
    ...(site.showCalendar ? [{ to: '/events', label: t('nav.events') }] : []),
    ...(site.showPosts ? [{ to: '/posts', label: t('nav.posts') }] : []),
    ...pages.slice(0, 3).map((p) => ({ to: `/page/${p.slug}`, label: p.title })),
  ]

  return (
    <header className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark" />
          <span>{site.name}</span>
        </NavLink>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="nav-link" end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <NavLink to="/search" className="icon-btn" title={t('nav.search')}>
            <Search size={18} />
          </NavLink>
          <button className="icon-btn" onClick={() => setTheme((v) => (v === 'dark' ? 'light' : 'dark'))} title={t('nav.theme')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-btn nav-toggle" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}
