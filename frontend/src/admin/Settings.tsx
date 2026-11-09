import { useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import type { SiteSettings } from '../types'

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'youtube', 'x', 'linkedin', 'behance', 'vimeo', 'website', 'email', 'phone']

export function Settings() {
  const { site, setSite, t } = useSite()
  const [s, setS] = useState<SiteSettings>(site)
  const [saving, setSaving] = useState(false)

  const up = (patch: Partial<SiteSettings>) => setS((prev) => ({ ...prev, ...patch }))
  const upContact = (patch: Partial<SiteSettings['contact']>) => setS((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }))
  const upSeo = (patch: Partial<SiteSettings['seo']>) => setS((prev) => ({ ...prev, seo: { ...prev.seo, ...patch } }))

  const addSocial = () => setS((prev) => ({ ...prev, socials: [...prev.socials, { platform: 'instagram', url: '' }] }))
  const setSocial = (i: number, patch: Partial<SiteSettings['socials'][number]>) =>
    setS((prev) => ({ ...prev, socials: prev.socials.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) }))
  const rmSocial = (i: number) => setS((prev) => ({ ...prev, socials: prev.socials.filter((_, idx) => idx !== i) }))

  const addEmbed = () => setS((prev) => ({ ...prev, embeds: [...prev.embeds, { platform: 'instagram', url: '', caption: '' }] }))
  const setEmbed = (i: number, patch: Partial<SiteSettings['embeds'][number]>) =>
    setS((prev) => ({ ...prev, embeds: prev.embeds.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) }))
  const rmEmbed = (i: number) => setS((prev) => ({ ...prev, embeds: prev.embeds.filter((_, idx) => idx !== i) }))

  const save = async () => {
    setSaving(true)
    try {
      const next = await api.put<SiteSettings>('/api/site/admin', s)
      setSite(next)
      alert('Spremljeno.')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">Postavke</div>
          <h1>{t('admin.settings')}</h1>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? '…' : t('common.save')}
        </button>
      </div>

      <div className="panel">
        <h3 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Osnovno</h3>
        <div className="row">
          <div className="field">
            <label>Naziv portfolia</label>
            <input className="input" value={s.name} onChange={(e) => up({ name: e.target.value })} />
          </div>
          <div className="field">
            <label>Jezik sučelja</label>
            <select className="select" value={s.locale} onChange={(e) => up({ locale: e.target.value as any })}>
              <option value="hr">Hrvatski</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Kratki opis (tagline)</label>
          <input className="input" value={s.tagline} onChange={(e) => up({ tagline: e.target.value })} />
        </div>
        <div className="field">
          <label>O meni (About)</label>
          <textarea className="textarea" rows={4} value={s.about} onChange={(e) => up({ about: e.target.value })} />
        </div>
        <div className="row">
          <div className="field">
            <label>Profilna slika (URL)</label>
            <input className="input" value={s.avatar} onChange={(e) => up({ avatar: e.target.value })} />
          </div>
          <div className="field">
            <label>Logo (URL)</label>
            <input className="input" value={s.logo} onChange={(e) => up({ logo: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Izgled</h3>
        <div className="row">
          <div className="field">
            <label>Tema</label>
            <select className="select" value={s.theme} onChange={(e) => up({ theme: e.target.value as any })}>
              <option value="dark">Tamna</option>
              <option value="light">Svijetla</option>
              <option value="auto">Automatski</option>
            </select>
          </div>
          <div className="field">
            <label>Boja akcenta</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="color" value={s.accent} onChange={(e) => up({ accent: e.target.value })} style={{ width: 48, height: 44, border: '1px solid var(--border-strong)', borderRadius: 10, background: 'none', padding: 2 }} />
              <input className="input" value={s.accent} onChange={(e) => up({ accent: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={s.showCalendar} onChange={(e) => up({ showCalendar: e.target.checked })} />
            <label style={{ margin: 0 }}>Prikaži kalendar</label>
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={s.showPosts} onChange={(e) => up({ showPosts: e.target.checked })} />
            <label style={{ margin: 0 }}>Prikaži blog</label>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Kontakt</h3>
        <div className="row">
          <div className="field">
            <label>Email</label>
            <input className="input" value={s.contact.email} onChange={(e) => upContact({ email: e.target.value })} />
          </div>
          <div className="field">
            <label>Telefon</label>
            <input className="input" value={s.contact.phone} onChange={(e) => upContact({ phone: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>Adresa</label>
            <input className="input" value={s.contact.address} onChange={(e) => upContact({ address: e.target.value })} />
          </div>
          <div className="field">
            <label>Grad</label>
            <input className="input" value={s.contact.city} onChange={(e) => upContact({ city: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Društvene mreže</h3>
        {s.socials.map((so, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <select className="select" style={{ width: 160 }} value={so.platform} onChange={(e) => setSocial(i, { platform: e.target.value })}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input className="input" placeholder="https://…" value={so.url} onChange={(e) => setSocial(i, { url: e.target.value })} />
            <button className="icon-btn" onClick={() => rmSocial(i)} style={{ color: '#e06a6a' }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addSocial}>
          <Plus size={15} /> Dodaj mrežu
        </button>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Embed postovi (Instagram / TikTok / Facebook…)</h3>
        <p className="muted" style={{ fontSize: '0.86rem', marginTop: -8 }}>
          Zalijepi URL javnog posta — prikazat će se kao embed na početnoj stranici.
        </p>
        {s.embeds.map((em, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input" placeholder="URL posta" value={em.url} onChange={(e) => setEmbed(i, { url: e.target.value })} />
              <button className="icon-btn" onClick={() => rmEmbed(i)} style={{ color: '#e06a6a' }}>
                <Trash2 size={15} />
              </button>
            </div>
            <input className="input" placeholder="Natpis (opcionalno)" value={em.caption || ''} onChange={(e) => setEmbed(i, { caption: e.target.value })} />
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addEmbed}>
          <Plus size={15} /> Dodaj embed
        </button>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 16 }}>SEO</h3>
        <div className="field">
          <label>Naslov (title)</label>
          <input className="input" value={s.seo.title} onChange={(e) => upSeo({ title: e.target.value })} />
        </div>
        <div className="field">
          <label>Opis (meta description)</label>
          <textarea className="textarea" rows={2} value={s.seo.description} onChange={(e) => upSeo({ description: e.target.value })} />
        </div>
        <div className="field">
          <label>Slika za dijeljenje (og:image URL)</label>
          <input className="input" value={s.seo.image} onChange={(e) => upSeo({ image: e.target.value })} />
        </div>
      </div>
    </>
  )
}
