import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../../api/stats'
import { Skeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/Card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

// ─── Chart theme ─────────────────────────────────────────────────────────────

const NEON     = '#3fff8b'
const EMERALD  = '#10B981'
const AMBER    = '#fbbf24'
const ORANGE   = '#f97316'
const RED      = '#ff716c'

const PIE_COLORS = [NEON, EMERALD, AMBER, ORANGE, RED, '#60a5fa', '#c084fc']

const chartTooltipStyle = {
  background: 'rgba(21,27,23,0.97)',
  border:     '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color:      '#f9fdf7',
  fontSize:   12,
}

// ─── Custom recharts tooltip ──────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={chartTooltipStyle} className="px-3 py-2">
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="text-body-sm font-bold text-primary">{payload[0].value} scans</p>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-widest">{title}</p>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey:  ['admin', 'stats'],
    queryFn:   statsApi.overview,
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-body-md text-error">Failed to load platform stats.</p>
        <p className="text-body-sm text-on-surface-variant mt-1">Ensure the backend is running on port 8000.</p>
      </div>
    )
  }

  const healthRate = data.total_scans > 0
    ? Math.round((data.healthy_count / data.total_scans) * 100)
    : 0

  return (
    <div className="max-w-6xl space-y-6">

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <Section title="Platform Overview">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Scans"
            value={data.total_scans.toLocaleString('en-IN')}
            subValue="All time"
            glow="neon"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            }
          />
          <StatCard
            label="Diseases Found"
            value={data.diseases_found.toLocaleString('en-IN')}
            subValue="Unique infections"
            glow="error"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            }
          />
          <StatCard
            label="Healthy Rate"
            value={`${healthRate}%`}
            subValue={`${data.healthy_count.toLocaleString('en-IN')} healthy`}
            glow="neon"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <polyline strokeLinecap="round" strokeLinejoin="round" points="20 6 9 17 4 12" />
              </svg>
            }
          />
          <StatCard
            label="This Month"
            value={data.this_month_scans.toLocaleString('en-IN')}
            subValue="Scans"
            glow="emerald"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
        </div>
      </Section>

      {/* ── Weekly trend chart ─────────────────────────────────────────── */}
      {data.scans_by_week && data.scans_by_week.length > 0 && (
        <Section title="Weekly Scan Volume">
          <div className="glass rounded-2xl p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.scans_by_week} barCategoryGap="30%">
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#8a8f88', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#8a8f88', fontSize: 11 }}
                  axisLine={false} tickLine={false} width={28}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(63,255,139,0.04)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.scans_by_week.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === data.scans_by_week.length - 1 ? NEON : EMERALD}
                      opacity={0.7 + (i / data.scans_by_week.length) * 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* ── Distribution charts ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Disease distribution pie */}
        {data.disease_distribution && data.disease_distribution.length > 0 && (
          <Section title="Top Diseases">
            <div className="glass rounded-2xl p-5">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.disease_distribution.slice(0, 7)}
                    dataKey="percentage"
                    nameKey="disease_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.disease_distribution.slice(0, 7).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                    contentStyle={chartTooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="space-y-1 mt-1">
                {data.disease_distribution.slice(0, 5).map((d, i) => (
                  <div key={d.disease_name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-body-sm text-on-surface flex-1 truncate">{d.disease_name}</span>
                    <span className="text-label-sm font-label text-primary shrink-0">{d.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Most common disease spotlight */}
        <Section title="Top Alert">
          <div className="glass rounded-2xl p-5 space-y-4 h-full">
            {data.most_common_disease ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-lg shrink-0">⚠️</div>
                  <div>
                    <p className="text-title-sm font-heading font-bold text-on-surface">{data.most_common_disease.name}</p>
                    <p className="text-body-sm text-on-surface-variant">Most reported disease</p>
                  </div>
                </div>
                <div className="glass-heavy rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="text-body-sm text-on-surface-variant">Total detections</p>
                  <p className="text-headline-sm font-heading font-bold text-error">
                    {data.most_common_disease.count.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="glass-heavy rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="text-body-sm text-on-surface-variant">Model accuracy</p>
                  <p className="text-headline-sm font-heading font-bold text-primary">
                    {(data.accuracy_rate * 100).toFixed(1)}%
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full py-10">
                <p className="text-body-sm text-on-surface-variant">No disease data yet.</p>
              </div>
            )}
          </div>
        </Section>

      </div>
    </div>
  )
}
