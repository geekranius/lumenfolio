import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { useSite } from '../store'
import { SocialLinks } from './SocialLinks'
import type { PageItem } from '../types'

export function Footer({ pages }: { pages: PageItem[] }) {
  const { site, locale } = useSite()
  const { contact } = site
  const year = new Date().getFullYear()

  return (
    <footer className="signal-footer">
      <div className="container">
        <div className="signal-footer-topline"><span>GEEKRANIUS / LIVE IMAGE ARCHIVE</span><span>END OF TRANSMISSION <i /></span></div>
        <div className="signal-footer-grid">
          <div className="signal-footer-identity">
            <div className="signal-footer-logo">
              {site.logo ? <img src={site.logo} alt={`${site.name} logo`} /> : <span>GF / 01</span>}
            </div>
            <p>{site.tagline}</p>
            {contact.email || contact.phone || contact.city ? (
              <div className="signal-footer-contact">
                {contact.email ? <a href={`mailto:${contact.email}`}><Mail size={15} /> {contact.email}</a> : null}
                {contact.phone ? <a href={`tel:${contact.phone}`}><Phone size={15} /> {contact.phone}</a> : null}
                {contact.city ? <span><MapPin size={15} /> {contact.address ? `${contact.address}, ` : ''}{contact.city}</span> : null}
              </div>
            ) : null}
          </div>

          <nav className="signal-footer-nav" aria-label={locale === 'en' ? 'Footer' : 'Navigacija podnožja'}>
            <span className="signal-footer-label">{locale === 'en' ? 'EXPLORE' : 'ISTRAŽI'}</span>
            <Link to="/galleries">{locale === 'en' ? 'The archive' : 'Arhiva'} <ArrowUpRight size={14} /></Link>
            {site.showCalendar ? <Link to="/events">{locale === 'en' ? 'Calendar' : 'Kalendar'} <ArrowUpRight size={14} /></Link> : null}
            {site.showPosts ? <Link to="/posts">{locale === 'en' ? 'Stories' : 'Priče'} <ArrowUpRight size={14} /></Link> : null}
            {pages.map((page) => <Link key={page.id} to={`/page/${page.slug}`}>{page.title} <ArrowUpRight size={14} /></Link>)}
          </nav>

          <div className="signal-footer-social">
            <span className="signal-footer-label">{locale === 'en' ? 'ELSEWHERE' : 'DRUGDJE'}</span>
            <SocialLinks socials={site.socials} />
            <span className="signal-footer-caption">{site.name}</span>
          </div>
        </div>

        <div className="signal-footer-bottom">
          <span>© {year} {site.name}. {locale === 'en' ? 'All rights reserved.' : 'Sva prava pridržana.'}</span>
          <span className="signal-footer-coordinates">FIELD LOG / GF—001</span>
          <Link to="/admin">{locale === 'en' ? 'ADMIN' : 'ADMINISTRACIJA'}</Link>
        </div>
      </div>
    </footer>
  )
}
