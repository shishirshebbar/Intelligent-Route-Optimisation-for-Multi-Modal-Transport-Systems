import { AlertTriangle, Boxes, GitBranch, Leaf, MapPinned, MoveRight, TimerReset } from 'lucide-react'

type KpiProps = {
  title: string
  value: string | number
  sub?: string
  icon: typeof Boxes
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
}

const toneClass: Record<NonNullable<KpiProps['tone']>, string> = {
  neutral: 'text-[var(--accent-strong)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  success: 'text-[var(--ok)]',
}

function KpiCard({ title, value, sub, icon: Icon, tone = 'neutral' }: KpiProps) {
  return (
    <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">{title}</div>
          <div className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{value}</div>
          {sub && <div className="mt-1 text-xs text-[var(--text-dim)]">{sub}</div>}
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-3)] ${toneClass[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

function riskLabel(p?: number) {
  if (p === undefined) return undefined
  if (p > 0.6) return 'High risk'
  if (p > 0.3) return 'Moderate risk'
  return 'Low risk'
}

export default function Kpis(props: {
  shipments: number
  locations: number
  lastEvent?: string
  delayProb?: number
  expectedDelayMin?: number
  delayReductionPct?: number
  emissionsSavedPct?: number
  costChangePct?: number
  reroutesCount?: number
}) {
  return (
    <div className="grid items-start grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      <KpiCard title="Shipments" value={props.shipments} icon={Boxes} />
      <KpiCard title="Locations" value={props.locations} icon={MapPinned} />
      <KpiCard
        title="Last Event"
        value={props.lastEvent ? new Date(props.lastEvent).toLocaleString() : '--'}
        icon={GitBranch}
      />
      <KpiCard
        title="Delay Risk"
        value={props.delayProb !== undefined ? `${Math.round(props.delayProb * 100)}%` : '--'}
        sub={riskLabel(props.delayProb)}
        icon={AlertTriangle}
        tone={props.delayProb && props.delayProb > 0.6 ? 'danger' : props.delayProb && props.delayProb > 0.3 ? 'warning' : 'success'}
      />
      <KpiCard
        title="Expected Delay"
        value={props.expectedDelayMin !== undefined ? `${props.expectedDelayMin} min` : '--'}
        icon={TimerReset}
        tone={props.expectedDelayMin && props.expectedDelayMin > 30 ? 'warning' : 'neutral'}
      />
      {props.delayReductionPct !== undefined && (
        <KpiCard
          title="Delay Reduced"
          value={`${props.delayReductionPct}%`}
          sub="vs baseline"
          icon={MoveRight}
          tone="success"
        />
      )}
      {props.emissionsSavedPct !== undefined && (
        <KpiCard
          title="Emissions Saved"
          value={`${props.emissionsSavedPct}%`}
          sub="CO2 reduction"
          icon={Leaf}
          tone="success"
        />
      )}
      {props.costChangePct !== undefined && (
        <KpiCard
          title="Cost Change"
          value={`${props.costChangePct}%`}
          sub="optimised vs baseline"
          icon={GitBranch}
        />
      )}
      {props.reroutesCount !== undefined && (
        <KpiCard title="Reroutes" value={props.reroutesCount} sub="event-triggered" icon={Boxes} />
      )}
    </div>
  )
}
