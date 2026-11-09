import { useEffect, useMemo, useState } from 'react'
import { useSite } from '../store'
import { api } from '../api'
import { Loading, Empty } from '../components/ui'
import type { EventItem } from '../types'
import { formatDate } from '../lib/image'

function EventList({ events, locale }: { events: EventItem[]; locale: string }) {
  const groups = useMemo(() => {
    const map = new Map<string, EventItem[]>()
    for (const e of events) {
      const d = new Date(e.start_date)
      const key = d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'hr-HR', { month: 'long', year: 'numeric' })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return [...map.entries()]
  }, [events, locale])

  return (
    <>
      {groups.map(([month, list]) => (
        <div className="event-group" key={month}>
          <h3>{month}</h3>
          {list.map((e) => {
            const d = new Date(e.start_date)
            return (
              <div className="event-row" key={e.id}>
                <div className="event-date-box">
                  <span className="d">{d.getDate()}</span>
                  <span className="m">
                    {d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'hr-HR', { month: 'short' })}
                  </span>
                </div>
                <div className="info">
                  <h4>{e.title}</h4>
                  <div className="loc">
                    {e.time ? `${e.time} · ` : ''}
                    {e.location || ''}
                    {e.description ? ` — ${e.description}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}

export function Events() {
  const { t, locale } = useSite()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<EventItem[]>('/api/events')
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = events.filter((e) => new Date(e.start_date) >= today).sort((a, b) => a.start_date.localeCompare(b.start_date))
  const past = events.filter((e) => new Date(e.start_date) < today).sort((a, b) => b.start_date.localeCompare(a.start_date))

  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Kalendar</div>
            <h2>{t('nav.events')}</h2>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : events.length === 0 ? (
          <Empty label={t('common.empty')} />
        ) : (
          <>
            {upcoming.length > 0 ? (
              <>
                <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  {t('events.upcoming')}
                </h3>
                <EventList events={upcoming} locale={locale} />
              </>
            ) : null}
            {past.length > 0 ? (
              <>
                <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
                  {t('events.past')}
                </h3>
                <EventList events={past} locale={locale} />
              </>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
