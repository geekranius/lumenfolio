import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading } from '../components/ui'
import type { EventItem } from '../types'
import { formatDate } from '../lib/image'

const empty = { title: '', description: '', start_date: '', end_date: '', time: '', location: '' }

export function EventsAdmin() {
  const { locale, t } = useSite()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [form, setForm] = useState(empty)

  const load = () => {
    setLoading(true)
    api
      .get<EventItem[]>('/api/events/admin')
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const startEdit = (e: EventItem) => {
    setEditing(e)
    setForm({
      title: e.title,
      description: e.description || '',
      start_date: e.start_date,
      end_date: e.end_date || '',
      time: e.time || '',
      location: e.location || '',
    })
  }

  const reset = () => {
    setEditing(null)
    setForm(empty)
  }

  const submit = async () => {
    if (!form.title || !form.start_date) return alert('Naslov i datum su obavezni.')
    if (editing) await api.put(`/api/events/admin/${editing.id}`, form)
    else await api.post('/api/events/admin', form)
    reset()
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Obrisati događaj?')) return
    await api.del(`/api/events/admin/${id}`)
    load()
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">Kalendar</div>
          <h1>{t('admin.events')}</h1>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 16 }}>{editing ? 'Uredi događaj' : 'Novi događaj'}</h3>
        <div className="row">
          <div className="field">
            <label>Naslov *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field">
            <label>Lokacija</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>Datum *</label>
            <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div className="field">
            <label>Vrijeme</label>
            <input className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="20:00" />
          </div>
        </div>
        <div className="field">
          <label>Opis</label>
          <textarea className="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
          {events.map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{e.title}</div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>
                  {formatDate(e.start_date, locale)}
                  {e.time ? ` · ${e.time}` : ''}
                  {e.location ? ` · ${e.location}` : ''}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(e)}>
                {t('common.edit')}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => remove(e.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
