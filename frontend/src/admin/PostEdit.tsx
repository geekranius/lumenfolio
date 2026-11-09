import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading } from '../components/ui'
import type { Post } from '../types'

export function PostEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useSite()
  const isNew = id === 'new'
  const [loading, setLoading] = useState(!isNew)

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [cover, setCover] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState('published')

  useEffect(() => {
    if (isNew) return
    api
      .get<Post>(`/api/posts/admin/${id}`)
      .then((p) => {
        setTitle(p.title)
        setExcerpt(p.excerpt || '')
        setBody(p.body || '')
        setCover(p.cover || '')
        setTags((p.tags || []).join(', '))
        setStatus(p.status)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, isNew])

  if (loading) return <Loading />

  const submit = async () => {
    const payload = {
      title,
      excerpt: excerpt || null,
      body: body || null,
      cover_image_id: cover || null,
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      status,
    }
    if (isNew) {
      const p = await api.post<Post>('/api/posts/admin', payload)
      navigate(`/admin/posts/${p.id}`)
    } else {
      await api.put(`/api/posts/admin/${id}`, payload)
    }
    alert('Spremljeno.')
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <Link to="/admin/posts" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
            <ArrowLeft size={15} /> {t('common.back')}
          </Link>
          <div className="eyebrow">{isNew ? 'Nova objava' : 'Uredi objavu'}</div>
          <h1>{title || 'Bez naslova'}</h1>
        </div>
        <button className="btn btn-primary" onClick={submit}>
          <Save size={16} /> {t('common.save')}
        </button>
      </div>

      <div className="panel">
        <div className="row">
          <div className="field">
            <label>Naslov *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="published">Objavljeno</option>
              <option value="draft">Skica</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Kratki opis (excerpt)</label>
          <textarea className="textarea" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>
        <div className="field">
          <label>Naslovna slika (URL)</label>
          <input className="input" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://… ili /files/…" />
        </div>
        <div className="field">
          <label>Tagovi (odvojeni zarezom)</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="field">
          <label>Sadržaj</label>
          <textarea
            className="textarea"
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'Piši tekst…\n\nPrazan red = novi odlomak.\n**podebljano**, *kurziv*, [link](https://…)\n\nZa embed, zalijepi URL na svoj red (Instagram/TikTok/YouTube/Facebook/X).'}
          />
        </div>
      </div>
    </>
  )
}
