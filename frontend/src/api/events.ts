import api from './client'
import type { EventOut, EventType, Severity } from '../types/api.ts';

export type EventsQuery = {
  type?: EventType
  source?: string
  severity?: Severity
  since?: string
  until?: string
  limit?: number
}

export async function fetchEvents(q: EventsQuery = {}): Promise<EventOut[]> {
  const res = await api.get<EventOut[]>('/events', { params: q })
  return res.data
}
