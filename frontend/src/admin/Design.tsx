import { useEffect, useState } from 'react'
import { Save, Wand2, RotateCcw, Check } from 'lucide-react'
import { useSite } from '../store'
import { api } from '../api'
import { PRESETS, FONT_PAIRS, applyDesign, normalizeDesign, type DesignConfig } from '../lib/design'
import type { SiteSettings } from '../types'

const ACCENTS = ['#c8a24a', '#d4b06a', '#b08968', '#f2f2f2', '#ff5d5d', '#4f7cff', '#34d399', '#e272b4', '#7c5cff', '#111111']
const FONT_KEYS = Object.keys(FONT_PAIRS)

export function Design() {
  const { site, setSite } = useSite()
  const [draft, setDraft] = useState<DesignConfig>(() => normalizeDesign(site.design))
  const [ai, setAi] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [saving, setSaving] = useState(false)

  // Live preview: apply the draft to the page as the user edits.
  useEffect(() => {
    applyDesign(draft)
    return () => applyDesign(site.design)
  }, [draft, site.design])

  const set = (patch: Partial<DesignConfig>) => setDraft((d) => ({ ...d, ...patch }))

  const save = async () => {
    setSaving(true)
    try {
      const next = await api.put<SiteSettings>('/api/site/admin', { design: draft })
      setSite(next)
      alert('Dizajn spremljen i objavljen.')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const aiDesign = async () => {
    if (!ai.trim()) return
    setAiBusy(true)
    try {
      const d = await api.post<Partial<DesignConfig>>('/api/design/admin/ai', { prompt: ai })
      setDraft((cur) => normalizeDesign({ ...cur, ...d }))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setAiBusy(false)
    }
  }

  const applyPreset = (key: string) => setDraft(normalizeDesign(PRESETS[key].design))

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="eyebrow">Builder</div>
          <h1>Dizajn stranice</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setDraft(normalizeDesign(site.design))}>
            <RotateCcw size={16} /> Poništi
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Save size={16} /> {saving ? '…' : 'Spremi i objavi'}
          </button>
        </div>
      </div>

      <div className="builder-grid">
        <div>
          <div className="panel" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 8 }}>✨ AI builder</h3>
            <p className="muted" style={{ fontSize: '0.9rem', margin: '0 0 12px' }}>
              Opiši kakvu stranicu želiš i AI će je složiti (boje, fontove, stil, temu).
            </p>
            <textarea
              className="textarea"
              rows={3}
              value={ai}
              onChange={(e) => setAi(e.target.value)}
              placeholder='Npr. „Želim mračan, kinematografski look sa zlatnim detaljima i velikim elegantnim naslovima, galerija kao mozaik…“'
            />
            <button className="btn btn-primary" onClick={aiDesign} disabled={aiBusy || !ai.trim()} style={{ marginTop: 12 }}>
              <Wand2 size={16} /> {aiBusy ? 'Slažem…' : 'Složi mi dizajn'}
            </button>
          </div>

          <div className="panel">
            <h3 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Teme (preseti)</h3>
            <div className="preset-grid">
              {Object.entries(PRESETS).map(([key, p]) => {
                const d = p.design
                return (
                  <div key={key} className={`preset-card ${draft.preset === key ? 'active' : ''}`} onClick={() => applyPreset(key)}>
                    <div className="preset-swatch" style={{ background: d.mode === 'light' ? '#f3f0ea' : '#121216' }}>
                      <span style={{ background: d.accent, width: 26, height: 26, borderRadius: 6 }} />
                      <span style={{ background: d.mode === 'light' ? '#2a2825' : '#e9e7e2', opacity: 0.7 }} />
                      <span style={{ background: d.accent, opacity: 0.5 }} />
                    </div>
                    <div className="preset-label">
                      {p.label}
                      {draft.preset === key ? <Check size={15} /> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Prilagodi</h3>

          <div className="field">
            <label>Pozadina</label>
            <div className="seg">
              {(['dark', 'light'] as const).map((m) => (
                <button key={m} className={draft.mode === m ? 'active' : ''} onClick={() => set({ mode: m })}>
                  {m === 'dark' ? 'Tamna' : 'Svijetla'}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Boja akcenta</label>
            <div className="color-row">
              <input type="color" value={draft.accent} onChange={(e) => set({ accent: e.target.value })} />
              <div className="swatches">
                {ACCENTS.map((c) => (
                  <span key={c} className={`swatch ${draft.accent === c ? 'active' : ''}`} style={{ background: c }} onClick={() => set({ accent: c })} />
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <label>Font</label>
            <select className="select" value={draft.fontPair} onChange={(e) => set({ fontPair: e.target.value })}>
              {FONT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {FONT_PAIRS[k].label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Raspored galerije</label>
            <div className="seg">
              {(['masonry', 'grid'] as const).map((l) => (
                <button key={l} className={draft.layout === l ? 'active' : ''} onClick={() => set({ layout: l })}>
                  {l === 'masonry' ? 'Mozaik' : 'Mreža'}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Hero (uvodni dio)</label>
            <div className="seg" style={{ flexWrap: 'wrap' }}>
              {(['cinematic', 'full', 'split', 'minimal'] as const).map((h) => (
                <button key={h} className={draft.hero === h ? 'active' : ''} onClick={() => set({ hero: h })}>
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Zaobljenost: {draft.radius}px</label>
            <div className="range-row">
              <input type="range" min={0} max={24} value={draft.radius} onChange={(e) => set({ radius: Number(e.target.value) })} />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Animacije</label>
              <div className="seg">
                <button className={draft.animations ? 'active' : ''} onClick={() => set({ animations: true })}>Da</button>
                <button className={!draft.animations ? 'active' : ''} onClick={() => set({ animations: false })}>Ne</button>
              </div>
            </div>
            <div className="field">
              <label>Zrno (grain)</label>
              <div className="seg">
                <button className={draft.grain ? 'active' : ''} onClick={() => set({ grain: true })}>Da</button>
                <button className={!draft.grain ? 'active' : ''} onClick={() => set({ grain: false })}>Ne</button>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Velika slova naslova</label>
            <div className="seg">
              <button className={draft.headingCase === 'normal' ? 'active' : ''} onClick={() => set({ headingCase: 'normal' })}>Normalno</button>
              <button className={draft.headingCase === 'uppercase' ? 'active' : ''} onClick={() => set({ headingCase: 'uppercase' })}>VELIKA</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
