import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Upload as UploadIcon, Sparkles, X, Wand2 } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { prepareImage, SUPPORTED_TYPES } from '../lib/image'

export function Upload() {
  const { t } = useSite()
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [context, setContext] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')

  const [aiBusy, setAiBusy] = useState(false)
  const [aiMsg, setAiMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ slug: string; count: number } | null>(null)

  const addFiles = (list: FileList | File[]) => {
    const imgs = Array.from(list).filter((f) => SUPPORTED_TYPES.includes(f.type) || f.name.toLowerCase().endsWith('.heic'))
    setFiles((prev) => [...prev, ...imgs])
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  // AI napiše naslov + opis + tagove iz konteksta (bend, datum, pjesme, atmosfera…).
  const aiDraft = async () => {
    if (!context.trim()) return setAiMsg('Prvo napiši kontekst pa klikni ponovno.')
    setAiBusy(true)
    setAiMsg('')
    try {
      const r = await api.post<{ title: string; description: string; tags: string[] }>('/api/galleries/admin/ai-text', {
        context,
        title: title || null,
      })
      setTitle((prev) => prev || r.title)
      setDescription(r.description)
      setAiMsg(`✨ AI je sastavio: „${r.title}” · tagovi: ${r.tags.slice(0, 5).join(', ')}`)
    } catch (e: any) {
      setAiMsg(e.message || 'AI nije uspio sastaviti tekst.')
    } finally {
      setAiBusy(false)
    }
  }

  const publish = async () => {
    setBusy(true)
    setError('')
    setProgress(0)
    try {
      setStatus('Stvaram galeriju…')
      const gallery = await api.post<{ id: string; slug: string }>('/api/galleries/admin', {
        title: title || 'Nova galerija',
        description: description || null,
        context: context || null,
        event_date: eventDate || null,
        location: location || null,
      })
      const galleryId = gallery.id

      const meta: Array<{ id: string; width: number; height: number; variants: number[] }> = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        setStatus(`Obrađujem ${i + 1}/${files.length}: ${f.name}`)
        try {
          const p = await prepareImage(f)
          for (const w of p.variants) {
            await api.upload(`galleries/${galleryId}/${p.id}/${w}.webp`, p.blobs[w])
          }
          meta.push({ id: p.id, width: p.width, height: p.height, variants: p.variants })
        } catch {
          /* skip unreadable file */
        }
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      setStatus('Spremam podatke…')
      await api.post('/api/images/admin', { galleryId, images: meta })

      setResult({ slug: gallery.slug, count: meta.length })
      setStatus('')
    } catch (err: any) {
      setError(err.message || 'Objavljivanje nije uspjelo')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <>
        <div className="admin-head">
          <h1>Gotovo! 🎉</h1>
        </div>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <div className="eyebrow">Objavljeno</div>
          <h2 style={{ fontSize: '2rem', margin: '12px 0 8px' }}>{result.count} fotografija</h2>
          <p className="muted">
            AI sada u pozadini opisuje fotografije, sastavlja opis i tagove i bira naslovnu sliku. Pričekajte minutu pa
            osvježite galeriju.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <Link to={`/gallery/${result.slug}`} className="btn btn-primary" target="_blank">
              Pogledaj galeriju
            </Link>
            <button className="btn btn-ghost" onClick={() => setResult(null)}>
              Objavi još
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">Upload</div>
          <h1>{t('admin.upload')}</h1>
        </div>
      </div>

      <div className="panel">
        <div className="field">
          <label>Opiši događaj / fotografije (AI iz ovoga sastavi tekst)</label>
          <textarea
            className="textarea"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            placeholder="Npr. „Koncert benda The Catch 22s u klubu BBF 16.10.2026. Svirali su stare hitove, publika je pjevala, atmosfera je bila energična i dimna…“"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={aiDraft} disabled={aiBusy || !context.trim()}>
              <Wand2 size={15} /> {aiBusy ? 'Sastavljam…' : '✨ AI sastavi naslov, opis i tagove'}
            </button>
          </div>
          {aiMsg ? <div className="hint" style={{ marginTop: 8, color: 'var(--accent)' }}>{aiMsg}</div> : null}
        </div>

        <div className="row">
          <div className="field">
            <label>Naslov (opcionalno — AI može predložiti)</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="npr. The Catch 22s — BBF" />
          </div>
          <div className="field">
            <label>Datum događaja</label>
            <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Opis (ostavi prazno pa će AI napisati)</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="field">
          <label>Lokacija</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Zagreb" />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div
          className="dropzone"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <FolderOpen size={40} strokeWidth={1.4} />
          <div className="big">Odaberi mapu s fotografijama</div>
          <div>ili ispusti datoteke ovdje · JPG, PNG, WebP</div>
          <input ref={inputRef} type="file" multiple hidden {...({ webkitdirectory: 'true', directory: 'true' } as any)} onChange={onPick} accept="image/*" />
        </div>

        {files.length > 0 ? (
          <div className="thumb-grid">
            {files.map((f, i) => (
              <div className="thumb" key={`${f.name}-${i}`}>
                <img src={URL.createObjectURL(f)} alt={f.name} />
                <button className="rm" onClick={() => remove(i)}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {files.length > 0 ? (
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={publish} disabled={busy}>
              <Sparkles size={16} /> {busy ? 'Objavljujem…' : `Objavi ${files.length} fotografija`}
            </button>
            <span className="muted" style={{ fontSize: '0.88rem' }}>
              {files.length} datoteka odabrano
            </span>
          </div>
        ) : null}

        {busy ? (
          <div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="status-line">
              <UploadIcon size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {status} · {progress}%
            </div>
          </div>
        ) : null}

        {error ? <p style={{ color: '#e06a6a', marginTop: 16 }}>{error}</p> : null}
      </div>
    </>
  )
}
