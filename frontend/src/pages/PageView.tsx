import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { Loading } from '../components/ui'
import { renderBody } from '../lib/render'
import { SignalPageHeader } from '../components/SignalPageHeader'
import type { PageItem } from '../types'

export function PageView() {
  const { slug } = useParams()
  const [page, setPage] = useState<PageItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .get<PageItem>(`/api/pages/${slug}`)
      .then(setPage)
      .catch(() => setPage(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <Loading />
  if (!page) return <div className="container section empty">Stranica nije pronađena.</div>

  return (
    <section className="signal-subpage signal-static-page section">
      <div className="container">
        <div className="prose">
          <SignalPageHeader code="INFO / 06" label="FIELD FILE" title={page.title} />
          {page.body ? renderBody(page.body) : null}
        </div>
      </div>
    </section>
  )
}
