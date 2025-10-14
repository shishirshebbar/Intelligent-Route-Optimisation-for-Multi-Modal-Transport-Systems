import type { EventOut } from '../../types/api'
import { dt } from '../../utils/format'

export default function EventsFeed({ events }: { events: EventOut[] }) {
  if (!events?.length) {
    return <div className="text-sm text-gray-500">No recent events.</div>
  }
  return (
    <ul className="space-y-2">
      {events.map(ev => (
        <li key={ev.id} className="rounded-lg border p-3 bg-white flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">{ev.type}</div>
            <div className="text-sm text-gray-800">{JSON.stringify(ev.payload)}</div>
          </div>
          <div className="text-xs text-gray-400">{dt(ev.ts)}</div>
        </li>
      ))}
    </ul>
  )
}
