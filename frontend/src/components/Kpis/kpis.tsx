import React from 'react'

type KpiProps = {
  title: string
  value: string | number
  sub?: string
}

const KpiCard: React.FC<KpiProps> = ({ title, value, sub }) => (
  <div className="rounded-xl border p-4 shadow-sm bg-white">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
)

export default function Kpis(props: {
  shipments: number
  locations: number
  lastEvent?: string
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <KpiCard title="Shipments" value={props.shipments} />
      <KpiCard title="Locations" value={props.locations} />
      <KpiCard title="Last Event" value={props.lastEvent ? new Date(props.lastEvent).toLocaleString() : '—'} />
    </div>
  )
}
