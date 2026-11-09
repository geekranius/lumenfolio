import type { ReactNode } from 'react'
import { Camera } from 'lucide-react'

export function Loading() {
  return <div className="loading-spin" aria-label="loading" />
}

export function Empty({ label = '' }: { label?: string }) {
  return (
    <div className="empty">
      <div className="icon">
        <Camera size={40} />
      </div>
      <p>{label}</p>
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint ? <div className="muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>{hint}</div> : null}
    </div>
  )
}
