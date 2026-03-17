import { Bar } from 'react-chartjs-2'
import './chartSetup'

export default function EmissionsByModeChart({
  baselineRoadEmissions,
  optimisedModeEmissions,
}: {
  baselineRoadEmissions?: number
  optimisedModeEmissions?: number
}) {
  if (baselineRoadEmissions === undefined || optimisedModeEmissions === undefined) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg backdrop-blur-xl">
        <div className="mb-2 text-sm font-medium text-white/80">
          Emissions by Transport Strategy
        </div>
        <div className="py-10 text-center text-xs text-slate-400">
          Evaluation data not available yet
        </div>
      </div>
    )
  }

  const data = {
    labels: ['Baseline Road', 'Optimised Selection'],
    datasets: [
      {
        label: 'CO2 Emissions (kg)',
        data: [baselineRoadEmissions, optimisedModeEmissions],
        backgroundColor: ['#f97316', '#22c55e'],
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg backdrop-blur-xl">
      <div className="mb-2 text-sm font-medium text-white/80">
        Emissions by Transport Strategy
      </div>
      <Bar data={data} options={options} />
    </div>
  )
}
