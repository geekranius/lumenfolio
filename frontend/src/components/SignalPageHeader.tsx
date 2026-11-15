import type { ReactNode } from 'react'

export function SignalPageHeader({
  code,
  label,
  title,
  description,
  aside,
}: {
  code: string
  label: string
  title: string
  description?: string
  aside?: ReactNode
}) {
  return (
    <header className="signal-page-header">
      <div className="signal-page-header-main">
        <span className="signal-section-code">{code}</span>
        <span className="signal-page-label"><i />{label}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {aside ? <div className="signal-page-aside">{aside}</div> : null}
    </header>
  )
}
