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
      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] p-4">
        <div className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Emissions by transport strategy
        </div>
        <div className="py-10 text-center text-sm text-[var(--text-dim)]">
          Evaluation data not available yet
        </div>
      </div>
    )
  }

  const data = {
    labels: ['Baseline Road', 'Optimised Selection'],
    datasets: [
      {
        label: 'CO2 emissions (kg)',
        data: [baselineRoadEmissions, optimisedModeEmissions],
        backgroundColor: ['#ef4444', '#22c55e'],
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#9fb0c0' },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#9fb0c0' },
        grid: { color: '#243246' },
      },
    },
  }

  return (
    <div className="flex flex-col rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] p-4">
      <div className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
        Emissions by transport strategy
      </div>
      <div className="text-sm text-[var(--text-secondary)]">
        Compare road-only baseline emissions with the optimised selection.
      </div>
      <div className="mt-3 flex-1">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
