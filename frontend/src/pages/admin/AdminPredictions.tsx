import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ListItemSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { SeverityBadge } from '../../components/ui/Badge'
import { predictionsApi } from '../../api/predictions'
import { formatDateTime, formatConfidence } from '../../lib/utils'
import type { Prediction } from '../../types'
import type { Severity } from '../../styles/tokens'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveSeverity(p: Prediction): Severity {
  if (p.is_healthy) return 'healthy'
  const c = p.confidence ?? 0
  if (c >= 0.85) return 'critical'
  if (c >= 0.65) return 'high'
  if (c >= 0.4)  return 'medium'
  return 'low'
}

function formatLabel(raw: string) {
  return raw.replace(/___/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Filter ───────────────────────────────────────────────────────────────────

type FilterH = 'all' | 'healthy' | 'diseased'

const filterOptions: { label: string; value: FilterH }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Diseased', value: 'diseased' },
  { label: 'Healthy',  value: 'healthy' },
]

// ─── Row ─────────────────────────────────────────────────────────────────────

function ScanRow({ p }: { p: Prediction }) {
  const severity = resolveSeverity(p)
  const label    = p.top_predictions?.[0]?.label
    ? formatLabel(p.top_predictions[0].label)
    : p.is_healthy ? 'Healthy' : 'Unknown'

  return (
    <Link
      to={`/history/${p.id}`}
      className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-surface-container-high transition-colors group"
    >
      {/* Thumbnail */}
      <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-surface-container-highest border border-white/[0.04]">
        {p.thumbnail_url ? (
          <img src={p.thumbnail_url} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">🌿</div>
        )}
      </div>

      {/* Label */}
      <p className="flex-1 min-w-0 text-body-sm font-heading font-semibold text-on-surface truncate">{label}</p>

      {/* Model version */}
      <span className="hidden md:block shrink-0 text-label-sm font-mono text-on-surface-variant w-20 truncate">
        {p.model_version ?? '—'}
      </span>

      {/* Confidence */}
      <span className="hidden sm:block shrink-0 text-label-sm font-label text-primary w-14 text-right">
        {p.confidence != null ? formatConfidence(p.confidence) : '—'}
      </span>

      {/* Severity */}
      <div className="shrink-0">
        <SeverityBadge severity={severity} showDot />
      </div>

      {/* Feedback */}
      <span className="hidden lg:block shrink-0 text-label-sm font-label text-on-surface-variant w-16 capitalize">
        {p.feedback ?? '—'}
      </span>

      {/* Time */}
      <span className="hidden xl:block shrink-0 text-label-sm font-label text-on-surface-variant w-32 text-right">
        {formatDateTime(p.created_at)}
      </span>

      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-on-surface-variant/40 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPredictions() {
  const [page, setPage]     = useState(1)
  const [filter, setFilter] = useState<FilterH>('all')

  const params = {
    page,
    per_page: 25,
    is_healthy: filter === 'all' ? undefined : filter === 'healthy',
  }

  const { data, isLoading, isError } = useQuery({
    queryKey:  ['admin', 'predictions', params],
    queryFn:   () => predictionsApi.list(params),
    staleTime: 15_000,
  })

  const preds      = data?.items ?? []
  const totalPages = data?.total_pages ?? 1
  const total      = data?.total ?? 0

  return (
    <div className="max-w-6xl space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline-sm font-heading font-bold text-on-surface">Prediction Logs</h2>
          {data && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              {total.toLocaleString('en-IN')} total scans platform-wide
            </p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 glass rounded-2xl p-1.5 max-w-xs">
        {filterOptions.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setFilter(value); setPage(1) }}
            className={[
              'flex-1 py-2 rounded-xl text-label-sm font-label transition-all',
              filter === value
                ? 'bg-primary text-on-primary shadow-neon-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-label-sm font-label text-on-surface-variant uppercase tracking-widest">
        <div className="w-10 shrink-0" />
        <p className="flex-1">Prediction</p>
        <p className="hidden md:block w-20 shrink-0">Model</p>
        <p className="hidden sm:block w-14 shrink-0 text-right">Conf.</p>
        <p className="shrink-0">Severity</p>
        <p className="hidden lg:block w-16 shrink-0">Feedback</p>
        <p className="hidden xl:block w-32 shrink-0 text-right">Time</p>
        <div className="w-4 shrink-0" />
      </div>

      {/* List */}
      <div className="glass rounded-2xl overflow-hidden">
        {isLoading && (
          <div className="p-2 space-y-0.5">
            {Array.from({ length: 10 }).map((_, i) => <ListItemSkeleton key={i} />)}
          </div>
        )}

        {isError && (
          <div className="py-10 text-center">
            <p className="text-body-md text-error">Failed to load predictions.</p>
          </div>
        )}

        {!isLoading && !isError && preds.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl">🔬</span>}
            title="No predictions found"
            description="No scans match your current filter."
            className="py-12"
          />
        )}

        {!isLoading && !isError && preds.length > 0 && (
          <div className="p-2 space-y-0.5">
            {preds.map((p) => <ScanRow key={p.id} p={p} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-full glass text-label-sm font-label transition-all ${page === 1 ? 'text-on-surface-variant/30 cursor-not-allowed' : 'text-on-surface hover:text-primary'}`}
          >
            ← Prev
          </button>
          <span className="text-label-sm font-label text-on-surface-variant">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-full glass text-label-sm font-label transition-all ${page === totalPages ? 'text-on-surface-variant/30 cursor-not-allowed' : 'text-on-surface hover:text-primary'}`}
          >
            Next →
          </button>
        </div>
      )}

    </div>
  )
}
