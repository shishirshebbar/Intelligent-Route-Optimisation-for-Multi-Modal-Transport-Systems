import { Bar } from 'react-chartjs-2'
import './chartSetup'

export default function DelayComparisonChart({
  baselineDelayMin,
  optimisedDelayMin,
}: {
  baselineDelayMin?: number
  optimisedDelayMin?: number
}) {
  if (baselineDelayMin === undefined || optimisedDelayMin === undefined) {
    return (
      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] p-4">
        <div className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Delay comparison
        </div>
        <div className="py-10 text-center text-sm text-[var(--text-dim)]">
          Evaluation data not available yet
        </div>
      </div>
    )
  }

  const data = {
    labels: ['Baseline', 'Optimised'],
    datasets: [
      {
        label: 'Delay (minutes)',
        data: [baselineDelayMin, optimisedDelayMin],
        backgroundColor: ['#f59e0b', '#5b8cff'],
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
        Delay comparison
      </div>
      <div className="text-sm text-[var(--text-secondary)]">
        Baseline versus optimised route delay outcome.
      </div>
      <div className="mt-3 flex-1">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
