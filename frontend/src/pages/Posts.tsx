import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '../store'
import { api } from '../api'
import { Reveal } from '../components/Reveal'
import { Loading, Empty } from '../components/ui'
import type { Post } from '../types'
import { formatDate } from '../lib/image'

export function Posts() {
  const { t, locale } = useSite()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Post[]>('/api/posts')
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Blog</div>
            <h2>{t('nav.posts')}</h2>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : posts.length === 0 ? (
          <Empty label={t('common.empty')} />
        ) : (
          <div className="post-grid">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 40}>
                <Link to={`/post/${p.slug}`} className="post-card">
                  {p.cover ? <img src={p.cover} alt="" loading="lazy" /> : null}
                  <div className="post-card-body">
                    <div className="date">{formatDate(p.published_at, locale)}</div>
                    <h3>{p.title}</h3>
                    {p.excerpt ? <p>{p.excerpt}</p> : null}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
