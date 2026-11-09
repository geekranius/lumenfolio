import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Sparkles, Save } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading } from '../components/ui'
import type { Gallery, ImageItem } from '../types'

export function GalleryEdit() {
  const { id } = useParams()
  const { t } = useSite()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [aiMsg, setAiMsg] = useState('')

  // form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [tags, setTags] = useState('')

  const load = async () => {
    setLoading(true)
    const all = await api.get<Gallery[]>('/api/galleries/admin/all').catch(() => [])
    const g = all.find((x) => x.id === id) || null
    setGallery(g)
    if (g) {
      setTitle(g.title)
      setDescription(g.description || '')
      setEventDate(g.event_date || '')
      setLocation(g.location || '')
      setTags((g.tags || []).join(', '))
      api
        .get<ImageItem[]>(`/api/images?gallery=${g.id}`)
        .then(setImages)
        .catch(() => {})
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  const save = async () => {
    await api.put(`/api/galleries/admin/${id}`, {
      title,
      description: description || null,
      event_date: eventDate || null,
      location: location || null,
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
    })
    alert('Spremljeno.')
    load()
  }

  const regenerate = async () => {
    setAiMsg('AI obrađuje fotografije u pozadini…')
    await api.post(`/api/galleries/admin/${id}/ai`)
    setTimeout(() => setAiMsg('AI obrada je pokrenuta. Osvježi za rezultate.'), 500)
  }

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...images]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    setImages(next)
    await api.post('/api/images/admin/reorder', { ids: next.map((x) => x.id) })
  }

  const removeImage = async (imageId: string) => {
    if (!confirm('Obrisati fotografiju?')) return
    await api.del(`/api/images/admin/${imageId}`)
    setImages((prev) => prev.filter((x) => x.id !== imageId))
  }

  const updateCaption = async (imageId: string, caption: string) => {
    setImages((prev) => prev.map((x) => (x.id === imageId ? { ...x, caption } : x)))
    await api.put(`/api/images/admin/${imageId}`, { caption })
  }

  if (loading) return <Loading />
  if (!gallery) return <div className="empty">Galerija nije pronađena.</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <Link to="/admin/galleries" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
            <ArrowLeft size={15} /> {t('common.back')}
          </Link>
          <div className="eyebrow">Uredi galeriju</div>
          <h1>{gallery.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={regenerate}>
            <Sparkles size={16} /> AI obrada
          </button>
          <button className="btn btn-primary" onClick={save}>
            <Save size={16} /> {t('common.save')}
          </button>
        </div>
      </div>

      {aiMsg ? <p className="muted" style={{ marginBottom: 16 }}>{aiMsg}</p> : null}

      <div className="panel">
        <div className="row">
          <div className="field">
            <label>Naslov</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Datum događaja</label>
            <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Opis</label>
          <textarea className="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="row">
          <div className="field">
            <label>Lokacija</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="field">
            <label>Tagovi (odvojeni zarezom)</label>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.3rem', margin: '28px 0 16px' }}>Fotografije ({images.length})</h3>
      <div className="masonry">
        {images.map((img, i) => (
          <div className="masonry-item" key={img.id}>
            <div className="panel" style={{ padding: 12 }}>
              <img src={img.placeholder} alt="" loading="lazy" style={{ width: '100%', borderRadius: 10 }} />
              <input
                className="input"
                style={{ marginTop: 10, fontSize: '0.82rem', padding: '8px 10px' }}
                value={img.caption || ''}
                placeholder="Opis (AI može ispuniti)"
                onChange={(e) => updateCaption(img.id, e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp size={15} />
                </button>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => move(i, 1)} disabled={i === images.length - 1}>
                  <ArrowDown size={15} />
                </button>
                <button className="icon-btn" style={{ width: 32, height: 32, marginLeft: 'auto', color: '#e06a6a' }} onClick={() => removeImage(img.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
