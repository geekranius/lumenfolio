import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '../store'
import { api } from '../api'
import { Reveal } from '../components/Reveal'
import { Loading, Empty } from '../components/ui'
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
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Priče</div>
            <h2>{t('nav.posts')}</h2>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : useStories ? (
          <div className="post-grid">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 40}>
                <Link to={`/gallery/${s.slug}`} className="post-card">
                  {s.cover ? (
                    <div className="img-wrap">
                      <img src={s.cover} alt={s.title} loading="lazy" />
                    </div>
                  ) : null}
                  <div className="post-card-body">
                    <div className="date">{formatDate(s.event_date, locale)}</div>
                    <h3>{s.title}</h3>
                    {s.description ? <p>{s.description}</p> : null}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : posts.length ? (
          <div className="post-grid">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 40}>
                <Link to={`/post/${p.slug}`} className="post-card">
                  {p.cover ? (
                    <div className="img-wrap">
                      <img src={p.cover} alt={p.title} loading="lazy" />
                    </div>
                  ) : null}
                  <div className="post-card-body">
                    <div className="date">{formatDate(p.published_at, locale)}</div>
                    <h3>{p.title}</h3>
                    {p.excerpt ? <p>{p.excerpt}</p> : null}
                  </div>
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
