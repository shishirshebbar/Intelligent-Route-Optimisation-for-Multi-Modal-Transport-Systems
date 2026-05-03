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

  const selectedSegments = useMemo(() => {
    if (!route || !route.legs?.length) return []
    return route.legs.map(leg => ({
      mode: leg.mode,
      line: (() => {
        if (leg.mode === 'road' && leg.polyline) {
          const decoded = decodePolyline(leg.polyline)
          if (decoded.length > 1) return decoded
        }
        const fallback: [number, number][] = [
          [leg.from_coord.lat, leg.from_coord.lon],
          [leg.to_coord.lat, leg.to_coord.lon],
        ]
        return fallback
      })(),
    }))
  }, [route])

  const baselineSegments = useMemo(() => {
    if (!route?.baseline_legs?.length) return []
    return route.baseline_legs.map(leg => ({
      mode: leg.mode,
      line: (() => {
        if (leg.polyline) {
          const decoded = decodePolyline(leg.polyline)
          if (decoded.length > 1) return decoded
        }
        const fallback: [number, number][] = [
          [leg.from_coord.lat, leg.from_coord.lon],
          [leg.to_coord.lat, leg.to_coord.lon],
        ]
        return fallback
      })(),
    }))
  }, [route])

  const routeAnchors = useMemo(() => {
    const anchors: Array<{
      key: string
      label: string
      point: [number, number]
      color: string
      direction: 'left' | 'right'
      offset: [number, number]
    }> = []

    if (selectedSegments[0]?.line.length) {
      anchors.push({
        key: 'optimised',
        label: selectedSegments[0].mode === 'road' ? 'Optimised route' : 'Graph route',
        point: selectedSegments[0].line[0],
        color: '#2563eb',
        direction: 'right',
        offset: [12, 0],
      })
    }

    if (baselineSegments[0]?.line.length) {
      const selectedStart = selectedSegments[0]?.line[0]
      const baselineStart = baselineSegments[0].line[0]
      const startsOverlap = selectedStart
        ? distanceKm(selectedStart, baselineStart) < 0.25
        : false
      anchors.push({
        key: 'baseline',
        label: startsOverlap ? 'Road baseline (overlaps)' : 'Road baseline',
        point: baselineStart,
        color: '#9ca3af',
        direction: startsOverlap ? 'left' : 'right',
        offset: startsOverlap ? [-12, 0] : [12, 0],
      })
    }

    return anchors
  }, [baselineSegments, selectedSegments])

  const selectedGeometry = route ? describeGeometry(route.legs?.[0]) : null
  const baselineGeometry = route ? describeGeometry(route.baseline_legs?.[0]) : null

  return (
    <div className="relative h-[420px] w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        bounds={bounds ?? undefined}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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

        {baselineSegments.map((segment, index) => (
          <Polyline
            key={`baseline-${index}`}
            positions={segment.line}
            pathOptions={{ weight: 4, color: '#9ca3af', opacity: 0.75, dashArray: '8 8' }}
          />
        ))}

        {selectedSegments.map((segment, index) => (
          <Polyline
            key={`selected-${index}`}
            positions={segment.line}
            pathOptions={{
              weight: 5,
              color: '#2563eb',
              opacity: 0.95,
              dashArray: segment.mode === 'road' ? undefined : '10 10',
            }}
          />
        ))}

        {routeAnchors.map(anchor => (
          <CircleMarker
            key={anchor.key}
            center={anchor.point}
            radius={6}
            pathOptions={{
              color: anchor.color,
              fillColor: anchor.color,
              fillOpacity: 1,
              weight: 2,
            }}
            >
            <Tooltip permanent direction={anchor.direction} offset={anchor.offset} opacity={1}>
              <span className="text-xs font-medium">{anchor.label}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {route && (
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)]/95 px-3 py-2 text-xs text-[var(--text-secondary)] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
            {selectedSegments[0]?.mode === 'road' ? 'Optimised route' : 'Graph route'}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-faint)]">
            Geometry: {selectedGeometry ?? 'n/a'}
          </div>
          {route.baseline_legs?.length ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-[#9ca3af]" />
                Road baseline
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-faint)]">
                Geometry: {baselineGeometry ?? 'n/a'}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
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

function distanceKm(a: [number, number], b: [number, number]) {
  const latDiff = a[0] - b[0]
  const lonDiff = a[1] - b[1]
  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111
}

function describeGeometry(
  leg?: {
    mode?: string
    shape?: { lat: number; lon: number }[] | null
    polyline?: string | null
  } | null
) {
  if (!leg) return null
  if (leg.mode && leg.mode !== 'road') return 'graph abstraction'
  if (leg.polyline) return 'polyline'
  return 'straight fallback'
}
