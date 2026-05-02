import { useMemo } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LocationOut, RouteOut } from '../../types/api'

type Props = {
  locations: LocationOut[]
  route?: RouteOut | null
}

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946]
const DEFAULT_ZOOM = 12

export default function Map({ locations, route }: Props) {
  const bounds = useMemo(() => {
    if (locations.length === 0) return null
    const lats = locations.map(l => l.lat)
    const lons = locations.map(l => l.lon)
    const south = Math.min(...lats)
    const north = Math.max(...lats)
    const west = Math.min(...lons)
    const east = Math.max(...lons)
    return [
      [south, west] as [number, number],
      [north, east] as [number, number],
    ]
  }, [locations])

  const lines: [number, number][][] = useMemo(() => {
    if (!route || !route.legs?.length) return []
    return route.legs.map(leg => {
      if (leg.polyline) {
        const decoded = decodePolyline(leg.polyline)
        if (decoded.length > 1) return decoded
      }
      return [
        [leg.from_coord.lat, leg.from_coord.lon],
        [leg.to_coord.lat, leg.to_coord.lon],
      ]
    })
  }, [route])

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-[420px] w-full"
      bounds={bounds ?? undefined}
      scrollWheelZoom={true}
    >
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {locations.map(loc => (
        <CircleMarker
          key={loc.id}
          center={[loc.lat, loc.lon]}
          radius={7}
          pathOptions={{
            color: markerColor(loc.type),
            fillColor: markerColor(loc.type),
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Tooltip>
            <div className="text-xs">
              <div className="font-medium">{loc.name}</div>
              <div className="text-slate-500">{loc.type}</div>
              <div>
                {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
              </div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

      {lines.map((line, index) => (
        <Polyline
          key={index}
          positions={line}
          pathOptions={{ weight: 4, color: '#4da3ff', opacity: 0.9 }}
        />
      ))}
    </MapContainer>
  )
}

function markerColor(type: LocationOut['type']) {
  if (type === 'depot') return '#5b8cff'
  if (type === 'customer') return '#f59e0b'
  if (type === 'airport') return '#ef4444'
  if (type === 'port') return '#22c55e'
  return '#8b5cf6'
}

function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = []
  let index = 0
  let lat = 0
  let lon = 0

  while (index < encoded.length) {
    let result = 0
    let shift = 0
    let byte: number

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    result = 0
    shift = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLon = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lon += deltaLon

    coordinates.push([lat / 1e5, lon / 1e5])
  }

  return coordinates
}
