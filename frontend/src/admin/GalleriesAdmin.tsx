import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading, Empty } from '../components/ui'
import type { Gallery } from '../types'
import { formatDate } from '../lib/image'

export function GalleriesAdmin() {
  const { locale, t } = useSite()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api
      .get<Gallery[]>('/api/galleries/admin/all')
      .then(setGalleries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const remove = async (id: string) => {
    if (!confirm('Obrisati galeriju i sve fotografije?')) return
    await api.del(`/api/galleries/admin/${id}`)
    load()
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">Sadržaj</div>
          <h1>{t('admin.galleries')}</h1>
        </div>
        <Link to="/admin/upload" className="btn btn-primary">
          <Plus size={16} /> Nova galerija
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : galleries.length === 0 ? (
        <Empty label={t('common.empty')} />
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {galleries.map((g) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {g.cover ? (
                <img src={g.cover} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flex: 'none' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--surface-2)', flex: 'none' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{g.title}</div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>
                  {formatDate(g.event_date, locale)} · {g.image_count} foto
                  {g.status === 'draft' ? ' · skica' : ''}
                </div>
              </div>
              <Link to={`/admin/galleries/${g.id}`} className="btn btn-ghost btn-sm">
                Uredi
              </Link>
              <Link to={`/gallery/${g.slug}`} target="_blank" className="btn btn-ghost btn-sm">
                Pogledaj
              </Link>
              <button className="btn btn-danger btn-sm" onClick={() => remove(g.id)}>
                Obriši
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
