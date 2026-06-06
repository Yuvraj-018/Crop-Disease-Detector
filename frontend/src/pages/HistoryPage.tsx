import { useState, useCallback, useMemo, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../components/layout/AppLayout'
import { SeverityBadge } from '../components/ui/Badge'
import { EmptyState, LeafEmptyIcon } from '../components/ui/EmptyState'
import { ListItemSkeleton } from '../components/ui/Skeleton'
import { predictionsApi } from '../api/predictions'
import { formatDateTime, formatConfidence } from '../lib/utils'
import type { Prediction } from '../types'
import type { Severity } from '../styles/tokens'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveSeverity(p: Prediction): Severity {
  if (p.is_healthy) return 'healthy'
  const c = p.confidence ?? 0
  if (c >= 0.85) return 'critical'
  if (c >= 0.65) return 'high'
  if (c >= 0.4)  return 'medium'
  return 'low'
}

function formatLabel(raw: string): string {
  return raw.replace(/___/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

type FilterHealth = 'all' | 'healthy' | 'diseased'

// ─── Row ─────────────────────────────────────────────────────────────────────

const HistoryRow = memo(function HistoryRow({ scan }: { scan: Prediction }) {
  const { t } = useTranslation()
  const severity = resolveSeverity(scan)
  const label =
    scan.top_predictions?.[0]?.label
      ? formatLabel(scan.top_predictions[0].label)
      : scan.is_healthy ? t('common.healthy') : t('analyse.results.unknown', { defaultValue: 'Unknown' })

  return (
    <Link
      to={`/history/${scan.id}`}
      className={
        'flex items-center gap-4 px-4 py-3.5 rounded-2xl ' +
        'transition-all duration-200 hover:bg-surface-container-high ' +
        'hover:shadow-neon-sm active:scale-[0.99] group'
      }
    >
      {/* Thumbnail */}
      <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-surface-container-highest border border-white/[0.04]">
        {scan.thumbnail_url ? (
          <img
            src={scan.thumbnail_url}
            alt={label}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/25">
            <LeafEmptyIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-heading font-semibold text-on-surface truncate">{label}</p>
        <p className="text-label-sm text-on-surface-variant font-label mt-0.5">
          {formatDateTime(scan.created_at)}
        </p>
      </div>

      {/* Right — badge + confidence */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <SeverityBadge severity={severity} showDot />
        {scan.confidence != null && (
          <span className="text-label-sm font-label text-on-surface-variant">
            {formatConfidence(scan.confidence)}
          </span>
        )}
      </div>

      {/* Chevron */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-on-surface-variant/40 shrink-0 group-hover:translate-x-0.5 transition-transform">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

const PER_PAGE = 15

export default function HistoryPage() {
  const navigate           = useNavigate()
  const { t }        = useTranslation()
  const [page, setPage]    = useState(1)
  const [filter, setFilter] = useState<FilterHealth>('all')

  const filterOptions = useMemo(() => [
    { label: t('history.tabs.all'),      value: 'all' as FilterHealth },
    { label: t('history.tabs.diseased'), value: 'diseased' as FilterHealth },
    { label: t('history.tabs.healthy'),  value: 'healthy' as FilterHealth },
  ], [t])

  const queryParams = useMemo(() => ({
    page,
    per_page: PER_PAGE,
    is_healthy: filter === 'all' ? undefined : filter === 'healthy',
  }), [page, filter])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['history', queryParams],
    queryFn:   () => predictionsApi.list(queryParams),
    staleTime: 30 * 1000,
  })

  const scans       = data?.items ?? []
  const totalPages  = data?.total_pages ?? 1
  const total       = data?.total ?? 0

  const handleFilter = useCallback((f: FilterHealth) => {
    setFilter(f)
    setPage(1)
  }, [])

  return (
    <AppLayout title={t('history.title')}>
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-md font-heading font-bold text-on-surface tracking-tight">
              {t('history.title')}
            </h1>
            {data && (
              <p className="text-body-md text-on-surface-variant mt-0.5">
                {t('history.total_scans', { count: total })}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/analyse')}
            className={
              'hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full ' +
              'bg-primary/10 text-primary border border-primary/20 ' +
              'text-label-sm font-label hover:bg-primary/15 transition-colors'
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t('dashboard.new_scan')}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 glass rounded-2xl p-1.5">
          {filterOptions.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleFilter(value)}
              className={[
                'flex-1 py-2 rounded-xl text-label-sm font-label transition-all duration-200',
                filter === value
                  ? 'bg-primary text-on-primary shadow-neon-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="glass rounded-2xl overflow-hidden">
          {isLoading && (
            <div className="p-2 space-y-0.5">
              {Array.from({ length: 6 }).map((_, i) => <ListItemSkeleton key={i} />)}
            </div>
          )}

          {isError && (
            <div className="py-10 text-center space-y-3">
              <p className="text-body-md text-error">{t('history.failed')}</p>
              <button onClick={() => refetch()} className="text-label-sm text-primary underline">
                {t('common.retry')}
              </button>
            </div>
          )}

          {!isLoading && !isError && scans.length === 0 && (
            <EmptyState
              icon={<LeafEmptyIcon />}
              title={t('history.no_scans_title', { defaultValue: 'No scans here' })}
              description={
                filter === 'all'
                  ? t('history.no_scans_desc', { defaultValue: 'Upload your first crop image to start tracking your field health.' })
                  : t('history.no_filter_scans_desc', { filter: t('history.tabs.' + filter), defaultValue: 'No scans found.' })
              }
              action={{ label: t('dashboard.recent.action_btn'), onClick: () => navigate('/analyse') }}
              className="py-12"
            />
          )}

          {!isLoading && !isError && scans.length > 0 && (
            <div className="p-2 space-y-0.5">
              {scans.map((scan) => <HistoryRow key={scan.id} scan={scan} />)}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={
                'flex items-center gap-1.5 px-4 py-2 rounded-full glass ' +
                'text-label-sm font-label transition-all ' +
                (page === 1
                  ? 'text-on-surface-variant/30 cursor-not-allowed'
                  : 'text-on-surface hover:border-primary/30 hover:text-primary')
              }
            >
              ← {t('common.prev')}
            </button>

            <span className="text-label-sm font-label text-on-surface-variant">
              {t('common.page_info', { page, totalPages })}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={
                'flex items-center gap-1.5 px-4 py-2 rounded-full glass ' +
                'text-label-sm font-label transition-all ' +
                (page === totalPages
                  ? 'text-on-surface-variant/30 cursor-not-allowed'
                  : 'text-on-surface hover:border-primary/30 hover:text-primary')
              }
            >
              {t('common.next')} →
            </button>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
