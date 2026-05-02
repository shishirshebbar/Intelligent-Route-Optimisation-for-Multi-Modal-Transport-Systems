import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import api from '../../api/client'
import type { EventOut, EventType, Severity } from '../../types/api'

type Props = {
  title?: string
  filterType?: EventType
  filterSource?: string
  filterSeverity?: Severity
  limit?: number
  pollMs?: number
  onLoaded?: (events: EventOut[]) => void
}

export default function EventsFeed({
  title = 'Recent Events',
  filterType,
  filterSource,
  filterSeverity,
  limit = 30,
  pollMs = 60_000,
  onLoaded,
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
      onLoaded?.(res.data)
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
  }, [pollMs, JSON.stringify(params), onLoaded])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">{title}</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">Polling interval: 60 seconds</div>
        </div>
        <button
          onClick={load}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-xs text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-r-transparent" />
          ) : (
            <RefreshCcw className="h-3.5 w-3.5" />
          )}
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {err && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-[var(--danger)]/50 bg-[var(--danger-muted)] px-3 py-2 text-sm text-[var(--danger)]">
          <AlertTriangle className="h-4 w-4" />
          {err}
        </div>
      )}

      {!err && !loading && events.length === 0 && (
        <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text-dim)]">
          No recent events.
        </div>
      )}

      <ul className="space-y-3">
        {events.map(ev => (
          <li
            key={ev.id}
            className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                    {ev.type}
                  </span>
                  {ev.source && (
                    <span className="rounded-full border border-[var(--line-soft)] px-2 py-0.5 text-[10px] text-[var(--text-dim)]">
                      {ev.source}
                    </span>
                  )}
                </div>
                <div className="mt-2 break-words text-sm leading-6 text-[var(--text-secondary)]">
                  {previewPayload(ev.payload)}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                {ev.severity && <span className={badgeClass(ev.severity)}>{ev.severity}</span>}
                <div className="text-[11px] text-[var(--text-dim)]">
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
  const base = 'inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]'
  if (sev === 'high') {
    return `${base} border-[var(--danger)]/50 bg-[var(--danger-muted)] text-[var(--danger)]`
  }
  if (sev === 'moderate') {
    return `${base} border-[var(--warning)]/50 bg-[var(--warning-muted)] text-[var(--warning)]`
  }
  return `${base} border-[var(--ok)]/50 bg-[var(--ok-muted)] text-[var(--ok)]`
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
  return parts.join(' | ')
}
