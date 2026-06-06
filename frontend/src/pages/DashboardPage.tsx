import { useMemo, memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { AppLayout } from '../components/layout/AppLayout'
import { StatCard } from '../components/ui/Card'
import { SeverityBadge } from '../components/ui/Badge'
import { EmptyState, LeafEmptyIcon } from '../components/ui/EmptyState'
import {
  Skeleton,
  StatCardSkeleton,
  ListItemSkeleton,
} from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useStatsOverview, useRecentScans } from '../hooks/useDashboard'
import { formatDateTime, formatConfidence } from '../lib/utils'
import type { Prediction } from '../types'
import type { Severity } from '../styles/tokens'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Map a prediction's is_healthy + confidence to a Severity for the badge */
function resolveSeverity(p: Prediction): Severity {
  if (p.is_healthy) return 'healthy'
  const conf = p.confidence ?? 0
  if (conf >= 0.85) return 'critical'
  if (conf >= 0.65) return 'high'
  if (conf >= 0.4) return 'medium'
  return 'low'
}

/** Get a display label for a scan row */
function getScanLabel(p: Prediction): string {
  // The top_predictions[0]?.label is the raw class label from the model.
  // Prefer the disease name if we have a populated disease_id.
  if (p.top_predictions && p.top_predictions.length > 0) {
    // Format class labels like "Tomato___Late_blight" → "Tomato Late Blight"
    return p.top_predictions[0].label
      .replace(/___/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return 'Unknown'
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Sparkline bar chart for weekly scan trends */
function ScanTrendChart({
  data,
}: {
  data: Array<{ week: string; count: number }>
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <ResponsiveContainer width="100%" height={96}>
      <BarChart data={data} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <XAxis
          dataKey="week"
          tick={{ fill: '#a8aca6', fontSize: 10, fontFamily: 'Space Grotesk, monospace' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val: string) => {
            // val might be "2024-W18" or a date — show last 5 chars
            return val.slice(-5)
          }}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: 'rgba(63,255,139,0.06)' }}
          contentStyle={{
            background: 'rgba(21,27,23,0.95)',
            border: '1px solid rgba(63,255,139,0.15)',
            borderRadius: 12,
            fontSize: 12,
            fontFamily: 'Space Grotesk, monospace',
            color: '#f9fdf7',
            backdropFilter: 'blur(8px)',
          }}
          labelStyle={{ color: '#a8aca6', marginBottom: 2 }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {data.map((entry, idx) => {
            const intensity = entry.count / maxCount
            // Low bars → emerald, high bars → neon
            const color = intensity > 0.7 ? '#00E676' : intensity > 0.4 ? '#3fff8b' : '#10B981'
            return (
              <Cell
                key={idx}
                fill={color}
                fillOpacity={0.7 + intensity * 0.3}
                style={{ filter: intensity > 0.7 ? 'drop-shadow(0 0 4px rgba(0,230,118,0.6))' : undefined }}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Skeleton for the sparkline panel */
function ChartSkeleton() {
  return (
    <div className="flex items-end gap-1.5 h-24 px-2">
      {[45, 30, 60, 80, 50, 95, 70].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1"
          rounded="sm"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

/** A single row in the Recent Scans list */
const ScanRow = memo(function ScanRow({ prediction }: { prediction: Prediction }) {
  const severity = resolveSeverity(prediction)
  const label = getScanLabel(prediction)
  const thumbnailUrl = prediction.thumbnail_url

  return (
    <Link
      to={`/history/${prediction.id}`}
      className={
        'flex items-center gap-3 p-3 rounded-2xl ' +
        'transition-all duration-200 ' +
        'hover:bg-surface-container-high hover:shadow-neon-sm ' +
        'active:scale-[0.99] group'
      }
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 h-12 w-12 rounded-xl overflow-hidden bg-surface-container-highest border border-white/[0.05]">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={label}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path d="M17 8C8 10 5.9 16.17 3.82 19c-1.12-1-1.82-2.76-1.82-4.23C2 8.65 6.15 3 13.5 3c3.12 0 5.5 1.5 5.5 1.5L17 8z" />
              <path d="M17 8c0 4.97-4 9-9 9" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-heading font-semibold text-on-surface truncate">
          {label}
        </p>
        <p className="text-label-sm text-on-surface-variant mt-0.5 font-label">
          {formatDateTime(prediction.created_at)}
        </p>
      </div>

      {/* Confidence + Badge */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <SeverityBadge severity={severity} showDot pulse={severity === 'healthy'} />
        {prediction.confidence != null && (
          <span className="text-label-sm font-label text-on-surface-variant">
            {formatConfidence(prediction.confidence)}
          </span>
        )}
      </div>
    </Link>
  )
})

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconAlertTriangle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M17 8C8 10 5.9 16.17 3.82 19c-1.12-1-1.82-2.76-1.82-4.23C2 8.65 6.15 3 13.5 3c3.12 0 5.5 1.5 5.5 1.5L17 8z" />
      <path d="M17 8c0 4.97-4 9-9 9" />
    </svg>
  )
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function IconAnalyse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const user    = useAuthStore((s) => s.user)
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useStatsOverview()
  const { data: scansPage, isLoading: scansLoading, isError: scansError }                    = useRecentScans(5)

  // ── Computed stat values (memoized) ─────────────────────────────────────────
  const { totalScans, diseasesFound, healthyCount, healthyPct, accuracyRate, weekData, recentScans } = useMemo(() => {
    const total = stats?.total_scans ?? 0
    const found = stats?.diseases_found ?? 0
    const healthy = stats?.healthy_count ?? 0
    return {
      totalScans: total,
      diseasesFound: found,
      healthyCount: healthy,
      healthyPct: total > 0 ? Math.round((healthy / total) * 100) : 0,
      accuracyRate: stats?.accuracy_rate ?? 0,
      weekData: stats?.scans_by_week ?? [],
      recentScans: scansPage?.items ?? [],
    }
  }, [stats, scansPage])

  // ── Greeting (memoized) ───────────────────────────────────────────────────
  const greetingText = useMemo(() => {
    const hour = new Date().getHours()
    const greetingKey = hour < 12 ? 'dashboard.greeting' : hour < 18 ? 'dashboard.greeting_afternoon' : 'dashboard.greeting_evening'
    const firstName = user?.full_name?.split(' ')[0] ?? t('dashboard.greeting_farmer', { defaultValue: 'Farmer' })
    return t(greetingKey, { name: firstName })
  }, [user, t])

  return (
    <AppLayout title={t('nav.dashboard')}>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-md font-heading font-bold text-on-surface tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="text-body-md text-on-surface-variant mt-0.5">
              {greetingText}
            </p>
          </div>

          {/* Quick-scan FAB — visible on desktop where BottomNav is hidden */}
          <Link
            to="/analyse"
            className={
              'hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-full ' +
              'bg-primary text-on-primary font-label text-label-md ' +
              'shadow-neon-md hover:shadow-neon-lg transition-all duration-200 ' +
              'active:scale-95 shrink-0'
            }
          >
            <IconAnalyse />
            <span>{t('dashboard.new_scan')}</span>
          </Link>
        </div>

        {/* ── Stats Grid — 2×2 mobile / 4×1 desktop ──────────────────────── */}
        {statsError ? (
          <div className="glass rounded-2xl p-4 text-center text-body-sm text-error space-y-2">
            <p>{t('dashboard.failed_stats')}</p>
            <button
              onClick={() => refetchStats()}
              className="text-primary underline underline-offset-2 text-label-sm"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label={t('dashboard.stats.total_scans')}
                  value={totalScans.toLocaleString(i18n.language.startsWith('hi') ? 'hi-IN' : 'en-IN')}
                  subValue={t('dashboard.stats.total_scans_sub')}
                  glow="neon"
                  icon={<IconEye />}
                />
                <StatCard
                  label={t('dashboard.stats.diseases_found')}
                  value={diseasesFound.toLocaleString(i18n.language.startsWith('hi') ? 'hi-IN' : 'en-IN')}
                  subValue={t('dashboard.stats.diseases_found_sub')}
                  glow="error"
                  icon={<IconAlertTriangle />}
                />
                <StatCard
                  label={t('dashboard.stats.healthy_crops')}
                  value={`${healthyPct}%`}
                  subValue={t('dashboard.stats.healthy_crops_sub', { count: healthyCount })}
                  glow="emerald"
                  icon={<IconLeaf />}
                />
                <StatCard
                  label={t('dashboard.stats.accuracy_rate')}
                  value={`${(accuracyRate * 100).toFixed(1)}%`}
                  subValue={t('dashboard.stats.accuracy_rate_sub')}
                  glow="none"
                  icon={<IconTarget />}
                />
              </>
            )}
          </div>
        )}

        {/* ── Scan Trend Sparkline ─────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-title-sm font-heading font-semibold text-on-surface">
                {t('dashboard.trend.title')}
              </p>
              <p className="text-label-sm text-on-surface-variant font-label">
                {t('dashboard.trend.subtitle')}
              </p>
            </div>
            {!statsLoading && weekData.length > 0 && (
              <span className="text-label-sm font-label text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {weekData.length}w
              </span>
            )}
          </div>

          {statsLoading ? (
            <ChartSkeleton />
          ) : weekData.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-body-sm text-on-surface-variant">
              {t('dashboard.trend.no_data')}
            </div>
          ) : (
            <ScanTrendChart data={weekData} />
          )}
        </div>

        {/* ── Recent Scans ─────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-title-sm font-heading font-semibold text-on-surface">
                {t('dashboard.recent.title')}
              </p>
              {scansPage && (
                <p className="text-label-sm text-on-surface-variant font-label">
                  {t('dashboard.recent.total', { count: scansPage.total })}
                </p>
              )}
            </div>
            <Link
              to="/history"
              className="text-label-sm font-label text-primary hover:underline decoration-primary/50"
            >
              {t('common.view_all')}
            </Link>
          </div>

          {/* Content */}
          <div className="px-2 pb-2">
            {scansLoading && (
              <div className="space-y-0.5">
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
              </div>
            )}

            {scansError && (
              <div className="px-3 py-6 text-center text-body-sm text-error">
                {t('dashboard.recent.failed')}
              </div>
            )}

            {!scansLoading && !scansError && recentScans.length === 0 && (
              <EmptyState
                icon={<LeafEmptyIcon />}
                title={t('dashboard.recent.no_scans')}
                description={t('dashboard.recent.no_scans_desc')}
                action={{ label: t('dashboard.recent.action_btn'), onClick: () => window.location.assign('/analyse') }}
                className="py-10"
              />
            )}

            {!scansLoading && !scansError && recentScans.map((scan) => (
              <ScanRow key={scan.id} prediction={scan} />
            ))}
          </div>
        </div>

        {/* ── Most Common Disease ──────────────────────────────────────────── */}
        {!statsLoading && stats?.most_common_disease && (
          <div className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-error/10 border border-error/25 flex items-center justify-center text-error">
              <IconAlertTriangle />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-widest">
                {t('dashboard.most_detected.label')}
              </p>
              <p className="text-title-sm font-heading font-semibold text-on-surface mt-0.5">
                {stats.most_common_disease.name}
              </p>
            </div>
            <span className="text-display-sm font-heading font-bold text-error shrink-0">
              {stats.most_common_disease.count}
            </span>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
