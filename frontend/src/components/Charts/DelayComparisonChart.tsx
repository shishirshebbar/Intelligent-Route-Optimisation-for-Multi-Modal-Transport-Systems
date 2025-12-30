import { Bar } from 'react-chartjs-2'
import './chartSetup';

export default function DelayComparisonChart() {
  const data = {
    labels: ['Baseline', 'Optimised'],
    datasets: [
      {
        label: 'Delay (minutes)',
        data: [80, 44], // STEP-5 traffic scenario
        backgroundColor: ['#ef4444', '#22c55e'],
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
        Delay Comparison (Baseline vs Optimised)
      </div>
      <Bar data={data} options={options} />
    </div>
  )
}
