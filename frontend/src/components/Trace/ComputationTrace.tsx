import { useEffect, useMemo, useState } from 'react'
import { Activity, Brain, CheckCircle2, Clock3, Database, Map, PlayCircle, Route, Server, Waves } from 'lucide-react'
import type { PlanOut, RouteOut } from '../../types/api'
import { kg, km, mins } from '../../utils/format'

type TraceSnapshot = {
  shipmentId: string
  originName: string
  destinationName: string
  mode: string
  objectivePreset: string
  weights: {
    cost: number
    time: number
    co2e: number
  }
}

type Props = {
  runId: number
  isRouting: boolean
  snapshot: TraceSnapshot | null
  route: RouteOut | null
  plan: PlanOut | null
  stepDelayMs?: number
  onComplete?: () => void
}

export default function ComputationTrace({
  runId,
  isRouting,
  snapshot,
  route,
  plan,
  stepDelayMs,
  onComplete,
}: Props) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [hasNotifiedComplete, setHasNotifiedComplete] = useState(false)

  const steps = useMemo(() => {
    if (!snapshot) return []

    const routeReady = Boolean(route)
    const planReady = Boolean(plan)
    const delayContext = plan?.delay_context

    return [
      {
        key: 'inputs',
        title: 'Collect operator inputs',
        icon: PlayCircle,
        ready: true,
        detail: `${snapshot.shipmentId} | ${snapshot.originName} -> ${snapshot.destinationName} | ${snapshot.mode}`,
      },
      {
        key: 'objective',
        title: 'Normalise route objective',
        icon: Activity,
        ready: true,
        detail: `${snapshot.objectivePreset} profile | cost ${snapshot.weights.cost.toFixed(3)}, time ${snapshot.weights.time.toFixed(3)}, CO2e ${snapshot.weights.co2e.toFixed(3)}`,
      },
      {
        key: 'routing-request',
        title: 'Call multimodal routing service',
        icon: Server,
        ready: routeReady,
        detail: routeReady
          ? `Routing response received from ${route?.source ?? 'service'}`
          : 'Computing route against the selected network',
      },
      {
        key: 'route-aggregation',
        title: 'Aggregate route legs and metrics',
        icon: Route,
        ready: routeReady,
        detail: route
          ? `${route.legs.length} leg(s) | ${km(route.distance_km)} | ${mins(route.time_min)} | ${kg(route.co2e_kg)}`
          : 'Waiting for distance, time, and emissions totals',
      },
      {
        key: 'plan-create',
        title: 'Create plan record',
        icon: Database,
        ready: planReady,
        detail: plan ? `${plan.id} stored with status ${plan.status}` : 'Persisting plan and shipment context',
      },
      {
        key: 'environment',
        title: 'Assemble delay-model features',
        icon: Waves,
        ready: Boolean(delayContext?.features),
        detail: delayContext?.features
          ? `distance ${String(delayContext.features.distance_km)} km | baseline ${String(delayContext.features.baseline_time_min)} min | congestion ${String(delayContext.features.congestion_index)}`
          : 'Gathering shipment, route, weather, and traffic inputs',
      },
      {
        key: 'ml-delay',
        title: 'Invoke delay prediction service',
        icon: Brain,
        ready: planReady,
        detail: plan
          ? `${plan.delay_source === 'ml' ? 'ML service' : 'Fallback estimator'}${plan.delay_model_version ? ` (${plan.delay_model_version})` : ''} | ${plan.delay_prob !== null ? `${Math.round(plan.delay_prob * 100)}% risk` : '--'}`
          : 'Waiting for delay service response',
      },
      {
        key: 'final-result',
        title: 'Return final result to console',
        icon: CheckCircle2,
        ready: planReady && routeReady,
        detail:
          route && plan
            ? `ETA ${mins(route.time_min)} | expected delay ${plan.expected_delay_min !== null ? mins(plan.expected_delay_min) : '--'}`
            : 'Preparing final route summary and delay output',
      },
    ]
  }, [snapshot, route, plan])

  useEffect(() => {
    if (!snapshot) {
      setRevealedCount(0)
      setHasNotifiedComplete(false)
      return
    }

    setRevealedCount(1)
    setHasNotifiedComplete(false)

    const timer = window.setInterval(() => {
      setRevealedCount(current => {
        if (current >= steps.length) {
          window.clearInterval(timer)
          return current
        }
        return current + 1
      })
    }, stepDelayMs ?? 900)

    return () => window.clearInterval(timer)
  }, [runId, snapshot, steps.length, stepDelayMs])

  useEffect(() => {
    if (!snapshot || !route || !plan) return
    if (revealedCount < steps.length) return
    if (hasNotifiedComplete) return

    setHasNotifiedComplete(true)
    onComplete?.()
  }, [snapshot, route, plan, revealedCount, steps.length, hasNotifiedComplete, onComplete])

  if (!snapshot) {
    return (
      <div className="rounded-md border border-dashed border-[var(--line-strong)] px-4 py-6 text-sm text-[var(--text-dim)]">
        Compute a route to replay the backend pipeline in slow motion.
      </div>
    )
  }

  const visibleSteps = steps.slice(0, revealedCount)
  const activeIndex = visibleSteps.findIndex(step => !step.ready)

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        {isRouting
          ? 'The console is replaying the backend pipeline step by step.'
          : route && plan && revealedCount >= steps.length
            ? 'The run is complete. Results are now being revealed.'
            : 'The run is still playing. Results stay hidden until the trace finishes.'}
      </div>
      {visibleSteps.map((step, index) => {
        const Icon = step.icon
        const isActive = !step.ready && (activeIndex === index || (activeIndex === -1 && isRouting))
        const isComplete = step.ready
        return (
          <div
            key={step.key}
            className={`rounded-md border px-4 py-3 transition ${
              isComplete
                ? 'border-[var(--ok)]/30 bg-[var(--ok-muted)]'
                : isActive
                  ? 'border-[var(--accent-soft)] bg-[var(--accent-muted)]'
                  : 'border-[var(--line-soft)] bg-[var(--surface-2)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
                  isComplete
                    ? 'border-[var(--ok)]/40 text-[var(--ok)]'
                    : isActive
                      ? 'border-[var(--accent-soft)] text-[var(--accent-strong)]'
                      : 'border-[var(--line-soft)] text-[var(--text-dim)]'
                }`}
              >
                {isActive ? <Clock3 className="h-4 w-4 animate-pulse" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{step.title}</div>
                  <span className="rounded-full border border-[var(--line-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                    {isComplete ? 'done' : isActive ? 'running' : 'queued'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">{step.detail}</div>
              </div>
            </div>
          </div>
        )
      })}
      {plan?.delay_context?.features && (
        <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
            <Map className="h-4 w-4 text-[var(--accent-strong)]" />
            Delay feature snapshot
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(plan.delay_context.features).map(([key, value]) => (
              <div key={key} className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-3)] px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">{key}</div>
                <div className="mt-1 text-sm text-[var(--text-primary)]">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
