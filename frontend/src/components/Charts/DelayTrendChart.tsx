import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

type DelayPoint = {
  time: string
  expected_delay_min: number
}

export default function DelayTrendChart({ data }: { data: DelayPoint[] }) {
  if (!data.length) {
    return (
      <div className="text-xs text-slate-400 text-center py-10">
        No delay data yet
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis
            label={{
              value: 'Delay (min)',
              angle: -90,
              position: 'insideLeft',
              fontSize: 10,
            }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="expected_delay_min"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
