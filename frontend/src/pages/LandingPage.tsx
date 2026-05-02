import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Filter,
  GitBranch,
  Moon,
  Radio,
  Route,
  Scan,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import EventsFeed from '../components/Events/EventsFeed'
import Map from '../components/Map/Map'
import api from '../api/client'
import { kg, km, mins } from '../utils/format'
import type {
  EventOut,
  EventType,
  LocationListResponse,
  LocationOut,
  RouteOut,
  Severity,
  ShipmentListResponse,
  ShipmentOut,
} from '../types/api'

type LandingProps = {
  onStart?: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

const systemHighlights = [
  {
    title: 'Network-aware planning',
    text: 'Routes are computed against your stored locations, shipment selections, and transport mode choices.',
    icon: GitBranch,
  },
  {
    title: 'Operational visibility',
    text: 'Events, live KPIs, and route summaries stay together in one working surface for dispatch decisions.',
    icon: Radio,
  },
  {
    title: 'Evaluation hooks',
    text: 'Delay prediction, emissions comparison, and reroute metrics remain visible without changing workflow.',
    icon: Activity,
  },
]

const modes = ['road', 'rail', 'sea', 'air'] as const
const eventTypes: Array<EventType | 'all'> = ['all', 'traffic', 'weather', 'fuel_price', 'breakdown', 'reroute']
const severities: Array<Severity | 'all'> = ['all', 'low', 'moderate', 'high']

const fieldClass =
  'h-10 rounded-md border border-[var(--line-soft)] bg-[var(--surface-3)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-strong)]'

export default function LandingPage({ onStart, theme, onToggleTheme }: LandingProps) {
  const [locations, setLocations] = useState<LocationOut[]>([])
  const [shipments, setShipments] = useState<ShipmentOut[]>([])
  const [eventSources, setEventSources] = useState<string[]>([])
  const [isLoadingPreview, setIsLoadingPreview] = useState(true)
  const [isRoutingPreview, setIsRoutingPreview] = useState(false)
  const [shipmentId, setShipmentId] = useState('')
  const [originId, setOriginId] = useState<number | ''>('')
  const [destinationId, setDestinationId] = useState<number | ''>('')
  const [mode, setMode] = useState<(typeof modes)[number]>('road')
  const [eventType, setEventType] = useState<EventType | 'all'>('all')
  const [eventSeverity, setEventSeverity] = useState<Severity | 'all'>('all')
  const [eventSource, setEventSource] = useState<string>('all')
  const [previewRoute, setPreviewRoute] = useState<RouteOut | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [locRes, shipmentRes, eventsRes] = await Promise.all([
          api.get<LocationListResponse>('/network/locations'),
          api.get<ShipmentListResponse>('/shipments'),
          api.get<EventOut[]>('/events', { params: { limit: 100 } }),
        ])

        setLocations(locRes.data.data)
        setShipments(shipmentRes.data.data)

        const sources = Array.from(
          new Set(eventsRes.data.map(event => event.source).filter((value): value is string => Boolean(value)))
        ).sort()
        setEventSources(sources)

        if (shipmentRes.data.data.length > 0) {
          const firstShipment = shipmentRes.data.data[0]
          setShipmentId(firstShipment.id)
          setOriginId(firstShipment.origin_id)
          setDestinationId(firstShipment.destination_id)
        }
      } catch (e) {
        console.warn('Landing preview data unavailable')
      } finally {
        setIsLoadingPreview(false)
      }
    })()
  }, [])

  const selectedShipment = useMemo(
    () => shipments.find(shipment => shipment.id === shipmentId) ?? null,
    [shipments, shipmentId]
  )
  const selectedOrigin = useMemo(
    () => locations.find(location => location.id === originId) ?? null,
    [locations, originId]
  )
  const selectedDestination = useMemo(
    () => locations.find(location => location.id === destinationId) ?? null,
    [locations, destinationId]
  )

  const eventTitle = useMemo(() => {
    const parts = ['Event feed']
    if (eventType !== 'all') parts.push(eventType)
    if (eventSeverity !== 'all') parts.push(eventSeverity)
    if (eventSource !== 'all') parts.push(eventSource)
    return parts.join(' - ')
  }, [eventType, eventSeverity, eventSource])

  const handleShipmentChange = (nextShipmentId: string) => {
    setShipmentId(nextShipmentId)
    const shipment = shipments.find(item => item.id === nextShipmentId)
    if (shipment) {
      setOriginId(shipment.origin_id)
      setDestinationId(shipment.destination_id)
    }
    setPreviewRoute(null)
  }

  const handlePreviewRoute = async () => {
    if (!selectedOrigin || !selectedDestination) return

    try {
      setIsRoutingPreview(true)
      const response = await api.post<RouteOut>('/routing/multimodal', {
        origins: [{ lat: selectedOrigin.lat, lon: selectedOrigin.lon }],
        destinations: [{ lat: selectedDestination.lat, lon: selectedDestination.lon }],
        origin_id: selectedOrigin.id,
        destination_id: selectedDestination.id,
        modes: [mode],
        objective: { cost: 0.5, time: 0.3, co2e: 0.2 },
      })
      setPreviewRoute(response.data)
    } catch (e) {
      console.warn('Landing preview route unavailable')
      setPreviewRoute(null)
    } finally {
      setIsRoutingPreview(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-5 lg:px-6">
        <header className="flex items-center justify-between border-b border-[var(--line-soft)] pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--accent-strong)]">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Intelligent Route Optimiser</div>
              <div className="text-xs text-[var(--text-dim)]">Multi-modal transport systems</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--accent-soft)] bg-[var(--accent-muted)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)] hover:bg-[var(--surface-3)]"
            >
              Open console
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-6 py-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
          <section className="flex h-full flex-col gap-6 overflow-hidden rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] p-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--ok)]" />
                Working prototype
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--text-primary)] lg:text-4xl">
                Command multimodal shipments, live events, and delay-aware rerouting from one control surface.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Built around the logistics graph in this project, it brings shipment selection,
                route computation, weather and traffic signals, and reroute monitoring into a
                single operational view.
              </p>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                <Activity className="h-4 w-4 text-[var(--accent-strong)]" />
                Core product qualities
              </div>
              <div className="grid gap-4">
                {systemHighlights.map(item => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.title}
                      className="h-full rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-3)] text-[var(--accent-strong)]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h2>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">Event inputs</div>
                  <div className="mt-1 text-sm font-medium">Filter the live event stream by type, severity, and source</div>
                </div>
                <div className="rounded-full border border-[var(--line-soft)] px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                  Live
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <PreviewField label="Type">
                  <select
                    className={fieldClass}
                    value={eventType}
                    onChange={e => setEventType(e.target.value as EventType | 'all')}
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </PreviewField>

                <PreviewField label="Severity">
                  <select
                    className={fieldClass}
                    value={eventSeverity}
                    onChange={e => setEventSeverity(e.target.value as Severity | 'all')}
                  >
                    {severities.map(severity => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </PreviewField>

                <PreviewField label="Source">
                  <select
                    className={fieldClass}
                    value={eventSource}
                    onChange={e => setEventSource(e.target.value)}
                  >
                    <option value="all">all</option>
                    {eventSources.map(source => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </PreviewField>
              </div>

              <div className="mt-4 rounded-md border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  <Filter className="h-4 w-4 text-[var(--accent-strong)]" />
                  {eventTitle}
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  <EventsFeed
                    title={eventTitle}
                    limit={6}
                    pollMs={60_000}
                    filterType={eventType === 'all' ? undefined : eventType}
                    filterSeverity={eventSeverity === 'all' ? undefined : eventSeverity}
                    filterSource={eventSource === 'all' ? undefined : eventSource}
                  />
                </div>
              </div>
            </div>
          </section>

          <aside className="flex h-full flex-col rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
            <div className="border-b border-[var(--line-soft)] px-5 py-4">
              <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">Console preview</div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">
                This preview pulls live project data and lets you inspect shipment and event inputs before opening the full console.
              </div>
            </div>

            <div className="grid flex-1 gap-3 p-5">
              <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
                <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">Route inputs</div>
                    <div className="mt-1 text-sm font-medium">Shipment, origin, destination, and mode</div>
                  </div>
                  <div className="rounded-full border border-[var(--line-soft)] px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                    Live
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <PreviewField label="Shipment">
                    <select
                      className={fieldClass}
                      value={shipmentId}
                      onChange={e => handleShipmentChange(e.target.value)}
                    >
                      <option value="">{isLoadingPreview ? 'Loading shipments...' : 'Select shipment...'}</option>
                      {shipments.map(shipment => (
                        <option key={shipment.id} value={shipment.id}>
                          {shipment.id}
                        </option>
                      ))}
                    </select>
                  </PreviewField>

                  <PreviewField label="Mode">
                    <select
                      className={fieldClass}
                      value={mode}
                      onChange={e => {
                        setMode(e.target.value as (typeof modes)[number])
                        setPreviewRoute(null)
                      }}
                    >
                      {modes.map(item => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </PreviewField>

                  <PreviewField label="Origin">
                    <select
                      className={fieldClass}
                      value={originId}
                      onChange={e => {
                        setOriginId(e.target.value ? Number(e.target.value) : '')
                        setPreviewRoute(null)
                      }}
                    >
                      <option value="">{isLoadingPreview ? 'Loading locations...' : 'Select origin...'}</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location.type})
                        </option>
                      ))}
                    </select>
                  </PreviewField>

                  <PreviewField label="Destination">
                    <select
                      className={fieldClass}
                      value={destinationId}
                      onChange={e => {
                        setDestinationId(e.target.value ? Number(e.target.value) : '')
                        setPreviewRoute(null)
                      }}
                    >
                      <option value="">{isLoadingPreview ? 'Loading locations...' : 'Select destination...'}</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location.type})
                        </option>
                      ))}
                    </select>
                  </PreviewField>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-[var(--text-secondary)] md:grid-cols-2">
                  <PreviewRow
                    label="Weight"
                    value={selectedShipment ? `${selectedShipment.weight_kg} kg` : '--'}
                  />
                  <PreviewRow
                    label="Volume"
                    value={selectedShipment ? `${selectedShipment.volume_m3} m3` : '--'}
                  />
                  <PreviewRow label="Ready time" value={selectedShipment?.ready_time ?? '--'} />
                  <PreviewRow label="Due time" value={selectedShipment?.due_time ?? '--'} />
                  <PreviewRow label="Priority" value={selectedShipment ? String(selectedShipment.priority) : '--'} />
                  <PreviewRow label="Locations loaded" value={String(locations.length)} />
                </div>

                <div className="mt-4">
                  <button
                    onClick={handlePreviewRoute}
                    disabled={!selectedOrigin || !selectedDestination || isRoutingPreview}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--accent-soft)] bg-[var(--accent-muted)] px-4 text-sm font-medium text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)] hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRoutingPreview ? (
                      <span className="h-4 w-4 animate-spin rounded-full border border-current border-r-transparent" />
                    ) : (
                      <Route className="h-4 w-4" />
                    )}
                    {isRoutingPreview ? 'Computing preview route...' : 'Preview route'}
                  </button>
                </div>
              </div>

              <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">Map and route</div>
                    <div className="mt-1 text-sm font-medium">Live location map with optional route overlay</div>
                  </div>
                  <div className="text-xs text-[var(--text-dim)]">{locations.length} locations</div>
                </div>
                <div className="mt-4 overflow-hidden rounded-md border border-[var(--line-soft)]">
                  {locations.length > 0 ? (
                    <Map locations={locations} route={previewRoute} />
                  ) : (
                    <div className="flex h-[420px] items-center justify-center bg-[var(--surface-3)] text-sm text-[var(--text-dim)]">
                      {isLoadingPreview ? 'Loading map preview...' : 'Map preview unavailable'}
                    </div>
                  )}
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <PreviewRow label="Distance" value={previewRoute ? km(previewRoute.distance_km) : '--'} />
                  <PreviewRow label="Travel time" value={previewRoute ? mins(previewRoute.time_min) : '--'} />
                  <PreviewRow label="CO2e" value={previewRoute ? kg(previewRoute.co2e_kg) : '--'} />
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}

function PreviewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</div>
      {children}
    </label>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--line-soft)] bg-[var(--surface-3)] px-3 py-2">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className="text-right text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
