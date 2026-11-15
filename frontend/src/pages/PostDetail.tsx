import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading } from '../components/ui'
import { SignalPageHeader } from '../components/SignalPageHeader'
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
    <section className="signal-subpage signal-post-detail section">
      <div className="container signal-article-container">
        <Link to="/posts" className="signal-back-link">
          <ArrowLeft size={15} /> {t('common.back')}
        </Link>

        <SignalPageHeader code={locale === 'en' ? 'BLOG POST' : 'OBJAVA'} label={formatDate(post.published_at, locale)} title={post.title} />
        {post.cover ? <img className="signal-article-cover" src={post.cover} alt={post.title} /> : null}
        <article className="prose signal-article-body">
          {post.body ? renderBody(post.body) : null}
          {post.tags?.length ? <div className="signal-article-tags">{post.tags.map((tg) => <span className="tag" key={tg}>{tg}</span>)}</div> : null}
        </article>
      </div>
    </section>
  )
}
