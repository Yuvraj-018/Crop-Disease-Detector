import { useState, useMemo, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../components/layout/AppLayout'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { treatmentsApi } from '../api/library'
import type { Treatment } from '../types'

// ─── Type config ─────────────────────────────────────────────────────────────

type TreatFilter = 'all' | 'organic' | 'chemical' | 'cultural' | 'biological'

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  organic:    { label: 'Organic',    icon: '🌿', color: 'text-primary border-primary/25 bg-primary/10' },
  chemical:   { label: 'Chemical',   icon: '⚗️', color: 'text-blue-400 border-blue-400/25 bg-blue-400/10' },
  cultural:   { label: 'Cultural',   icon: '👨‍🌾', color: 'text-yellow-400 border-yellow-400/25 bg-yellow-400/10' },
  biological: { label: 'Biological', icon: '🦠', color: 'text-emerald border-emerald/25 bg-emerald/10' },
}

const effectivenessColor: Record<string, string> = {
  high:   'text-primary',
  medium: 'text-yellow-400',
  low:    'text-error',
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-on-surface-variant/50">
      <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

// ─── Treatment Card ───────────────────────────────────────────────────────────

const TreatCard = memo(function TreatCard({ t: treat }: { t: Treatment }) {
  const { t } = useTranslation()
  const cfg = typeConfig[treat.type] ?? typeConfig.organic
  const stars = ['high', 'medium', 'low'].indexOf(treat.effectiveness) <= 0 ? '★★★' : treat.effectiveness === 'medium' ? '★★☆' : '★☆☆'

  return (
    <div className="glass rounded-2xl p-4 space-y-3 hover:shadow-neon-sm transition-all duration-200 hover:border-primary/15">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-title-sm font-heading font-semibold text-on-surface leading-tight">{treat.name}</p>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label border ${cfg.color}`}>
          <span>{cfg.icon}</span> {t('treatments.filter_' + treat.type, { defaultValue: cfg.label })}
        </span>
      </div>

      <p className="text-body-sm text-on-surface-variant leading-relaxed line-clamp-2">{treat.description}</p>

      {/* Pills row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Effectiveness */}
        <span className={`text-label-sm font-label ${effectivenessColor[treat.effectiveness] ?? 'text-on-surface-variant'}`}>
          {stars} {t('common.' + treat.effectiveness, { defaultValue: treat.effectiveness })} {t('treatments.details.effectiveness', { defaultValue: 'effectiveness' })}
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="text-label-sm font-label text-on-surface-variant capitalize">
          {t('common.' + treat.cost_estimate, { defaultValue: treat.cost_estimate })} {t('treatments.details.cost', { defaultValue: 'cost' })}
        </span>
        {treat.is_certified_organic && (
          <>
            <span className="h-3 w-px bg-white/10" />
            <span className="text-label-sm font-label text-primary">✓ {t('treatments.details.organic_badge', { defaultValue: 'Organic' })}</span>
          </>
        )}
      </div>

      {/* Dosage / method */}
      {(treat.dosage || treat.application_method) && (
        <div className="pt-2 border-t border-white/[0.04] grid grid-cols-2 gap-2">
          {treat.dosage && (
            <div>
              <p className="text-label-sm font-label text-on-surface-variant">{t('treatments.details.dosage', { defaultValue: 'Dosage' })}</p>
              <p className="text-body-sm text-on-surface">{treat.dosage}</p>
            </div>
          )}
          {treat.application_method && (
            <div>
              <p className="text-label-sm font-label text-on-surface-variant">{t('treatments.details.method', { defaultValue: 'Method' })}</p>
              <p className="text-body-sm text-on-surface">{treat.application_method}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-2xl" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TreatmentsPage() {
  const { t } = useTranslation()
  const [typeFilter, setTypeFilter] = useState<TreatFilter>('all')
  const [search, setSearch]         = useState('')
  const [organicOnly, setOrganicOnly] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey:  ['treatments', typeFilter, organicOnly],
    queryFn:   () => treatmentsApi.list({
      per_page: 100,
      type: typeFilter === 'all' ? undefined : typeFilter,
      is_certified_organic: organicOnly ? true : undefined,
    }),
    staleTime: 10 * 60 * 1000,  // 10-min — rarely changes
  })

  const treatments = useMemo(() => {
    const items = data?.items ?? []
    if (!search.trim()) return items
    const s = search.toLowerCase()
    return items.filter(
      (treatItem) =>
        treatItem.name.toLowerCase().includes(s) ||
        treatItem.description.toLowerCase().includes(s) ||
        treatItem.type.toLowerCase().includes(s),
    )
  }, [data, search])

  return (
    <AppLayout title={t('nav.treatments')}>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-headline-md font-heading font-bold text-on-surface tracking-tight">
            {t('treatments.title')}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            {t('treatments.subtitle', { defaultValue: 'Research-backed remedies for detected crop diseases.' })}
          </p>
        </div>

        {/* Search + Organic toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('treatments.search_placeholder')}
              className={
                'w-full pl-10 pr-4 py-2.5 rounded-2xl glass ' +
                'text-body-sm text-on-surface placeholder:text-on-surface-variant/40 ' +
                'border border-white/[0.06] focus:border-primary/30 focus:outline-none ' +
                'transition-colors bg-transparent'
              }
            />
          </div>
          <button
            onClick={() => setOrganicOnly((v) => !v)}
            className={[
              'flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-label-sm font-label border transition-all',
              organicOnly
                ? 'bg-primary/10 text-primary border-primary/25 shadow-neon-sm'
                : 'glass text-on-surface-variant border-white/[0.06] hover:border-white/15',
            ].join(' ')}
          >
            🌿 {t('treatments.filter_organic')}
          </button>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {(['all', 'organic', 'chemical', 'cultural', 'biological'] as TreatFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={[
                'shrink-0 px-4 py-2 rounded-full text-label-sm font-label border transition-all',
                typeFilter === f
                  ? 'bg-primary text-on-primary border-primary shadow-neon-sm'
                  : 'glass text-on-surface-variant border-white/[0.06] hover:border-white/20 capitalize',
              ].join(' ')}
            >
              {f === 'all' ? t('treatments.filter_all') : `${typeConfig[f]?.icon} ${t('treatments.filter_' + f, { defaultValue: typeConfig[f]?.label })}`}
            </button>
          ))}
        </div>

        {/* Count label */}
        {!isLoading && !isError && (
          <p className="text-label-sm font-label text-on-surface-variant">
            {t('treatments.count_found', { count: treatments.length, defaultValue: '{{count}} treatments found' })}
          </p>
        )}

        {/* Content */}
        {isLoading && <GridSkeleton />}

        {isError && (
          <EmptyState
            icon={<span className="text-3xl">⚠️</span>}
            title={t('treatments.error_title', { defaultValue: 'Failed to load treatments' })}
            description={t('treatments.error_desc', { defaultValue: 'Please check your connection and try again.' })}
          />
        )}

        {!isLoading && !isError && treatments.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl">🌿</span>}
            title={t('treatments.no_results')}
            description={t('treatments.no_results_desc_search', { defaultValue: 'Try adjusting your filters or search term.' })}
            action={{ label: t('treatments.clear_filters', { defaultValue: 'Clear Filters' }), onClick: () => { setSearch(''); setTypeFilter('all'); setOrganicOnly(false) } }}
          />
        )}

        {!isLoading && !isError && treatments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {treatments.map((tItem) => <TreatCard key={tItem.id} t={tItem} />)}
          </div>
        )}

      </div>
    </AppLayout>
  )
}
