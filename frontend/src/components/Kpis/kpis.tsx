import React from "react"

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

function riskLabel(p?: number) {
  if (p === undefined) return undefined
  if (p > 0.6) return "High"
  if (p > 0.3) return "Medium"
  return "Low"
}

export default function Kpis(props: {
  shipments: number
  locations: number
  lastEvent?: string
  delayProb?: number
  expectedDelayMin?: number
  // STEP-5.4 Evaluation KPIs
  delayReductionPct?: number
  emissionsSavedPct?: number
  costChangePct?: number
  reroutesCount?: number
}) {
  console.log("KPIS PROPS:", {
    delayProb: props.delayProb,
    expectedDelayMin: props.expectedDelayMin,
  })
  return (
    
   <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-9 gap-4">

      <KpiCard title="Shipments" value={props.shipments} />
      <KpiCard title="Locations" value={props.locations} />
      <KpiCard
        title="Last Event"
        value={
          props.lastEvent
            ? new Date(props.lastEvent).toLocaleString()
            : "—"
        }
      />
      <KpiCard
        title="Delay Risk"
        value={
          props.delayProb !== undefined
            ? `${Math.round(props.delayProb * 100)}%`
            : "—"
        }
        sub={riskLabel(props.delayProb)}
      />
      <KpiCard
        title="Expected Delay"
        value={
          props.expectedDelayMin !== undefined
            ? `${props.expectedDelayMin} min`
            : "—"
        }
      />
      {props.delayReductionPct !== undefined && (
  <KpiCard
    title="Delay Reduced"
    value={`${props.delayReductionPct}%`}
    sub="vs baseline"
  />
)}

{props.emissionsSavedPct !== undefined && (
  <KpiCard
    title="Emissions Saved"
    value={`${props.emissionsSavedPct}%`}
    sub="CO₂ reduction"
  />
)}

{props.costChangePct !== undefined && (
  <KpiCard
    title="Cost Change"
    value={`${props.costChangePct}%`}
    sub="optimised vs baseline"
  />
)}

{props.reroutesCount !== undefined && (
  <KpiCard
    title="Reroutes"
    value={props.reroutesCount}
    sub="event-triggered"
  />
)}

    </div>
  )
}
