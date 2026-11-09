import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Images, CalendarDays, FileText } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import type { Gallery, Post, EventItem } from '../types'

export function Dashboard() {
  const { site, t } = useSite()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<EventItem[]>([])

  useEffect(() => {
    api.get<Gallery[]>('/api/galleries/admin/all').then(setGalleries).catch(() => {})
    api.get<Post[]>('/api/posts/admin/all').then(setPosts).catch(() => {})
    api.get<EventItem[]>('/api/events/admin').then(setEvents).catch(() => {})
  }, [])

  const stats = [
    { icon: Images, label: t('admin.galleries'), value: galleries.length, to: '/admin/galleries' },
    { icon: CalendarDays, label: t('admin.events'), value: events.length, to: '/admin/events' },
    { icon: FileText, label: t('admin.posts'), value: posts.length, to: '/admin/posts' },
  ]

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">{site.name}</div>
          <h1>{t('admin.dashboard')}</h1>
        </div>
        <Link to="/admin/upload" className="btn btn-primary">
          <Upload size={16} /> {t('admin.upload')}
        </Link>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <Link to={s.to} key={s.label} className="stat" style={{ display: 'block' }}>
            <div className="num">{s.value}</div>
            <div className="label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="panel">
        <h3 style={{ fontSize: '1.4rem', marginBottom: 16 }}>Brzi početak</h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-dim)', lineHeight: 2 }}>
          <li>
            Na kartici <strong>{t('admin.settings')}</strong> postavi naziv, opis, About, društvene mreže i boju akcenta.
          </li>
          <li>
            Otvori <strong>{t('admin.upload')}</strong>, odaberi mapu s fotografijama i napiši naziv (npr. ime koncerta).
          </li>
          <li>AI će automatski opisati fotografije, dodati tagove i predložiti naslov i naslovnu sliku.</li>
          <li>
            Dodaj <strong>{t('admin.events')}</strong> i <strong>{t('admin.posts')}</strong> za kalendar i blog.
          </li>
        </ol>
      </div>
    </>
  )
}
