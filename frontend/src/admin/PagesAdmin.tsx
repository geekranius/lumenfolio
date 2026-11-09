import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading } from '../components/ui'
import type { PageItem } from '../types'

export function PagesAdmin() {
  const { t } = useSite()
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PageItem | null>(null)
  const [form, setForm] = useState({ title: '', body: '' })

  const load = () => {
    setLoading(true)
    api
      .get<PageItem[]>('/api/pages/admin/all')
      .then(setPages)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const startEdit = (p: PageItem) => {
    setEditing(p)
    setForm({ title: p.title, body: p.body || '' })
  }

  const reset = () => {
    setEditing(null)
    setForm({ title: '', body: '' })
  }

  const submit = async () => {
    if (!form.title) return alert('Naslov je obavezan.')
    if (editing) await api.put(`/api/pages/admin/${editing.id}`, form)
    else await api.post('/api/pages/admin', form)
    reset()
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Obrisati stranicu?')) return
    await api.del(`/api/pages/admin/${id}`)
    load()
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">Sadržaj</div>
          <h1>{t('admin.pages')}</h1>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 16 }}>{editing ? 'Uredi stranicu' : 'Nova stranica'}</h3>
        <div className="field">
          <label>Naslov *</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="O meni, Kontakt…" />
        </div>
        <div className="field">
          <label>Sadržaj</label>
          <textarea
            className="textarea"
            rows={6}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Tekst… (prazan red = odlomak, **podebljano**, [link](https://…))"
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={submit}>
            {editing ? t('common.save') : t('common.publish')}
          </button>
          {editing ? (
            <button className="btn btn-ghost" onClick={reset}>
              {t('common.cancel')}
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {pages.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>
                  /{p.slug}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                {t('common.edit')}
              </button>
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
