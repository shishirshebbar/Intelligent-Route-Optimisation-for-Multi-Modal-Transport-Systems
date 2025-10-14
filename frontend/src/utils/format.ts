export const km = (v?: number | null) => (v == null ? '—' : `${v.toFixed(2)} km`)
export const mins = (v?: number | null) => (v == null ? '—' : `${v.toFixed(0)} min`)
export const kg = (v?: number | null) => (v == null ? '—' : `${v.toFixed(2)} kg`)
export const dt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—')
