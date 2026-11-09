import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="section" style={{ textAlign: 'center', paddingTop: 120 }}>
      <div className="container">
        <div className="eyebrow">404</div>
        <h1 className="display" style={{ margin: '12px 0 20px' }}>
          Stranica nije pronađena
        </h1>
        <p className="muted">Ova stranica ne postoji ili je premještena.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 24 }}>
          Na početnu
        </Link>
      </div>
    </section>
  )
}
