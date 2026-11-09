import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useSite } from '../store'
import { SocialLinks } from './SocialLinks'
import type { PageItem } from '../types'

export function Footer({ pages }: { pages: PageItem[] }) {
  const { site } = useSite()
  const { contact } = site
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">{site.name}</div>
            <p className="muted" style={{ maxWidth: 340, marginTop: 8, fontSize: '0.92rem' }}>
              {site.tagline}
            </p>
            {contact.email || contact.phone || (contact.address && contact.city) ? (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                {contact.email ? (
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <Mail size={14} /> <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </span>
                ) : null}
                {contact.phone ? (
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <Phone size={14} /> <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </span>
                ) : null}
                {contact.city ? (
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <MapPin size={14} /> {contact.address ? `${contact.address}, ` : ''}
                    {contact.city}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {pages.length ? (
            <div>
              <div className="eyebrow">Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pages.map((p) => (
                  <Link key={p.id} to={`/page/${p.slug}`} className="muted" style={{ fontSize: '0.92rem' }}>
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <SocialLinks socials={site.socials} />
        </div>

        <div className="footer-copy">
          <span>
            © {year} {site.name}. Sva prava pridržana.
          </span>
          <Link to="/admin" style={{ color: 'var(--text-faint)' }}>
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
