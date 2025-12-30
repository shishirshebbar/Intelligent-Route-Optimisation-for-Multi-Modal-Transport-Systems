import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import type { LocationListResponse, ShipmentListResponse, RouteOut, EventOut } from '../types/api'
import type { LocationOut, RoutingRequest } from '../types/api'
import Map from '../components/Map/Map'
import Kpis from '../components/Kpis/kpis'
import EventsFeed from '../components/Events/EventsFeed'
import { km, mins, kg } from '../utils/format'
import type { PlanOut } from '../types/api'
import DelayTrendChart from '../components/Charts/DelayTrendChart'

export default function Dashboard() {
  const [locations, setLocations] = useState<LocationOut[]>([])
  const [shipmentsCount, setShipmentsCount] = useState(0)
  const [events, setEvents] = useState<EventOut[]>([])
  const [eventsErr, setEventsErr] = useState<string | null>(null)
  const [originId, setOriginId] = useState<number | ''>('')
  const [destId, setDestId] = useState<number | ''>('')
  const [mode, setMode] = useState<'road' | 'rail' | 'sea' | 'air' | 'transfer'>('road')
  const [route, setRoute] = useState<RouteOut | null>(null)
  const [isRouting, setIsRouting] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [plan, setPlan] = useState<PlanOut | null>(null)
const [delayTrend, setDelayTrend] = useState<
  { time: string; expected_delay_min: number }[]
>([])

  const lastEventTs = useMemo(() => events[0]?.ts, [events])

  // initial data (locations, shipments)
  useEffect(() => {
    ;(async () => {
      try {
        const locRes = await api.get<LocationListResponse>('/network/locations')
        setLocations(locRes.data.data)
      } catch (e: any) {
        console.error('Failed to load locations', e?.message)
      }

      try {
        const shpRes = await api.get<ShipmentListResponse>('/shipments')
        setShipmentsCount(shpRes.data.total)
      } catch (e: any) {
        console.error('Failed to load shipments', e?.message)
      } finally {
        setIsLoadingInitial(false)
      }
    })()
  }, [])

  // events: fetch + poll
  const loadEvents = async () => {
    try {
      setEventsErr(null)
      // request most-recent first (your backend already orders DESC); just cap the size
      const evRes = await api.get<EventOut[]>('/events', { params: { limit: 30 } })
      setEvents(evRes.data)
    } catch (e: any) {
      setEventsErr(e?.message || 'Failed to load events')
    }
  }

  useEffect(() => {
    let timer: number | undefined
    ;(async () => {
      await loadEvents()
      // Poll every 60s; tune if you like
      timer = window.setInterval(() => loadEvents().catch(() => {}), 60_000)
    })()
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [])

  const handleRoute = async () => {
    setRoute(null)
    const o = locations.find(l => l.id === originId)
    const d = locations.find(l => l.id === destId)
    if (!o || !d) return

    const payload: RoutingRequest = {
      origins: [{ lat: o.lat, lon: o.lon }],
      destinations: [{ lat: d.lat, lon: d.lon }],
      modes: [mode],
      objective: { cost: 0.5, time: 0.3, co2e: 0.2 }
    }

    try {
  setIsRouting(true)

  // 1️⃣ Compute route
  const res = await api.post<RouteOut>('/routing/multimodal', payload)
  setRoute(res.data)

  // 2️⃣ Create plan → get ML delay prediction
  try {
    const planRes = await api.post<PlanOut>('/plans', {
      shipment_ids: ['S1'] // can wire real IDs later
    })
    console.log('PLAN RESPONSE:', planRes.data)
    setPlan(planRes.data)
    setDelayTrend(prev => [
  ...prev,
  {
    time: new Date().toLocaleTimeString(),
    expected_delay_min: planRes.data.expected_delay_min,
  },
])
  } catch (e: any) {
    console.error('Failed to create plan', e?.message)
  }

} catch (e: any) {
  console.error('Failed to compute route', e?.message)
} finally {
  setIsRouting(false)
}

  }
  useEffect(() => {
  console.log('PLAN STATE UPDATED:', plan)
}, [plan])


  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1f2937,_#020617)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8 space-y-6">
        {/* Top header */}
        <motion.header
          className="flex flex-wrap items-center gap-4 justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 text-sm">
                ⛓️
              </span>
              Network Control Tower
            </h1>
            <p className="mt-1 text-sm text-slate-300/80">
              Monitor your logistics network, trace events, and simulate routes in real time.
            </p>
          </div>

          <motion.div
            className="flex items-center gap-3 text-xs text-slate-300/80 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
            <span>Live data</span>


          </motion.div>
        </motion.header>

        {/* KPIs */}
        <motion.div
          className="text-black"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/30 p-4 sm:p-5 shadow-lg shadow-slate-900/60 backdrop-blur-xl">
            <Kpis
  shipments={shipmentsCount}
  locations={locations.length}
  lastEvent={lastEventTs}
  delayProb={plan?.delay_prob}
  expectedDelayMin={plan?.expected_delay_min}
/>

          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="mb-1 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5 shadow-lg shadow-black/40 backdrop-blur-xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-white/80 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-xs">
                🧭
              </span>
              Routing Playground
            </div>
            {isLoadingInitial && (
              <div className="flex items-center gap-2 text-xs text-slate-300/70">
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-500/40 border-t-transparent" />
                Loading network…
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1 text-xs text-slate-400/90">
              <span className="pl-1">Origin</span>
              <select
                className="min-w-[160px] rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs sm:text-sm text-white shadow-sm shadow-black/40 backdrop-blur focus:border-teal-300/60 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                value={originId}
                onChange={e => setOriginId(e.target.value ? Number(e.target.value) : '')}
              >
                <option className="bg-slate-900 text-white" value="">
                  Select origin…
                </option>
                {locations.map(l => (
                  <option className="bg-slate-900 text-white" key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 text-xs text-slate-400/90">
              <span className="pl-1">Destination</span>
              <select
                className="min-w-[160px] rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs sm:text-sm text-white shadow-sm shadow-black/40 backdrop-blur focus:border-teal-300/60 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                value={destId}
                onChange={e => setDestId(e.target.value ? Number(e.target.value) : '')}
              >
                <option className="bg-slate-900 text-white" value="">
                  Select destination…
                </option>
                {locations.map(l => (
                  <option className="bg-slate-900 text-white" key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 text-xs text-slate-400/90">
              <span className="pl-1">Mode</span>
              <select
                className="min-w-[110px] rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs sm:text-sm text-white shadow-sm shadow-black/40 backdrop-blur focus:border-teal-300/60 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                value={mode}
                onChange={e => setMode(e.target.value as any)}
              >
                <option className="bg-slate-900 text-white" value="road">
                  Road
                </option>
                <option className="bg-slate-900 text-white" value="rail">
                  Rail
                </option>
                <option className="bg-slate-900 text-white" value="sea">
                  Sea
                </option>
                <option className="bg-slate-900 text-white" value="air">
                  Air
                </option>
              </select>
            </div>

            <motion.button
              className="group mt-5 inline-flex items-center gap-2 rounded-xl border border-teal-300/50 bg-gradient-to-r from-teal-500/30 via-teal-400/30 to-emerald-400/30 px-4 py-2 text-xs sm:text-sm font-medium text-teal-50 shadow-inner shadow-teal-500/40 backdrop-blur transition hover:from-teal-400/40 hover:to-emerald-400/40 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleRoute}
              disabled={!originId || !destId || isRouting}
              whileTap={{ scale: 0.97 }}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[11px]">
                {isRouting ? (
                  <span className="h-3 w-3 animate-spin rounded-full border border-teal-200/70 border-t-transparent" />
                ) : (
                  '▶'
                )}
              </span>
              <span>{isRouting ? 'Computing route…' : 'Compute Route'}</span>
            </motion.button>

            <button
              className="ml-auto mt-5 inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10"
              onClick={loadEvents}
              title="Refresh events"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/5 text-[10px]">
                ⟳
              </span>
              <span>Refresh events</span>
            </button>
          </div>

          {eventsErr && (
            <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500/50 text-[10px]">
                  !
                </span>
                <span>{eventsErr}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Layout */}
        <motion.div
          className="grid grid-cols-12 gap-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          {/* Map + Route */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-7 space-y-4">
            <motion.div
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/50 backdrop-blur-xl"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-xs text-slate-300/80">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-[11px]">
                    🗺️
                  </span>
                  <span>Network Map</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {originId && destId ? (
                    <>
                      <span className="truncate max-w-[160px]">
                        From:{' '}
                        {
                          locations.find(l => l.id === originId)?.name ??
                          '—'
                        }
                      </span>
                      <span>→</span>
                      <span className="truncate max-w-[160px]">
                        To:{' '}
                        {
                          locations.find(l => l.id === destId)?.name ??
                          '—'
                        }
                      </span>
                    </>
                  ) : (
                    <span>Select origin & destination to view a route.</span>
                  )}
                </div>
              </div>

              <div className="h-[360px] sm:h-[420px]">
                <Map locations={locations} route={route} />
              </div>
            </motion.div>

            <AnimatePresence>
              {route && (
                <motion.div
                  className="mt-1 rounded-2xl border border-white/10 bg-slate-900/80 p-4 backdrop-blur-xl shadow-lg shadow-black/50"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-teal-500/15 text-[10px] text-teal-200">
                        ✓
                      </span>
                      <span>Route Summary</span>
                    </div>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                      {mode} mode
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-white/80">
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                      <span className="text-lg">📏</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-white/60">Distance</span>
                        <span className="font-medium">{km(route.distance_km)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                      <span className="text-lg">⏱️</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-white/60">Time</span>
                        <span className="font-medium">{mins(route.time_min)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                      <span className="text-lg">🌱</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-white/60">CO₂e</span>
                        <span className="font-medium">{kg(route.co2e_kg)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
              )}
            </AnimatePresence>
          </div>

          {/* Events panel */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-5">
            <motion.div
              className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl shadow-black/50 backdrop-blur-2xl"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
            >
              <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-[11px]">
                    🧾
                  </span>
                  <span>Recent Events</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Live feed</span>
                </div>
              </div>

              <div className="events-scroll max-h-[460px] overflow-y-auto overflow-x-hidden rounded-xl border border-white/5 bg-slate-950/60">
  <EventsFeed limit={30} pollMs={60_000} />
</div>
<motion.div
  className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg backdrop-blur-xl"
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
>
  <div className="mb-2 text-sm font-medium text-white/80 flex items-center gap-2">
    📈 Delay Trend (ML Prediction)
  </div>

  <DelayTrendChart data={delayTrend} />
</motion.div>

            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
