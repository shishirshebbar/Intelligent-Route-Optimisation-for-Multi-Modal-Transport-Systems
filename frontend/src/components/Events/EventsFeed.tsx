import React, { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import type { EventOut, EventType, Severity } from '../../types/api'

type Props = {
  title?: string
  filterType?: EventType
  filterSource?: string
  filterSeverity?: Severity
  limit?: number
  pollMs?: number
}

export default function EventsFeed({
  title = 'Recent Events',
  filterType,
  filterSource,
  filterSeverity,
  limit = 30,
  pollMs = 60_000,
}: Props) {
  const [events, setEvents] = useState<EventOut[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const params = useMemo(
    () => ({ type: filterType, source: filterSource, severity: filterSeverity, limit }),
    [filterType, filterSource, filterSeverity, limit]
  )

  const load = async () => {
    try {
      setLoading(true)
      setErr(null)
      const res = await api.get<EventOut[]>('/events', { params })
      setEvents(res.data)
    } catch (e: any) {
      setErr(e?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

useEffect(() => {
  let t: number | undefined

  ;(async () => {
    await load()
    t = window.setInterval(() => {
      load().catch(() => {})
    }, pollMs)
  })()

  return () => {
    if (t !== undefined) {
      window.clearInterval(t)
    }
  }
}, [pollMs, JSON.stringify(params)])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">{title}</div>
        <button
          onClick={load}
          className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {err && (
        <div className="text-xs text-red-600 mb-2 border border-red-200 bg-red-50 p-2 rounded">
          {err}
        </div>
      )}

      {!err && !loading && events.length === 0 && (
        <div className="text-sm text-gray-400">No recent events.</div>
      )}

      <ul className="space-y-2">
        {events.map(ev => (
          <li key={ev.id} className="rounded-lg border p-3 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  {ev.type}{ev.source ? ` · ${ev.source}` : ''}
                </div>
                <div className="text-sm text-gray-800 break-all">
                  {previewPayload(ev.payload)}
                </div>
              </div>
              <div className="text-right">
                {ev.severity && (
                  <span className={badgeClass(ev.severity)}>{ev.severity}</span>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(ev.ts).toLocaleString()}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function badgeClass(sev: Severity) {
  const base = 'inline-block text-[10px] px-2 py-0.5 rounded-full border'
  if (sev === 'high') return `${base} bg-red-50 text-red-700 border-red-200`
  if (sev === 'moderate') return `${base} bg-amber-50 text-amber-700 border-amber-200`
  return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`
}

function previewPayload(p: Record<string, unknown>) {
  const keys = ['location_name','temperature_c','precipitation_mm','wind_speed_mps','congestion_index','avg_speed_kph','note']
  const parts: string[] = []
  for (const k of keys) {
    if (p[k] !== undefined) parts.push(`${k}: ${String(p[k])}`)
  }
  if (parts.length === 0) return JSON.stringify(p)
  return parts.join(' · ')
}
