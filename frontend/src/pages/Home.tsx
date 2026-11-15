import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Reveal } from '../components/Reveal'
import { GalleryCard } from '../components/GalleryCard'
import { EmbedBlock } from '../components/EmbedBlock'
import { Marquee } from '../components/Marquee'
import type { Gallery, Post, EventItem } from '../types'
import { formatDate } from '../lib/image'

const pad = (value: number) => String(value).padStart(2, '0')

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

  const latestGallery = galleries[0]
  const heroImage = latestGallery?.cover || site.avatar || ''
  const heroExif = latestGallery?.show_exif ? latestGallery?.cover_exif : null
  const cameraName = [heroExif?.Make, heroExif?.Model].filter(Boolean).join(' ')
  const shutter = Number(heroExif?.ExposureTime)
  const aperture = Number(heroExif?.FNumber)
  const shutterLabel = shutter > 0 ? (shutter < 1 ? `1/${Math.round(1 / shutter)}` : `${shutter}s`) : '—'
  const gearReadouts = [
    { label: locale === 'en' ? 'CAMERA' : 'KAMERA', value: cameraName || '—' },
    { label: locale === 'en' ? 'APERTURE' : 'BLENDA', value: aperture > 0 ? `f/${aperture}` : '—' },
    { label: 'ISO', value: heroExif?.ISO ? String(heroExif.ISO) : '—' },
    { label: locale === 'en' ? 'SHUTTER' : 'OKIDAČ', value: shutterLabel },
    { label: locale === 'en' ? 'FOCAL' : 'ŽARIŠNA', value: heroExif?.FocalLength ? `${heroExif.FocalLength} mm` : '—' },
  ]
  const visibleReadouts = heroExif ? gearReadouts.filter((item) => item.value !== '—') : []
  const description = site.description?.trim() || ''
  const about = site.about?.trim() || ''
  const showDescription = description && !/^(profesionalni fotografski portfolio\.?|professional photography portfolio\.?)$/i.test(description)
  const showAbout = about && !/^dobrodošli! ovdje možete upisati nešto o sebi i svom radu\.?$/i.test(about)
  const totalPhotos = galleries.reduce((sum, gallery) => sum + (gallery.image_count || 0), 0)
  const longestSet = galleries.reduce<Gallery | undefined>(
    (longest, gallery) => (!longest || (gallery.image_count || 0) > (longest.image_count || 0) ? gallery : longest),
    undefined,
  )
  const stories = galleries.filter((gallery) => gallery.body && gallery.body.trim())
  const number = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'hr-HR')

  return (
    <div className="signal-home">
      <section className="signal-hero">
        <div className="signal-hero-grid container">
          <div className="signal-hero-copy">
            <div className="signal-kicker">
              <span className="signal-kicker-line" />
              <span>{locale === 'en' ? 'ROCK · METAL · LIVE MUSIC' : 'ROCK · METAL · GLAZBA UŽIVO'}</span>
            </div>

            <h1 className="signal-title">
              {locale === 'en' ? (
                <>Loud.<br /><em>In focus.</em></>
              ) : (
                <>Glasno.<br /><em>U fokusu.</em></>
              )}
            </h1>
            <p className="signal-tagline">{locale === 'en' ? 'Concert photography from the front row.' : 'Koncertna fotografija iz prvih redova.'}</p>
            {showDescription ? <p className="signal-description">{description}</p> : null}

            <div className="signal-hero-actions">
              <Link to="/galleries" className="btn btn-primary signal-button">
                {t('home.viewWork')} <ArrowDownRight size={17} />
              </Link>
              {site.contact.email ? (
                <a href={`mailto:${site.contact.email}`} className="signal-contact-link">
                  {t('home.contact')} <ArrowUpRight size={15} />
                </a>
              ) : null}
            </div>
          </div>

          <div className="signal-hero-side">
            <figure className="signal-feature-frame">
              <div className="signal-feature-image">
                {heroImage ? <img src={heroImage} alt={latestGallery?.title || site.name} /> : <div className="signal-image-placeholder" />}
              </div>
              <figcaption className="signal-feature-caption">
                <div className="signal-caption-copy">
                  <span>{locale === 'en' ? 'LATEST GALLERY' : 'NAJNOVIJA GALERIJA'}</span>
                  <strong>{latestGallery?.title || (locale === 'en' ? 'The live archive' : 'Arhiva uživo')}</strong>
                  <small>
                    {latestGallery?.event_date ? formatDate(latestGallery.event_date, locale) : ''}
                    {latestGallery?.image_count ? ` · ${number.format(latestGallery.image_count)} ${locale === 'en' ? 'photos' : 'fotografija'}` : ''}
                  </small>
                </div>
                {latestGallery ? (
                  <Link to={`/gallery/${latestGallery.slug}`} className="signal-feature-open" aria-label={latestGallery.title}>
                    <ArrowUpRight size={18} />
                  </Link>
                ) : null}
              </figcaption>
            </figure>
            {visibleReadouts.length > 0 ? <div className="signal-gear-readout" aria-label={locale === 'en' ? 'Camera settings' : 'Postavke kamere'}>
              <div className="signal-gear-heading">{locale === 'en' ? 'CAMERA SETTINGS' : 'POSTAVKE SNIMANJA'}</div>
              <div className="signal-gear-values">
                {visibleReadouts.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
              </div>
            </div> : null}
          </div>
        </div>
      </section>

      {site.marqueeItems.length ? <Marquee items={site.marqueeItems} /> : null}

      <section className="signal-intel section-tight" aria-label={locale === 'en' ? 'Archive facts' : 'Zanimljivosti iz arhive'}>
        <div className="container">
          <div className="signal-intel-heading">
            <div>
              <span className="signal-section-code">{locale === 'en' ? 'THE ARCHIVE' : 'FOTO ARHIVA'}</span>
              <h2>{locale === 'en' ? 'By the numbers' : 'U brojkama'}</h2>
            </div>
            <p>{locale === 'en' ? 'A look at the photographs and galleries.' : 'Pregled fotografija i galerija.'}</p>
          </div>
          <div className="signal-facts-grid">
            <article className="signal-fact">
              <span className="signal-fact-index">{locale === 'en' ? 'GALLERIES' : 'GALERIJE'}</span>
              <strong className="signal-fact-value">{pad(galleries.length)}</strong>
              <span className="signal-fact-label">{locale === 'en' ? 'live sets in the archive' : 'koncerta u arhivi'}</span>
            </article>
            <article className="signal-fact">
              <span className="signal-fact-index">{locale === 'en' ? 'PHOTOGRAPHS' : 'FOTOGRAFIJE'}</span>
              <strong className="signal-fact-value">{number.format(totalPhotos)}</strong>
              <span className="signal-fact-label">{locale === 'en' ? 'photographs indexed' : 'fotografija u kolekciji'}</span>
            </article>
            <article className="signal-fact signal-fact-featured">
              <span className="signal-fact-index">{locale === 'en' ? 'LARGEST GALLERY' : 'NAJVEĆA GALERIJA'}</span>
              <strong className="signal-fact-value">{number.format(longestSet?.image_count || 0)}</strong>
              <span className="signal-fact-label">{longestSet?.title || (locale === 'en' ? 'Frames in one set' : 'fotografija u jednoj galeriji')}</span>
            </article>
            {events.length > 0 ? (
              <article className="signal-fact">
                <span className="signal-fact-index">{locale === 'en' ? 'UPCOMING EVENTS' : 'NADOLAZEĆI DOGAĐAJI'}</span>
                <strong className="signal-fact-value">{pad(events.length)}</strong>
                <span className="signal-fact-label">{locale === 'en' ? 'dates on the calendar' : 'datuma u kalendaru'}</span>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      {galleries.length > 0 ? (
        <section className="signal-archive section" id="archive">
          <div className="container">
            <div className="signal-section-head">
              <div>
                <span className="signal-section-code">{locale === 'en' ? 'SELECTED GALLERIES' : 'ODABRANE GALERIJE'}</span>
                <h2>{t('home.featured')}</h2>
                <p>{locale === 'en' ? 'Close to the stage. Inside the moment.' : 'Blizu pozornice. Unutar trenutka.'}</p>
              </div>
              <Link to="/galleries" className="signal-all-link">
                {t('home.seeAll')} <ArrowRight size={17} />
              </Link>
            </div>

            <div className="signal-gallery-grid">
              {galleries.slice(0, 8).map((gallery, i) => (
                <div className={`signal-gallery-cell signal-gallery-cell-${i + 1}`} key={gallery.id}>
                  <Reveal delay={(i % 3) * 60}>
                    <GalleryCard gallery={gallery} locale={locale} variant={i === 0 ? 'feature' : i < 3 ? 'compact' : 'standard'} />
                  </Reveal>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showAbout ? (
        <section className="signal-about section">
          <div className="container signal-about-inner">
            <div className="signal-about-copy">
              <span className="signal-section-code">{locale === 'en' ? 'ABOUT' : 'O MENI'}</span>
              <h2>{t('home.about')}</h2>
              <p>{about}</p>
              {site.contact.email ? <a href={`mailto:${site.contact.email}`} className="signal-all-link">{t('home.contact')} <ArrowRight size={16} /></a> : null}
            </div>
            <div className="signal-about-side">
              <span>{site.name}</span>
              <span>{site.tagline}</span>
              <span className="signal-about-rule" />
            </div>
          </div>
        </section>
      ) : null}

      {site.showPosts && (stories.length > 0 || posts.length > 0) ? (
        <section className="signal-stories section">
          <div className="container">
            <div className="signal-section-head">
              <div>
                <span className="signal-section-code">{locale === 'en' ? 'STORIES' : 'PRIČE'}</span>
                <h2>{t('home.latest')}</h2>
              </div>
              <Link to="/posts" className="signal-all-link">{t('home.seeAll')} <ArrowRight size={17} /></Link>
            </div>
            <div className="signal-story-grid">
              {stories.length > 0
                ? stories.slice(0, 3).map((story) => (
                    <Link to={`/gallery/${story.slug}`} key={story.id} className="signal-story">
                      {story.cover ? <img src={story.cover} alt="" loading="lazy" /> : null}
                      <span className="signal-story-date">{formatDate(story.event_date, locale)}</span>
                      <strong>{story.title}</strong>
                      {story.description ? <span className="signal-story-description">{story.description}</span> : null}
                      <span className="signal-story-link">{locale === 'en' ? 'READ MORE' : 'PROČITAJ VIŠE'} <ArrowUpRight size={15} /></span>
                    </Link>
                  ))
                : posts.slice(0, 3).map((post) => (
                    <Link to={`/post/${post.slug}`} key={post.id} className="signal-story">
                      {post.cover ? <img src={post.cover} alt="" loading="lazy" /> : null}
                      <span className="signal-story-date">{formatDate(post.published_at, locale)}</span>
                      <strong>{post.title}</strong>
                      {post.excerpt ? <span className="signal-story-description">{post.excerpt}</span> : null}
                      <span className="signal-story-link">{locale === 'en' ? 'READ MORE' : 'PROČITAJ VIŠE'} <ArrowUpRight size={15} /></span>
                    </Link>
                  ))}
            </div>
          </div>
        </section>
      ) : null}

      {site.embeds?.length ? (
        <section className="section signal-social-wall">
          <div className="container">
            <div className="signal-section-head">
              <div><span className="signal-section-code">{locale === 'en' ? 'AROUND THE WEB' : 'JOŠ SADRŽAJA'}</span><h2>{t('home.socialWall')}</h2></div>
            </div>
            <div className="masonry" style={{ maxWidth: 820, margin: '0 auto' }}>
              {site.embeds.map((embed, i) => <div className="masonry-item" key={i}><EmbedBlock url={embed.url} caption={embed.caption} /></div>)}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
