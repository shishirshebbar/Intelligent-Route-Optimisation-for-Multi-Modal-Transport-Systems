import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import type { LocationListResponse, ShipmentListResponse, RouteOut, EventOut } from '../types/api.tsx'
import type { LocationOut } from '../types/api.tsx'
import type { RoutingRequest } from '../types/api.tsx'
import Map from '../components/Map/Map'
import Kpis from '../components/Kpis/kpis.tsx'
import EventsFeed from '../components/Events/EventsFeed'
import { km, mins, kg } from '../utils/format'

export default function Dashboard() {
  const [locations, setLocations] = useState<LocationOut[]>([])
  const [shipmentsCount, setShipmentsCount] = useState(0)
  const [events, setEvents] = useState<EventOut[]>([])
  const [originId, setOriginId] = useState<number | ''>('')
  const [destId, setDestId] = useState<number | ''>('')
  const [mode, setMode] = useState<'road'|'rail'|'sea'|'air'|'transfer'>('road')
  const [route, setRoute] = useState<RouteOut | null>(null)
  const lastEventTs = useMemo(() => events[0]?.ts, [events])

  useEffect(() => {
    (async () => {
      const locRes = await api.get<LocationListResponse>('/network/locations')
      setLocations(locRes.data.data)

      const shpRes = await api.get<ShipmentListResponse>('/shipments')
      setShipmentsCount(shpRes.data.total)

      const evRes = await api.get<EventOut[]>('/events')
      setEvents(evRes.data)
    })().catch(console.error)
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
    const res = await api.post<RouteOut>('/routing/multimodal', payload)
    setRoute(res.data)
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="text-black">
        <Kpis shipments={shipmentsCount} locations={locations.length} lastEvent={lastEventTs} />
      </div>

      {/* Controls */}
      <div className="mb-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white shadow-sm backdrop-blur focus:border-teal-300/60 focus:ring-2 focus:ring-teal-400/30"
            value={originId}
            onChange={e => setOriginId(e.target.value ? Number(e.target.value) : '')}
          >
            <option className="bg-slate-900 text-white" value="">Origin</option>
            {locations.map(l => (
              <option className="bg-slate-900 text-white" key={l.id} value={l.id}>
                {l.name} ({l.type})
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white shadow-sm backdrop-blur focus:border-teal-300/60 focus:ring-2 focus:ring-teal-400/30"
            value={destId}
            onChange={e => setDestId(e.target.value ? Number(e.target.value) : '')}
          >
            <option className="bg-slate-900 text-white" value="">Destination</option>
            {locations.map(l => (
              <option className="bg-slate-900 text-white" key={l.id} value={l.id}>
                {l.name} ({l.type})
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white shadow-sm backdrop-blur focus:border-teal-300/60 focus:ring-2 focus:ring-teal-400/30"
            value={mode}
            onChange={e => setMode(e.target.value as any)}
          >
            <option className="bg-slate-900 text-white" value="road">Road</option>
            <option className="bg-slate-900 text-white" value="rail">Rail</option>
            <option className="bg-slate-900 text-white" value="sea">Sea</option>
            <option className="bg-slate-900 text-white" value="air">Air</option>
          </select>

          <button
            className="group inline-flex items-center gap-2 rounded-xl border border-teal-300/40 bg-teal-400/20 px-4 py-2 font-medium text-teal-50 shadow-inner backdrop-blur transition hover:bg-teal-400/30 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleRoute}
            disabled={!originId || !destId}
          >
            Compute Route
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-12 gap-6">
       <div className="col-span-12 lg:col-span-8 xl:col-span-7">
          <Map locations={locations} route={route} />

          {route && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="mb-2 text-sm text-white/60">Route Summary</div>
              <div className="flex flex-wrap gap-6 text-sm text-white/80">
                <div><span className="text-white/60">Distance:</span> {km(route.distance_km)}</div>
                <div><span className="text-white/60">Time:</span> {mins(route.time_min)}</div>
                <div><span className="text-white/60">CO₂e:</span> {kg(route.co2e_kg)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 xl:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="mb-3 text-sm text-white/60">Recent Events</div>
            <div className="text-white">
              <EventsFeed events={events} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
