import React from 'react'

type KpiProps = {
  title: string
  value: string | number
  sub?: string
}

const KpiCard: React.FC<KpiProps> = ({ title, value, sub }) => (
  <div className="
    relative overflow-hidden rounded-2xl 
    border border-white/10 
    bg-slate-900/70 
    px-4 py-4
    shadow-lg shadow-black/40 
    backdrop-blur-xl
    text-white
  ">
    {/* decorative glow */}
    <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-white/5" />

    <div className="text-xs font-medium uppercase tracking-wide text-slate-300/70">
      {title}
    </div>

    <div className="mt-2 text-2xl font-semibold">{value}</div>

    {sub && (
      <div className="mt-1 text-[11px] text-slate-400/80">{sub}</div>
    )}
  </div>
)

export default function Kpis(props: {
  shipments: number
  locations: number
  lastEvent?: string
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard 
        title="Shipments" 
        value={props.shipments} 
      />
      
      <KpiCard 
        title="Locations" 
        value={props.locations} 
      />
      
      <KpiCard 
        title="Last Event" 
        value={
          props.lastEvent 
            ? new Date(props.lastEvent).toLocaleString() 
            : '—'
        } 
      />
    </div>
  )
}
