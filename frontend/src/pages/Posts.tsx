import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '../store'
import { api } from '../api'
import { Reveal } from '../components/Reveal'
import { Loading, Empty } from '../components/ui'
import { SignalPageHeader } from '../components/SignalPageHeader'
import type { Gallery, Post } from '../types'
import { formatDate } from '../lib/image'

export function Posts() {
  const { t, locale } = useSite()
  const [stories, setStories] = useState<Gallery[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Gallery[]>('/api/galleries').catch(() => [] as Gallery[]),
      api.get<Post[]>('/api/posts').catch(() => [] as Post[]),
    ])
      .then(([g, p]) => {
        setStories(g.filter((x) => x.body && x.body.trim()))
        setPosts(p)
      })
      .finally(() => setLoading(false))
  }, [])

  const useStories = stories.length > 0

  return (
    <section className="signal-subpage signal-posts-page section">
      <div className="container">
        <SignalPageHeader
          code="NOTES / 04"
          label={locale === 'en' ? 'Field notes' : 'Terenske bilješke'}
          title={t('nav.posts')}
          description={locale === 'en' ? 'Stories attached to the music, the people, and the rooms.' : 'Priče uz glazbu, ljude i prostore.'}
        />

        {loading ? (
          <Loading />
        ) : useStories ? (
          <div className="signal-story-grid">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 40}>
                <Link to={`/gallery/${s.slug}`} className="signal-story">
                  <span className="signal-story-index">0{i + 1} / FIELD NOTE</span>
                  {s.cover ? <img src={s.cover} alt={s.title} loading="lazy" /> : null}
                  <span className="signal-story-date">{formatDate(s.event_date, locale)}</span>
                  <strong>{s.title}</strong>
                  {s.description ? <span className="signal-story-description">{s.description}</span> : null}
                  <span className="signal-story-link">{locale === 'en' ? 'OPEN STORY' : 'OTVORI PRIČU'}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : posts.length ? (
          <div className="signal-story-grid">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 40}>
                <Link to={`/post/${p.slug}`} className="signal-story">
                  <span className="signal-story-index">0{i + 1} / FIELD NOTE</span>
                  {p.cover ? <img src={p.cover} alt={p.title} loading="lazy" /> : null}
                  <span className="signal-story-date">{formatDate(p.published_at, locale)}</span>
                  <strong>{p.title}</strong>
                  {p.excerpt ? <span className="signal-story-description">{p.excerpt}</span> : null}
                  <span className="signal-story-link">{locale === 'en' ? 'OPEN STORY' : 'OTVORI PRIČU'}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Empty label={t('common.empty')} />
        )}
      </div>
    </section>
  )
}
