import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Upload, Images, CalendarDays, FileText, File, Settings, LogOut, ExternalLink } from 'lucide-react'
import { auth } from '../api'
import { useSite } from '../store'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!auth.isAuthed()) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export function AdminLayout() {
  const { site, t } = useSite()
  const navigate = useNavigate()

  const links = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.dashboard') },
    { to: '/admin/upload', icon: Upload, label: t('admin.upload') },
    { to: '/admin/galleries', icon: Images, label: t('admin.galleries') },
    { to: '/admin/events', icon: CalendarDays, label: t('admin.events') },
    { to: '/admin/posts', icon: FileText, label: t('admin.posts') },
    { to: '/admin/pages', icon: File, label: t('admin.pages') },
    { to: '/admin/settings', icon: Settings, label: t('admin.settings') },
  ]

  const logout = () => {
    auth.set(null)
    navigate('/admin/login')
  }

  return (
    <div className="admin">
      <aside className="admin-side">
        <NavLink to="/admin/dashboard" className="brand" style={{ fontSize: '1.3rem' }}>
          <span className="brand-mark" />
          <span>Admin</span>
        </NavLink>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            <l.icon size={18} />
            <span className="link-label">{l.label}</span>
          </NavLink>
        ))}
        <a className="admin-link" href="/" target="_blank" rel="noopener noreferrer" style={{ marginTop: 'auto' }}>
          <ExternalLink size={18} />
          <span className="link-label">{t('admin.viewSite')}</span>
        </a>
        <button className="admin-link" onClick={logout} style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}>
          <LogOut size={18} />
          <span className="link-label">{t('admin.logout')}</span>
        </button>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}
