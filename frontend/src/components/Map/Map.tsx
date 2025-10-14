import { useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LocationOut } from '../../types/api'
import type { RouteOut } from '../../types/api'

type Props = {
  locations: LocationOut[]
  route?: RouteOut | null
}

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946] // Bengaluru-ish
const DEFAULT_ZOOM = 12

export default function Map({ locations, route }: Props) {
  const bounds = useMemo(() => {
    if (locations.length === 0) return null
    const lats = locations.map(l => l.lat)
    const lons = locations.map(l => l.lon)
    const south = Math.min(...lats), north = Math.max(...lats)
    const west = Math.min(...lons), east = Math.max(...lons)
    return [[south, west] as [number, number], [north, east] as [number, number]]
  }, [locations])

  // Build polyline from stubbed route (we only get two coords in stub)
  const line: [number, number][] | null = useMemo(() => {
    if (!route || !route?.legs?.length) return null
    const leg = route.legs[0]
    return [
      [leg.from_coord.lat, leg.from_coord.lon],
      [leg.to_coord.lat, leg.to_coord.lon],
    ]
  }, [route])

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-[520px] w-full rounded-xl border overflow-hidden"
      bounds={bounds ?? undefined}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {locations.map(loc => (
        <CircleMarker
          key={loc.id}
          center={[loc.lat, loc.lon]}
          radius={7}
          pathOptions={{ color: loc.type === 'depot' ? '#0ea5e9' : '#10b981' }}
        >
          <Tooltip>
            <div className="text-xs">
              <div className="font-medium">{loc.name}</div>
              <div className="text-gray-500">{loc.type}</div>
              <div>{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

      {line && (
        <Polyline positions={line} pathOptions={{ weight: 5 }} />
      )}
    </MapContainer>
  )
}
