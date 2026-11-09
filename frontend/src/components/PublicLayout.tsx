import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { api } from '../api'
import type { PageItem } from '../types'

export function PublicLayout() {
  const [pages, setPages] = useState<PageItem[]>([])

  useEffect(() => {
    api
      .get<PageItem[]>('/api/pages')
      .then(setPages)
      .catch(() => {})
  }, [])

  return (
    <>
      <Nav pages={pages} />
      <main>
        <Outlet />
      </main>
      <Footer pages={pages} />
    </>
  )
}
