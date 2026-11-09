import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Reveal } from '../components/Reveal'
import { GalleryCard } from '../components/GalleryCard'
import { EmbedBlock } from '../components/EmbedBlock'
import { Marquee } from '../components/Marquee'
import type { Gallery, Post, EventItem } from '../types'
import { formatDate } from '../lib/image'

export function Home() {
  const { site, t, locale } = useSite()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<EventItem[]>([])

  useEffect(() => {
    api.get<Gallery[]>('/api/galleries').then(setGalleries).catch(() => {})
    api.get<Post[]>('/api/posts').then(setPosts).catch(() => {})
    api.get<EventItem[]>('/api/events').then(setEvents).catch(() => {})
  }, [])

  const heroImage = galleries[0]?.cover || site.avatar || ''
  const totalPhotos = galleries.reduce((s, g) => s + (g.image_count || 0), 0)

  return (
    <>
      <section className="hero">
        <div className="hero-media">
          {heroImage ? <img className="hero-img" src={heroImage} alt="" /> : null}
          <div className="hero-mesh" />
          <div className="hero-shade" />
        </div>
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">Portfolio</span>
            <h1 className="hero-title">{site.name}</h1>
            <p className="hero-tagline">{site.tagline}</p>
            <div className="hero-actions">
              <Link to="/galleries" className="btn btn-primary">
                {t('home.viewWork')} <ArrowRight size={16} />
              </Link>
              {site.contact.email ? (
                <a href={`mailto:${site.contact.email}`} className="btn btn-ghost">
                  {t('home.contact')}
                </a>
              ) : null}
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="n">{galleries.length}</div>
                <div className="l">{t('nav.galleries')}</div>
              </div>
              <div className="hero-stat">
                <div className="n">{totalPhotos}</div>
                <div className="l">{t('common.photos')}</div>
              </div>
              {events.length ? (
                <div className="hero-stat">
                  <div className="n">{events.length}</div>
                  <div className="l">{t('nav.events')}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          Scroll
          <span className="line" />
        </div>
      </section>

      <Marquee items={['Koncerti', 'Portreti', 'Događaji', 'Vjenčanja', 'Reportaže']} />

      {galleries.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Radovi</div>
                <h2>{t('home.featured')}</h2>
              </div>
              <Link to="/galleries" className="link-arrow">
                {t('home.seeAll')} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="masonry">
              {galleries.slice(0, 8).map((g, i) => (
                <div className="masonry-item" key={g.id}>
                  <Reveal delay={(i % 4) * 50}>
                    <GalleryCard gallery={g} locale={locale} />
                  </Reveal>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {site.about ? (
        <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 40, alignItems: 'center', maxWidth: 900 }}>
            {site.avatar ? <img className="avatar-circle" src={site.avatar} alt={site.name} /> : null}
            <Reveal>
              <div className="eyebrow">{t('home.about')}</div>
              <p className="muted" style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                {site.about}
              </p>
            </Reveal>
          </div>
        </section>
      ) : null}

      {site.showPosts && posts.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Blog</div>
                <h2>{t('home.latest')}</h2>
              </div>
              <Link to="/posts" className="link-arrow">
                {t('home.seeAll')} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="post-grid">
              {posts.slice(0, 3).map((p) => (
                <Link to={`/post/${p.slug}`} key={p.id} className="post-card">
                  {p.cover ? (
                    <div className="img-wrap">
                      <img src={p.cover} alt="" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="post-card-body">
                    <div className="date">{formatDate(p.published_at, locale)}</div>
                    <h3>{p.title}</h3>
                    {p.excerpt ? <p>{p.excerpt}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {site.embeds?.length ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Social</div>
                <h2>{t('home.socialWall')}</h2>
              </div>
            </div>
            <div className="masonry" style={{ maxWidth: 620, margin: '0 auto' }}>
              {site.embeds.map((e, i) => (
                <div className="masonry-item" key={i}>
                  <EmbedBlock url={e.url} caption={e.caption} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
