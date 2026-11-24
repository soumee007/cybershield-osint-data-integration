'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Slice = { name: string; value: number }

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--foreground)',
  fontSize: 12,
}
const axis = { stroke: 'var(--muted-foreground)', fontSize: 11, tickLine: false, axisLine: false }

export function ChartCard({
  title,
  description,
  data,
  children,
}: {
  title: string
  description?: string
  data: Slice[]
  children: React.ReactNode
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <section className="rounded-lg border bg-card p-4">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <span className="font-mono text-xs text-muted-foreground">n={total}</span>
      </header>
      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          No records yet
        </div>
      ) : (
        <div className="h-56">{children}</div>
      )}
      {data.length > 0 && (
        <table className="sr-only">
          <caption>{title}</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.name}>
                <th>{d.name}</th>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export function DonutChart({ title, description, data }: { title: string; description?: string; data: Slice[] }) {
  return (
    <ChartCard title={title} description={description} data={data}>
      <div className="flex h-full items-center gap-4">
        <ResponsiveContainer width="55%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" stroke="var(--card)">
              {data.map((d, i) => (
                <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="flex-1 space-y-1 overflow-y-auto text-xs" aria-hidden="true">
          {data.slice(0, 8).map((d, i) => (
            <li key={d.name} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate">{d.name}</span>
              <span className="ml-auto font-mono text-muted-foreground">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  )
}

export function BarsChart({
  title,
  description,
  data,
  horizontal = false,
  color = 'var(--chart-1)',
}: {
  title: string
  description?: string
  data: Slice[]
  horizontal?: boolean
  color?: string
}) {
  return (
    <ChartCard title={title} description={description} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} {...axis} />
            <YAxis type="category" dataKey="name" width={100} {...axis} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
            <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" {...axis} />
            <YAxis allowDecimals={false} width={32} {...axis} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function TimelineChart({ title, description, data }: { title: string; description?: string; data: Slice[] }) {
  return (
    <ChartCard title={title} description={description} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tf-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" {...axis} minTickGap={24} />
          <YAxis allowDecimals={false} width={32} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="value" stroke="var(--chart-1)" fill="url(#tf-area)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
