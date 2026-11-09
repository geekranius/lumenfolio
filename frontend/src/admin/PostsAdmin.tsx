import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading } from '../components/ui'
import type { Post } from '../types'
import { formatDate } from '../lib/image'

export function PostsAdmin() {
  const { locale, t } = useSite()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api
      .get<Post[]>('/api/posts/admin/all')
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const remove = async (id: string) => {
    if (!confirm('Obrisati objavu?')) return
    await api.del(`/api/posts/admin/${id}`)
    load()
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">Blog</div>
          <h1>{t('admin.posts')}</h1>
        </div>
        <Link to="/admin/posts/new" className="btn btn-primary">
          <Plus size={16} /> Nova objava
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {posts.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              {p.cover ? <img src={p.cover} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flex: 'none' }} /> : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>
                  {formatDate(p.published_at, locale)}
                  {p.status === 'draft' ? ' · skica' : ''}
                </div>
              </div>
              <Link to={`/admin/posts/${p.id}`} className="btn btn-ghost btn-sm">
                {t('common.edit')}
              </Link>
              <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
