// ---- Locations
export type LocationType = 'depot' | 'port' | 'rail' | 'airport' | 'customer'
export type EdgeMode = 'road' | 'rail' | 'sea' | 'air' | 'transfer'

export interface LocationOut {
  id: number
  name: string
  type: LocationType
  lat: number
  lon: number
}

export interface LocationListResponse {
  data: LocationOut[]
  total: number
}

// ---- Shipments
export interface ShipmentOut {
  id: string
  origin_id: number
  destination_id: number
  volume_m3: number
  weight_kg: number
  ready_time: string
  due_time: string
  priority: number
}

export interface ShipmentListResponse {
  data: ShipmentOut[]
  total: number
}

// ---- Events


export type EventType = 'traffic' | 'weather' | 'fuel_price' | 'breakdown'
export type Severity = 'low' | 'moderate' | 'high'

export interface EventOut {
  id: number
  type: EventType
  ts: string
  plan_id?: string | null
  source?: string | null
  severity?: Severity | null
  payload: Record<string, unknown>
}

// ---- Routing (stub)
export type Mode = 'road' | 'rail' | 'sea' | 'air' | 'transfer'
export interface Coord { lat: number; lon: number }

export interface RoutingRequest {
  origins: Coord[]
  destinations: Coord[]
  modes: Mode[]
  objective?: { cost: number; time: number; co2e: number }
  constraints?: { prefer_low_emission_within_pct?: number; depart_after?: string | null }
}

export interface RouteLegOut {
  mode: Mode
  from_coord: Coord
  to_coord: Coord
  distance_km: number
  time_min: number
  co2e_kg: number
  polyline?: string | null
}

export interface RouteOut {
  distance_km: number
  time_min: number
  co2e_kg: number
  legs: RouteLegOut[]
}
