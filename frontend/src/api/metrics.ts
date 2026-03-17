import api from './client'

export type EvaluationMetrics = {
  delay_reduction_pct: number
  emissions_saved_pct: number
  cost_change_pct: number
  reroutes_count: number
  delay_baseline_min: number
  delay_optimised_min: number
  emissions_by_mode: {
    baseline_road: number
    optimised_mode: number
  }
  scenario_results: Record<
    string,
    {
      distance_km: number
      baseline: {
        time_min: number
        delay_min: number
        emissions_kg: number
        cost: number
      }
      optimised: {
        time_min: number
        delay_min: number
        emissions_kg: number
        cost: number
      }
      improvements: {
        delay_reduction_pct: number
        emissions_saved_pct: number
        cost_change_pct: number
      }
      selected_mode: string
      is_multimodal: boolean
    }
  >
}

export async function fetchEvaluationMetrics(): Promise<EvaluationMetrics> {
  const res = await api.get<EvaluationMetrics>('/metrics/evaluation')
  return res.data
}
