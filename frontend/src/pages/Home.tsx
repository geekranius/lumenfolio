import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Reveal } from '../components/Reveal'
import { GalleryCard } from '../components/GalleryCard'
import { EmbedBlock } from '../components/EmbedBlock'
import type { Gallery, Post } from '../types'
import { formatDate } from '../lib/image'

export function Home() {
  const { site, t, locale } = useSite()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    api.get<Gallery[]>('/api/galleries').then(setGalleries).catch(() => {})
    api.get<Post[]>('/api/posts').then(setPosts).catch(() => {})
  }, [])

  const heroImage = galleries[0]?.cover || site.avatar || ''

  return (
    <>
      <section className="hero">
        <div className="hero-bg">
          {heroImage ? <img src={heroImage} alt="" /> : null}
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="eyebrow">Portfolio</div>
            <h1 className="display">{site.name}</h1>
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
          </div>
        </div>
        <div className="hero-scroll">Scroll</div>
      </section>

      {galleries.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Radovi</div>
                <h2>{t('home.featured')}</h2>
              </div>
              <Link to="/galleries" className="btn btn-ghost btn-sm">
                {t('home.seeAll')}
              </Link>
            </div>
            <div className="masonry">
              {galleries.slice(0, 8).map((g, i) => (
                <div className="masonry-item" key={g.id}>
                  <Reveal delay={i * 40}>
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
          <div className="container" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'center', maxWidth: 860 }}>
            {site.avatar ? <img className="avatar-circle" src={site.avatar} alt={site.name} /> : null}
            <Reveal>
              <div className="eyebrow">{t('home.about')}</div>
              <p className="muted" style={{ fontSize: '1.1rem', margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
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
              <Link to="/posts" className="btn btn-ghost btn-sm">
                {t('home.seeAll')}
              </Link>
            </div>
            <div className="post-grid">
              {posts.slice(0, 3).map((p) => (
                <Link to={`/post/${p.slug}`} key={p.id} className="post-card">
                  {p.cover ? <img src={p.cover} alt="" loading="lazy" /> : null}
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
