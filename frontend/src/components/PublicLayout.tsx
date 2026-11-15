import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { ScrollProgress } from './ScrollProgress'
import { useSite } from '../store'
import { api } from '../api'
import type { PageItem } from '../types'

export function PublicLayout() {
  const { loading, site } = useSite()
  const [pages, setPages] = useState<PageItem[]>([])

  useEffect(() => {
    api
      .get<PageItem[]>('/api/pages')
      .then(setPages)
      .catch(() => {})
  }, [])

  if (loading) {
    return (
      <div className="signal-boot" role="status" aria-live="polite">
        <span className="signal-boot-mark" aria-hidden="true">GEEKRANIUS</span>
        <span>{site.tagline || 'Koncertna fotografija'}</span>
        <span className="signal-boot-line" aria-hidden="true" />
      </div>
    )
  }

  return (
    <>
      <ScrollProgress />
      <Nav pages={pages} />
      <main className="page-enter">
        <Outlet />
      </main>
      <Footer pages={pages} />
    </>
  )
}
