import api from './client'

export type EvaluationMetrics = {
  delay_reduction_pct: number
  emissions_saved_pct: number
  cost_change_pct: number
  reroutes_count: number
}

export async function fetchEvaluationMetrics(): Promise<EvaluationMetrics> {
  const res = await api.get<EvaluationMetrics>('/metrics/evaluation')
  return res.data
}
