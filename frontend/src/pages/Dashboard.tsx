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
        <div className='text-black'>
      <Kpis  shipments={shipmentsCount} locations={locations.length} lastEvent={lastEventTs} />
        </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className="mb-3 flex items-center gap-3">
            <select className="border text-black rounded-lg p-2"
              value={originId}
              onChange={e => setOriginId(e.target.value ? Number(e.target.value) : '')}
            >
              <option  value="">Origin</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}
            </select>

            <select className="border text-black rounded-lg p-2"
              value={destId}
              onChange={e => setDestId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Destination</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}
            </select>

            <select className="border text-black rounded-lg p-2"
              value={mode}
              onChange={e => setMode(e.target.value as any)}
            >
              <option value="road">Road</option>
              <option value="rail">Rail</option>
              <option value="sea">Sea</option>
              <option value="air">Air</option>
            </select>

            <button
              className="px-4 py-2 rounded-lg bg-black text-white "
              onClick={handleRoute}
              disabled={!originId || !destId}
            >
              Compute Route
            </button>
          </div>

          <Map locations={locations} route={route} />

          {route && (
            <div className="mt-3 rounded-xl border p-4 bg-black">
              <div className="text-sm  text-gray-500 mb-2">Route Summary</div>
              <div className="flex gap-6 text-sm">
                <div><span className="text-gray-500">Distance:</span> {km(route.distance_km)}</div>
                <div><span className="text-gray-500">Time:</span> {mins(route.time_min)}</div>
                <div><span className="text-gray-500">CO₂e:</span> {kg(route.co2e_kg)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-6">
          <div className="rounded-xl border p-5 bg-white">
            <div className="text-sm text-gray-500 mb-3">Recent Events</div>
            <EventsFeed events={events} />
          </div>
        </div>
      </div>
    </div>
  )
}
