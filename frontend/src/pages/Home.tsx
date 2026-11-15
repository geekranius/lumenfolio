import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ScanLine, Shuffle } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Reveal } from '../components/Reveal'
import { GalleryCard } from '../components/GalleryCard'
import { EmbedBlock } from '../components/EmbedBlock'
import { Marquee } from '../components/Marquee'
import type { Gallery, Post, EventItem, ImageItem } from '../types'
import { formatDate } from '../lib/image'

const pad = (value: number) => String(value).padStart(2, '0')

export function Home() {
  const { site, t, locale } = useSite()
  const navigate = useNavigate()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [featuredFrame, setFeaturedFrame] = useState<ImageItem | null>(null)

  useEffect(() => {
    api.get<Gallery[]>('/api/galleries').then(setGalleries).catch(() => {})
    api.get<Post[]>('/api/posts').then(setPosts).catch(() => {})
    api.get<EventItem[]>('/api/events').then(setEvents).catch(() => {})
  }, [])

  const latestGallery = galleries[0]
  useEffect(() => {
    if (!latestGallery) return
    let active = true
    api.get<{ images: ImageItem[] }>(`/api/galleries/${latestGallery.slug}`)
      .then(({ images }) => { if (active) setFeaturedFrame(images?.[0] || null) })
      .catch(() => {})
    return () => { active = false }
  }, [latestGallery?.slug])

  const heroImage = featuredFrame?.src || latestGallery?.cover || site.avatar || ''
  const heroExif = latestGallery?.show_exif ? featuredFrame?.exif : null
  const cameraName = [heroExif?.Make, heroExif?.Model].filter(Boolean).join(' ') || (locale === 'en' ? 'STAGE UNIT / GF-01' : 'POZORNICA / GF-01')
  const shutter = Number(heroExif?.ExposureTime)
  const aperture = Number(heroExif?.FNumber)
  const shutterLabel = shutter > 0 ? (shutter < 1 ? `1/${Math.round(1 / shutter)}` : `${shutter}s`) : '—'
  const gearReadouts = [
    { label: locale === 'en' ? 'CAMERA' : 'KAMERA', value: cameraName },
    { label: locale === 'en' ? 'APERTURE' : 'BLENDA', value: aperture > 0 ? `f/${aperture}` : '—' },
    { label: 'ISO', value: heroExif?.ISO ? String(heroExif.ISO) : '—' },
    { label: locale === 'en' ? 'SHUTTER' : 'OKIDAČ', value: shutterLabel },
    { label: locale === 'en' ? 'FOCAL' : 'ŽARIŠNA', value: heroExif?.FocalLength ? `${heroExif.FocalLength} mm` : '—' },
  ]
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
  const latestYear = latestGallery?.event_date?.slice(0, 4) || new Date().getFullYear()
  const number = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'hr-HR')
  const surpriseMe = () => {
    const choices = galleries.length > 1 ? galleries.filter((gallery) => gallery.id !== latestGallery?.id) : galleries
    const choice = choices[Math.floor(Math.random() * choices.length)]
    if (choice) navigate(`/gallery/${choice.slug}`)
  }

  return (
    <div className="signal-home">
      <section className="signal-hero">
        <div className="signal-hero-grid container">
          <div className="signal-hero-copy">
            <div className="signal-kicker">
              <span className="signal-led" />
              <span>GEEK LAB / LIVE PHOTOGRAPHY</span>
              <span className="signal-kicker-line" />
              <span>HR—{pad(galleries.length)}</span>
            </div>

            <div className="signal-lab-identity">
              <img src="https://geekranius.stream/img/geekranius-480.webp" alt="Geekranius T-Rex maskota sa slušalicama" width="64" height="64" />
              <span><strong>{site.name}</strong><small>{locale === 'en' ? 'THE GEEK BEHIND THE LENS' : 'GEEK IZA OBJEKTIVA'}</small></span>
              <i><b /> {locale === 'en' ? 'FIELD SIGNAL LIVE' : 'SIGNAL S POZORNICE'}</i>
            </div>
            <h1 className="signal-title">
              {locale === 'en' ? (
                <>Loud.<br /><em>In focus.</em></>
              ) : (
                <>Glasno.<br /><em>U fokusu.</em></>
              )}
            </h1>
            <p className="signal-tagline">{locale === 'en' ? 'Rock, metal and live music — seen from inside the noise.' : 'Rock, metal i glazba uživo — iz samog srca buke.'}</p>
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
              {galleries.length > 0 ? (
                <button type="button" className="signal-surprise" onClick={surpriseMe}>
                  <Shuffle size={15} /> {locale === 'en' ? 'Surprise me' : 'Iznenadi me'}
                </button>
              ) : null}
            </div>

            <div className="signal-hero-signoff">
              <span>{locale === 'en' ? 'CONCERTS / CULTURE / PEOPLE' : 'KONCERTI / KULTURA / LJUDI'}</span>
              <span>{locale === 'en' ? 'A VISUAL FIELD LOG' : 'VIZUALNI TERENSKI ZAPIS'}</span>
            </div>
          </div>

          <div className="signal-hero-side">
            <div className="signal-frame-heading">
                <span><b className="signal-amp-mark">G</b> GEEKRANIUS / STAGE CAM</span>
                <span>{latestYear} <i /> LIVE FEED</span>
            </div>
            <figure className="signal-feature-frame">
              <div className="signal-feature-image">
                {heroImage ? <img src={heroImage} alt={latestGallery?.title || site.name} /> : <div className="signal-image-placeholder" />}
                <div className="signal-image-grid" />
                <span className="signal-frame-code">CAM—01 / FRAME {pad(galleries.length || 1)}</span>
                <span className="signal-frame-crosshair signal-crosshair-a" />
                <span className="signal-frame-crosshair signal-crosshair-b" />
                <span className="signal-vertical-note">LIGHT · SOUND · MEMORY</span>
                <span className="signal-frame-live"><i /> REC // CROWD NOISE</span>
              </div>
              <figcaption className="signal-feature-caption">
                <div className="signal-waveform" aria-hidden="true">
                  {[18, 30, 22, 39, 27, 44, 25, 35, 18, 29, 42, 24, 34].map((height, i) => (
                    <span key={i} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="signal-caption-copy">
                  <span>{locale === 'en' ? 'LAST SHOT / LIVE' : 'POSLJEDNJI KADAR / UŽIVO'}</span>
                  <strong>{latestGallery?.title || (locale === 'en' ? 'The live archive' : 'Arhiva uživo')}</strong>
                  <small>
                    {latestGallery?.event_date ? formatDate(latestGallery.event_date, locale) : ''}
                    {latestGallery?.image_count ? ` · ${number.format(latestGallery.image_count)} ${locale === 'en' ? 'frames' : 'fotografija'}` : ''}
                  </small>
                </div>
                {latestGallery ? (
                  <Link to={`/gallery/${latestGallery.slug}`} className="signal-feature-open" aria-label={latestGallery.title}>
                    <ArrowUpRight size={18} />
                  </Link>
                ) : null}
              </figcaption>
            </figure>
            <div className="signal-gear-readout" aria-label={locale === 'en' ? 'Camera EXIF readout' : 'EXIF podaci kamere'}>
              <div className="signal-gear-heading"><span><ScanLine size={13} /> {locale === 'en' ? 'CAMERA TELEMETRY' : 'TELEMETRIJA KAMERE'}</span><span>EXIF // 0{gearReadouts.filter((item) => item.value !== '—').length}</span></div>
              <div className="signal-gear-values">
                {gearReadouts.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
              </div>
            </div>
            <div className="signal-frame-footer">
              <span>FIG. 01 — {locale === 'en' ? 'ARCHIVE' : 'ARHIVA'} / {totalPhotos.toLocaleString(locale === 'en' ? 'en-GB' : 'hr-HR')} {locale === 'en' ? 'FRAMES' : 'KADROVA'}</span>
              <span>{totalPhotos.toLocaleString(locale === 'en' ? 'en-GB' : 'hr-HR')} {locale === 'en' ? 'NEGATIVES' : 'NEGATIVA'} ↘</span>
            </div>
          </div>
        </div>
        <div className="signal-hero-index" aria-hidden="true">01<span>/</span>04</div>
      </section>

      {site.marqueeItems.length ? <Marquee items={site.marqueeItems} /> : null}

      <section className="signal-intel section-tight" aria-label={locale === 'en' ? 'Archive facts' : 'Zanimljivosti iz arhive'}>
        <div className="container">
          <div className="signal-intel-heading">
            <div>
              <span className="signal-section-code">DATA / 01</span>
              <h2>{locale === 'en' ? 'Inside the archive' : 'Iza objektiva'}</h2>
            </div>
            <p>{locale === 'en' ? 'A few signals pulled from the work.' : 'Nekoliko signala iz dosadašnjeg rada.'}</p>
          </div>
          <div className="signal-facts-grid">
            <article className="signal-fact">
              <span className="signal-fact-index">A / COLLECTION</span>
              <strong className="signal-fact-value">{pad(galleries.length)}</strong>
              <span className="signal-fact-label">{locale === 'en' ? 'live sets in the archive' : 'koncerta u arhivi'}</span>
            </article>
            <article className="signal-fact">
              <span className="signal-fact-index">B / FRAME COUNT</span>
              <strong className="signal-fact-value">{number.format(totalPhotos)}</strong>
              <span className="signal-fact-label">{locale === 'en' ? 'photographs indexed' : 'fotografija u kolekciji'}</span>
            </article>
            <article className="signal-fact signal-fact-featured">
              <span className="signal-fact-index">C / LONGEST SET</span>
              <strong className="signal-fact-value">{number.format(longestSet?.image_count || 0)}</strong>
              <span className="signal-fact-label">{longestSet?.title || (locale === 'en' ? 'Frames in one set' : 'fotografija u jednoj galeriji')}</span>
            </article>
            {events.length > 0 ? (
              <article className="signal-fact">
                <span className="signal-fact-index">D / CALENDAR</span>
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
                <span className="signal-section-code">INDEX / 02 — {pad(galleries.length)} ENTRIES</span>
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
                    <GalleryCard gallery={gallery} locale={locale} index={i + 1} variant={i === 0 ? 'feature' : i < 3 ? 'compact' : 'standard'} />
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
            <div className="signal-about-stamp">
              {site.avatar ? <img src={site.avatar} alt={site.name} /> : <span>GF<br />/01</span>}
              <span className="signal-stamp-ring">{locale === 'en' ? 'FIELD NOTES • FIELD NOTES •' : 'TERENSKE BILJEŠKE • TERENSKE BILJEŠKE •'}</span>
            </div>
            <div className="signal-about-copy">
              <span className="signal-section-code">PROFILE / 03</span>
              <h2>{t('home.about')}</h2>
              <p>{about}</p>
              {site.contact.email ? <a href={`mailto:${site.contact.email}`} className="signal-all-link">{t('home.contact')} <ArrowRight size={16} /></a> : null}
            </div>
            <div className="signal-about-side">
              <span>{site.name}</span>
              <span>{site.tagline}</span>
              <span className="signal-about-rule" />
              <span>END OF NOTE / 03</span>
            </div>
          </div>
        </section>
      ) : null}

      {site.showPosts && (stories.length > 0 || posts.length > 0) ? (
        <section className="signal-stories section">
          <div className="container">
            <div className="signal-section-head">
              <div>
                <span className="signal-section-code">NOTES / 04</span>
                <h2>{t('home.latest')}</h2>
              </div>
              <Link to="/posts" className="signal-all-link">{t('home.seeAll')} <ArrowRight size={17} /></Link>
            </div>
            <div className="signal-story-grid">
              {stories.length > 0
                ? stories.slice(0, 3).map((story, i) => (
                    <Link to={`/gallery/${story.slug}`} key={story.id} className="signal-story">
                      <span className="signal-story-index">0{i + 1} / FIELD NOTE</span>
                      {story.cover ? <img src={story.cover} alt="" loading="lazy" /> : null}
                      <span className="signal-story-date">{formatDate(story.event_date, locale)}</span>
                      <strong>{story.title}</strong>
                      {story.description ? <span className="signal-story-description">{story.description}</span> : null}
                      <span className="signal-story-link">{locale === 'en' ? 'OPEN STORY' : 'OTVORI PRIČU'} <ArrowUpRight size={15} /></span>
                    </Link>
                  ))
                : posts.slice(0, 3).map((post, i) => (
                    <Link to={`/post/${post.slug}`} key={post.id} className="signal-story">
                      <span className="signal-story-index">0{i + 1} / FIELD NOTE</span>
                      {post.cover ? <img src={post.cover} alt="" loading="lazy" /> : null}
                      <span className="signal-story-date">{formatDate(post.published_at, locale)}</span>
                      <strong>{post.title}</strong>
                      {post.excerpt ? <span className="signal-story-description">{post.excerpt}</span> : null}
                      <span className="signal-story-link">{locale === 'en' ? 'OPEN STORY' : 'OTVORI PRIČU'} <ArrowUpRight size={15} /></span>
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
              <div><span className="signal-section-code">EXTERNAL SIGNAL / 05</span><h2>{t('home.socialWall')}</h2></div>
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
