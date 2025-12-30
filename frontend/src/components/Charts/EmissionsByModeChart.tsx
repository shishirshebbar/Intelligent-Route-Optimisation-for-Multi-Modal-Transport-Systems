import { Bar } from 'react-chartjs-2'
import './chartSetup';

export default function EmissionsByModeChart() {
  const data = {
    labels: ['Road', 'Rail', 'Sea', 'Air'],
    datasets: [
      {
        label: 'CO₂ Emissions (kg)',
        data: [120, 55, 40, 180], // STEP-3 representative values
        backgroundColor: ['#f97316', '#22c55e', '#0ea5e9', '#ef4444'],
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
        Emissions by Transport Mode
      </div>
      <Bar data={data} options={options} />
    </div>
  )
}
