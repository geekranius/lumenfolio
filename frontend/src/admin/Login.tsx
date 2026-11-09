import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSite } from '../store'
import { api, auth } from '../api'

export function Login() {
  const { site, t } = useSite()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { token } = await api.post<{ token: string }>('/api/auth/login', { password })
      auth.set(token)
      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || 'Prijava nije uspjela')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="panel" style={{ width: '100%', maxWidth: 400 }}>
        <div className="brand" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <span className="brand-mark" />
          <span>{site.name}</span>
        </div>
        <h1 style={{ textAlign: 'center', fontSize: '1.6rem', marginBottom: 20 }}>{t('admin.signIn')}</h1>
        <form onSubmit={submit}>
          <div className="field">
            <label>{t('admin.password')}</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error ? <p style={{ color: '#e06a6a', fontSize: '0.88rem' }}>{error}</p> : null}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? '…' : t('admin.signInBtn')}
          </button>
        </form>
      </div>
    </div>
  )
}
