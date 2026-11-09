import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading } from '../components/ui'
import { renderBody } from '../lib/render'
import type { Post } from '../types'
import { formatDate } from '../lib/image'

export function PostDetail() {
  const { slug } = useParams()
  const { t, locale } = useSite()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .get<Post>(`/api/posts/${slug}`)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <Loading />
  if (!post) return <div className="container section empty">Objava nije pronađena.</div>

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <Link to="/posts" className="btn btn-ghost btn-sm" style={{ marginBottom: 28 }}>
          <ArrowLeft size={15} /> {t('common.back')}
        </Link>

        <div className="prose">
          <div className="eyebrow">{formatDate(post.published_at, locale)}</div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', marginBottom: 20 }}>{post.title}</h1>
          {post.cover ? <img src={post.cover} alt={post.title} style={{ borderRadius: 18 }} /> : null}
          {post.body ? <div style={{ marginTop: 24 }}>{renderBody(post.body)}</div> : null}
          {post.tags?.length ? (
            <div style={{ marginTop: 28 }}>
              {post.tags.map((tg) => (
                <span className="tag" key={tg}>
                  {tg}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
