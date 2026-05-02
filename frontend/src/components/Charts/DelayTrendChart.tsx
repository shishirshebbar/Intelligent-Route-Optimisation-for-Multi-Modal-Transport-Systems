import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type DelayPoint = {
  time: string
  expected_delay_min: number
}

export default function DelayTrendChart({ data }: { data: DelayPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-full min-h-72 items-center justify-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] py-12 text-center text-sm text-[var(--text-dim)]">
        No delay data yet
      </div>
    )
  }

  return (
    <div className="flex h-72 flex-col rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#243246" />
          <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8ea1b5' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#8ea1b5' }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'Delay (min)',
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
              fill: '#8ea1b5',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#132033',
              border: '1px solid #243246',
              borderRadius: '6px',
              color: '#d9e2ec',
            }}
          />
          <Line
            type="monotone"
            dataKey="expected_delay_min"
            stroke="#5b8cff"
            strokeWidth={2}
            dot={{ r: 3, fill: '#5b8cff' }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
