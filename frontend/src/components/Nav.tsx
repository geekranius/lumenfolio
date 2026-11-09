import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon, Search } from 'lucide-react'
import { useSite } from '../store'
import type { PageItem } from '../types'

export function Nav({ pages }: { pages: PageItem[] }) {
  const { site, t } = useSite()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') !== 'light')

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', on, { passive: true })
    on()
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => setOpen(false), [location.pathname])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('lf_theme_override', next ? 'dark' : 'light')
  }

  const links: Array<{ to: string; label: string }> = [
    { to: '/', label: t('nav.home') },
    { to: '/galleries', label: t('nav.galleries') },
    ...(site.showCalendar ? [{ to: '/events', label: t('nav.events') }] : []),
    ...(site.showPosts ? [{ to: '/posts', label: t('nav.posts') }] : []),
    ...pages.slice(0, 3).map((p) => ({ to: `/page/${p.slug}`, label: p.title })),
  ]

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
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
          <button className="icon-btn" onClick={toggleTheme} title={t('nav.theme')}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-btn nav-toggle" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}
