import React from 'react'
import type { EventOut, Severity } from '../../types/api'

export default function EventsFeed({ events }: { events: EventOut[] }) {
  if (!events?.length) return <div className="text-sm text-white/50">No recent events.</div>
  return (
    <ul className="space-y-2">
      {events.map(ev => (
        <li key={ev.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/60">
                {ev.type}{ev.source ? ` · ${ev.source}` : ''}
              </div>
              <div className="text-sm text-white/90 break-all">
                {previewPayload(ev.payload)}
              </div>
            </div>
            <div className="text-right">
              {ev.severity && (
                <span className={badgeClass(ev.severity)}>{ev.severity}</span>
              )}
              <div className="text-[11px] text-white/50 mt-1">
                {new Date(ev.ts).toLocaleString()}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function badgeClass(sev: Severity) {
  const base = 'inline-block text-[10px] px-2 py-0.5 rounded-full border'
  if (sev === 'high') return `${base} bg-red-50/20 text-red-300 border-red-400/30`
  if (sev === 'moderate') return `${base} bg-amber-50/20 text-amber-300 border-amber-400/30`
  return `${base} bg-emerald-50/20 text-emerald-300 border-emerald-400/30`
}

function previewPayload(p: Record<string, unknown>) {
  const keys = ['location_name','temperature_c','precipitation_mm','wind_speed_mps','congestion_index','avg_speed_kph','note']
  const parts: string[] = []
  for (const k of keys) if (p[k] !== undefined) parts.push(`${k}: ${String(p[k])}`)
  return parts.length ? parts.join(' · ') : JSON.stringify(p)
}
