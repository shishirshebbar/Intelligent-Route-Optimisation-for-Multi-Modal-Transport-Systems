import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  type LucideIcon,
  Map as MapIcon,
  RefreshCcw,
  Route,
  ShieldAlert,
  Waypoints,
} from 'lucide-react'
import api from '../api/client'
import { fetchEvents } from '../api/events'
import type {
  DynamicKpis,
  EventOut,
  LocationListResponse,
  LocationOut,
  PlanOut,
  RouteOut,
  RoutingRequest,
  ShipmentListResponse,
  ShipmentOut,
} from '../types/api'
import Map from '../components/Map/Map'
import Kpis from '../components/Kpis/kpis'
import EventsFeed from '../components/Events/EventsFeed'
import { kg, km, mins } from '../utils/format'
import DelayTrendChart from '../components/Charts/DelayTrendChart'
import DelayComparisonChart from '../components/Charts/DelayComparisonChart'
import EmissionsByModeChart from '../components/Charts/EmissionsByModeChart'
import ComputationTrace from '../components/Trace/ComputationTrace'

const panel = 'rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] flex flex-col'
const field =
  'h-10 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] shadow-none outline-none transition focus:border-[var(--accent-strong)]'

type ObjectivePresetKey = 'balanced' | 'fastest' | 'cheapest' | 'green'

const objectivePresets: Record<
  ObjectivePresetKey,
  { label: string; description: string; weights: { cost: number; time: number; co2e: number } }
> = {
  balanced: {
    label: 'Balanced',
    description: 'Keeps cost, time, and emissions in play together.',
    weights: { cost: 50, time: 30, co2e: 20 },
  },
  fastest: {
    label: 'Fastest',
    description: 'Prioritises travel time over cost and emissions.',
    weights: { cost: 10, time: 80, co2e: 10 },
  },
  cheapest: {
    label: 'Cheapest',
    description: 'Biases the optimiser toward lower operating cost.',
    weights: { cost: 80, time: 15, co2e: 5 },
  },
  green: {
    label: 'Green',
    description: 'Prefers lower emissions even if the trip takes longer.',
    weights: { cost: 20, time: 20, co2e: 60 },
  },
}

export default function Dashboard() {
  const [locations, setLocations] = useState<LocationOut[]>([])
  const [shipments, setShipments] = useState<ShipmentOut[]>([])
  const [shipmentsCount, setShipmentsCount] = useState(0)
  const [events, setEvents] = useState<EventOut[]>([])
  const [eventsErr, setEventsErr] = useState<string | null>(null)
  const [shipmentId, setShipmentId] = useState('')
  const [originId, setOriginId] = useState<number | ''>('')
  const [destId, setDestId] = useState<number | ''>('')
  const [mode, setMode] = useState<'road' | 'rail' | 'sea' | 'air' | 'transfer'>('road')
  const [route, setRoute] = useState<RouteOut | null>(null)
  const [isRouting, setIsRouting] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [plan, setPlan] = useState<PlanOut | null>(null)
  const [delayTrend, setDelayTrend] = useState<{ time: string; expected_delay_min: number }[]>([])
  const [dynamicKpis, setDynamicKpis] = useState<DynamicKpis | null>(null)
  const [tracePlaybackDone, setTracePlaybackDone] = useState(false)
  const [objectivePreset, setObjectivePreset] = useState<ObjectivePresetKey>('balanced')
  const [traceRunId, setTraceRunId] = useState(0)
  const [traceSnapshot, setTraceSnapshot] = useState<{
    shipmentId: string
    originName: string
    destinationName: string
    mode: string
    objectivePreset: string
    weights: { cost: number; time: number; co2e: number }
  } | null>(null)

  const lastEventTs = useMemo(() => events[0]?.ts, [events])
  const selectedShipment = useMemo(
    () => shipments.find(shipment => shipment.id === shipmentId) ?? null,
    [shipments, shipmentId]
  )
  const origin = useMemo(
    () => locations.find(location => location.id === originId) ?? null,
    [locations, originId]
  )
  const destination = useMemo(
    () => locations.find(location => location.id === destId) ?? null,
    [locations, destId]
  )
  const selectedObjective = objectivePresets[objectivePreset]

  const normalisedWeights = useMemo(() => {
    const weights = selectedObjective.weights
    const total = weights.cost + weights.time + weights.co2e
    if (total <= 0) {
      return { cost: 0.333, time: 0.333, co2e: 0.334 }
    }
    return {
      cost: Number((weights.cost / total).toFixed(3)),
      time: Number((weights.time / total).toFixed(3)),
      co2e: Number((weights.co2e / total).toFixed(3)),
    }
  }, [selectedObjective])

  useEffect(() => {
    ;(async () => {
      try {
        const [locRes, shipmentRes] = await Promise.all([
          api.get<LocationListResponse>('/network/locations'),
          api.get<ShipmentListResponse>('/shipments'),
        ])

        setLocations(locRes.data.data)
        setShipments(shipmentRes.data.data)
        setShipmentsCount(shipmentRes.data.total)

        if (shipmentRes.data.data.length > 0) {
          const defaultShipment = shipmentRes.data.data[0]
          setShipmentId(defaultShipment.id)
          setOriginId(defaultShipment.origin_id)
          setDestId(defaultShipment.destination_id)
        }
      } catch (e: any) {
        console.error('Failed to load initial data', e?.message)
      } finally {
        setIsLoadingInitial(false)
      }
    })()
  }, [])

  const loadEvents = async () => {
    try {
      setEventsErr(null)
      const evData = await fetchEvents({ limit: 30 })
      setEvents(evData)
    } catch (e: any) {
      setEventsErr(e?.message || 'Failed to load events')
    }
  }

  const loadPlanHistory = async () => {
    try {
      const plansRes = await api.get<PlanOut[]>('/plans', { params: { limit: 20 } })
      const history = [...plansRes.data]
        .filter(item => item.expected_delay_min !== null && item.expected_delay_min !== undefined)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(item => ({
          time: new Date(item.created_at).toLocaleTimeString(),
          expected_delay_min: item.expected_delay_min as number,
        }))
      setDelayTrend(history)
    } catch (e) {
      console.warn('Plan history not available')
    }
  }

  useEffect(() => {
    let timer: number | undefined
    ;(async () => {
      await Promise.all([loadEvents(), loadPlanHistory()])
      timer = window.setInterval(() => loadEvents().catch(() => {}), 60_000)
    })()

    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [])

  const handleShipmentChange = (nextShipmentId: string) => {
    setShipmentId(nextShipmentId)
    const shipment = shipments.find(item => item.id === nextShipmentId)
    if (shipment) {
      setOriginId(shipment.origin_id)
      setDestId(shipment.destination_id)
    }
  }

  const handleRoute = async () => {
    setRoute(null)
    setPlan(null)
    setDynamicKpis(null)
    setTracePlaybackDone(false)
    if (!selectedShipment || !origin || !destination) return

    const payload: RoutingRequest = {
      origins: [{ lat: origin.lat, lon: origin.lon }],
      destinations: [{ lat: destination.lat, lon: destination.lon }],
      origin_id: origin.id,
      destination_id: destination.id,
      modes: [mode],
      objective: normalisedWeights,
    }

    try {
      setIsRouting(true)
      setTraceSnapshot({
        shipmentId: selectedShipment.id,
        originName: origin.name,
        destinationName: destination.name,
        mode,
        objectivePreset: selectedObjective.label,
        weights: normalisedWeights,
      })
      setTraceRunId(current => current + 1)

      const routeRes = await api.post<RouteOut>('/routing/multimodal', payload)
      setRoute(routeRes.data)
      setDynamicKpis(routeRes.data.kpis)

      const planRes = await api.post<PlanOut>('/plans', {
        shipment_ids: [selectedShipment.id],
        objective: normalisedWeights,
        selected_mode: mode,
        total_distance_km: routeRes.data.distance_km,
        total_time_min: routeRes.data.time_min,
        total_co2e_kg: routeRes.data.co2e_kg,
        modes: [mode],
      })

      setPlan(planRes.data)
      await loadPlanHistory()
    } catch (e: any) {
      console.error('Failed to compute route flow', e?.message)
    } finally {
      setIsRouting(false)
    }
  }

  return (
    <div className="space-y-4">
      <motion.header
        className={`${panel} grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto]`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Operations overview
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Network Control Console</h1>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[var(--ok)]" />
              Road routing active
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
            Plan a shipment route, inspect network activity, and compare operational impact
            without leaving the console.
          </p>
        </div>

        <div className="grid items-start gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          <StatusTile label="Shipments loaded" value={String(shipmentsCount)} icon={Route} />
          <StatusTile label="Locations tracked" value={String(locations.length)} icon={Waypoints} />
          <StatusTile
            label="Latest event"
            value={lastEventTs ? new Date(lastEventTs).toLocaleTimeString() : '--'}
            icon={Activity}
          />
        </div>
      </motion.header>

      <section className={`${panel} px-5 py-4`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
              Network snapshot
            </div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">
              Core KPIs update after route computation and event polling.
            </div>
          </div>
        </div>
        <Kpis
          shipments={shipmentsCount}
          locations={locations.length}
          lastEvent={lastEventTs}
          delayProb={plan?.delay_prob ?? undefined}
          expectedDelayMin={plan?.expected_delay_min ?? undefined}
          delayReductionPct={dynamicKpis?.delay_reduction_pct}
          emissionsSavedPct={dynamicKpis?.emissions_saved_pct}
          costChangePct={dynamicKpis?.cost_change_pct}
        />
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[420px_minmax(0,1fr)_360px]">
        <motion.section
          className={`${panel} overflow-hidden`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <PanelHeader
            title="Route planner"
            subtitle="Select shipment details and compute a route using your chosen weighting profile."
            icon={ArrowRightLeft}
          />

          <div className="space-y-4 px-5 py-4">
            {isLoadingInitial && (
              <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                Loading shipments and network locations...
              </div>
            )}

            <Field label="Shipment">
              <select
                className={field}
                value={shipmentId}
                onChange={e => handleShipmentChange(e.target.value)}
              >
                <option value="">Select shipment...</option>
                {shipments.map(shipment => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.id} ({shipment.weight_kg} kg, P{shipment.priority})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Origin">
                <select
                  className={field}
                  value={originId}
                  onChange={e => setOriginId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select origin...</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.type})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Destination">
                <select
                  className={field}
                  value={destId}
                  onChange={e => setDestId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select destination...</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.type})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Transport mode">
              <select
                className={field}
                value={mode}
                onChange={e => setMode(e.target.value as typeof mode)}
              >
                <option value="road">Road</option>
                <option value="rail">Rail</option>
                <option value="sea">Sea</option>
                <option value="air">Air</option>
              </select>
            </Field>

            <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                Optimization preference
              </div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">
                This is not shipment data. It tells the optimiser whether to lean toward speed,
                cost, or emissions for the selected route.
              </div>

              <div className="mt-4">
                <Field label="Preset">
                  <select
                    className={field}
                    value={objectivePreset}
                    onChange={e => setObjectivePreset(e.target.value as ObjectivePresetKey)}
                  >
                    {Object.entries(objectivePresets).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-3 rounded-md border border-[var(--line-soft)] bg-[var(--surface-3)] px-4 py-3">
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {selectedObjective.label}
                </div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">
                  {selectedObjective.description}
                </div>
              </div>

              <div className="mt-4 grid items-start gap-2 sm:grid-cols-3">
                <MetricCard label="Cost" value={normalisedWeights.cost.toFixed(3)} />
                <MetricCard label="Time" value={normalisedWeights.time.toFixed(3)} />
                <MetricCard label="CO2e" value={normalisedWeights.co2e.toFixed(3)} />
              </div>
            </div>

            <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                Current selection
              </div>
              <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                <KeyValue label="Shipment" value={selectedShipment?.id ?? '--'} />
                <KeyValue label="Origin" value={origin?.name ?? '--'} />
                <KeyValue label="Destination" value={destination?.name ?? '--'} />
                <KeyValue label="Mode" value={mode} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--accent-soft)] bg-[var(--accent-muted)] px-4 text-sm font-medium text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)] hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleRoute}
                disabled={!shipmentId || !originId || !destId || isRouting}
              >
                {isRouting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border border-current border-r-transparent" />
                ) : (
                  <Route className="h-4 w-4" />
                )}
                {isRouting ? 'Computing route...' : 'Compute route'}
              </button>

              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 text-sm text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                onClick={loadEvents}
                title="Refresh events"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh events
              </button>
            </div>

            {eventsErr && (
              <div className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger-muted)] px-3 py-2 text-sm text-[var(--danger)]">
                {eventsErr}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          className={`${panel} overflow-hidden`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <PanelHeader
            title="Map and route summary"
            subtitle="Verify the selected path against network locations and inspect the latest computed metrics."
            icon={MapIcon}
          />

          <div className="border-b border-[var(--line-soft)] px-5 py-3 text-sm text-[var(--text-secondary)]">
            {origin && destination ? (
              <span>
                {origin.name} to {destination.name}
              </span>
            ) : (
              <span>Select a shipment to view its route context.</span>
            )}
          </div>

          <div className="border-b border-[var(--line-soft)] bg-[var(--surface-2)]">
            <div className="relative">
              <Map locations={locations} route={tracePlaybackDone ? route : null} />
              {!tracePlaybackDone && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[var(--surface-1)]/15 backdrop-blur-[1px]">
                  <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)]/90 px-4 py-2 text-sm text-[var(--text-secondary)] shadow-sm">
                    Map is live. Route overlay unlocks after the trace completes.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4">
            <AnimatePresence mode="wait">
              {tracePlaybackDone && route ? (
                <motion.div
                  key="route-summary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4"
                >
                  <MetricCard label="Distance" value={km(route.distance_km)} />
                  <MetricCard label="Travel time" value={mins(route.time_min)} />
                  <MetricCard label="CO2e" value={kg(route.co2e_kg)} />
                  <MetricCard
                    label="Expected delay"
                    value={
                      plan?.expected_delay_min !== null && plan?.expected_delay_min !== undefined
                        ? mins(plan.expected_delay_min)
                        : '--'
                    }
                  />
                  </motion.div>
              ) : tracePlaybackDone ? (
                <motion.div
                  key="route-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-md border border-dashed border-[var(--line-strong)] px-4 py-6 text-sm text-[var(--text-dim)]"
                >
                  Compute a route to populate the route summary and compare route metrics.
                </motion.div>
              ) : (
                <motion.div
                  key="route-lock"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-md border border-dashed border-[var(--line-strong)] px-4 py-6 text-sm text-[var(--text-dim)]"
                >
                  The route summary is locked until the trace finishes.
                </motion.div>
              )}
            </AnimatePresence>

            {tracePlaybackDone && route && (
              <div className="mt-4 grid items-start gap-3 md:grid-cols-2">
                <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                    Route source
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-secondary)]">
                    {route.source ?? 'Routing service'}
                  </div>
                </div>
                <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                    Weight profile
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-secondary)]">
                    {selectedObjective.label} | C {normalisedWeights.cost.toFixed(3)} | T {normalisedWeights.time.toFixed(3)} | E {normalisedWeights.co2e.toFixed(3)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          className={`${panel} overflow-hidden`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <PanelHeader
            title="Event activity"
            subtitle="Recent operational events pulled from the event feed."
            icon={ShieldAlert}
          />
            <div className="events-scroll h-[760px] overflow-y-auto px-5 py-4">
            <EventsFeed limit={30} pollMs={60_000} onLoaded={setEvents} />
          </div>
        </motion.section>
      </section>

      <motion.section
        className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
      >
        <div className="grid gap-4">
          <div className={`${panel} overflow-hidden`}>
            <PanelHeader
              title="Computation trace"
              subtitle="Replay the backend pipeline in slow motion using the live inputs and responses from this run."
              icon={Activity}
            />
            <div className="px-5 py-4">
              <ComputationTrace
                runId={traceRunId}
                isRouting={isRouting}
                snapshot={traceSnapshot}
                route={route}
                plan={plan}
                stepDelayMs={1100}
                onComplete={() => setTracePlaybackDone(true)}
              />
            </div>
          </div>

          <div className={`${panel} overflow-hidden`}>
            <PanelHeader
              title="Delay monitoring"
              subtitle="Predicted delay values are loaded from persisted plans, so the trend survives page refreshes."
              icon={BarChart3}
            />
            <div className="px-5 py-4">
              {tracePlaybackDone ? (
                <div className="mb-4 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                        Delay prediction source
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-secondary)]">
                        {plan?.delay_source === 'ml'
                          ? `Model-backed${plan.delay_model_version ? ` (${plan.delay_model_version})` : ''}`
                          : plan?.delay_source === 'fallback'
                            ? `Fallback estimate${plan?.delay_model_version ? ` (${plan.delay_model_version})` : ''}`
                            : 'Compute a route to inspect delay provenance.'}
                      </div>
                    </div>
                    {plan?.delay_source === 'ml' ? (
                      <span className="rounded-full border border-[var(--ok)]/50 bg-[var(--ok-muted)] px-3 py-1 text-xs font-medium text-[var(--ok)]">
                        ML
                      </span>
                    ) : plan?.delay_source === 'fallback' ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--warning)]/50 bg-[var(--warning-muted)] px-3 py-1 text-xs font-medium text-[var(--warning)]">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Fallback
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--line-soft)] px-3 py-1 text-xs text-[var(--text-dim)]">
                        Unknown
                      </span>
                    )}
                  </div>
                  {plan?.delay_source === 'fallback' && (
                    <div className="mt-3 text-sm text-[var(--text-dim)]">
                      The ML service was unavailable for this plan, so the backend used its built-in fallback estimator.
                    </div>
                  )}
                </div>
              ) : (
                <LockedResults label="Delay provenance will appear after the trace finishes." />
              )}
              {tracePlaybackDone ? (
                <DelayTrendChart data={delayTrend} />
              ) : (
                <LockedResults label="Delay trend will appear after the trace finishes." />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {tracePlaybackDone ? (
            <DelayComparisonChart
              baselineDelayMin={route?.comparison.baseline_delay_min}
              optimisedDelayMin={route?.comparison.selected_delay_min}
            />
          ) : (
            <LockedResults label="Delay comparison will unlock after the run completes." />
          )}
          {tracePlaybackDone ? (
            <EmissionsByModeChart
              baselineRoadEmissions={route?.comparison.baseline_co2e_kg}
              optimisedModeEmissions={route?.co2e_kg}
            />
          ) : (
            <LockedResults label="Emissions comparison will unlock after the run completes." />
          )}
        </div>
      </motion.section>
    </div>
  )
}

function LockedResults({ label }: { label: string }) {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-md border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] px-4 py-6 text-center text-sm text-[var(--text-dim)]">
      {label}
    </div>
  )
}

function PanelHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string
  subtitle: string
  icon: LucideIcon
}) {
  return (
    <div className="border-b border-[var(--line-soft)] px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--accent-strong)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}

function StatusTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="h-full rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-3">
      <div className="flex items-center gap-2 text-[var(--text-faint)]">
        <Icon className="h-4 w-4 text-[var(--accent-strong)]" />
        <span className="text-[11px] uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
        {label}
      </div>
      {children}
    </label>
  )
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] py-2 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className="text-right text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-full rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</div>
      <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}
