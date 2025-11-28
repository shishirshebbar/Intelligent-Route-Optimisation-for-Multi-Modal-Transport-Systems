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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-300/80">
          {title}
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-100 shadow-sm shadow-black/40 backdrop-blur transition hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading && (
            <span className="h-3 w-3 animate-spin rounded-full border border-slate-300/60 border-t-transparent" />
          )}
          <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {/* Error */}
      {err && (
        <div className="mb-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {err}
        </div>
      )}

      {/* Empty */}
      {!err && !loading && events.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-slate-900/60 px-3 py-3 text-sm text-slate-400">
          No recent events.
        </div>
      )}

      {/* List */}
      <ul className="mt-1 space-y-2">
        {events.map(ev => (
          <li
            key={ev.id}
            className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-3 text-sm text-slate-100 shadow-sm shadow-black/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  {ev.type}
                  {ev.source ? ` · ${ev.source}` : ''}
                </div>
                <div className="mt-1 text-xs text-slate-200 break-all">
                  {previewPayload(ev.payload)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                {ev.severity && (
                  <span className={badgeClass(ev.severity)}>{ev.severity}</span>
                )}
                <div className="text-[11px] text-slate-400">
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
  const base =
    'inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium'
  if (sev === 'high') {
    return `${base} bg-red-500/15 text-red-200 border-red-400/60`
  }
  if (sev === 'moderate') {
    return `${base} bg-amber-500/15 text-amber-100 border-amber-300/70`
  }
  return `${base} bg-emerald-500/15 text-emerald-100 border-emerald-300/70`
}

function previewPayload(p: Record<string, unknown>) {
  const keys = [
    'location_name',
    'temperature_c',
    'precipitation_mm',
    'wind_speed_mps',
    'congestion_index',
    'avg_speed_kph',
    'note',
  ]
  const parts: string[] = []
  for (const k of keys) {
    if (p[k] !== undefined) parts.push(`${k}: ${String(p[k])}`)
  }
  if (parts.length === 0) return JSON.stringify(p)
  return parts.join(' · ')
}
