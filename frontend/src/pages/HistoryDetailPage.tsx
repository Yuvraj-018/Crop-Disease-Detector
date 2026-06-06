import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppLayout } from '../components/layout/AppLayout'
import { SeverityBadge } from '../components/ui/Badge'
import { ConfidenceMeter } from '../components/ui/ProgressBar'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { predictionsApi } from '../api/predictions'
import { formatDateTime, formatConfidence } from '../lib/utils'
import type { Severity } from '../styles/tokens'
import type { Prediction, Treatment } from '../types'

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

// ─── Treatment type pill ──────────────────────────────────────────────────────

const typeStyles: Record<string, string> = {
  organic:    'bg-primary/10 text-primary border-primary/20',
  chemical:   'bg-blue-400/10 text-blue-400 border-blue-400/20',
  cultural:   'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  biological: 'bg-emerald/10 text-emerald border-emerald/20',
}

function TreatmentCard({ t: treat }: { t: Treatment }) {
  const { t } = useTranslation()
  const style = typeStyles[treat.type] ?? typeStyles.organic
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-title-sm font-heading font-semibold text-on-surface">{treat.name}</p>
        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-label-sm font-label border uppercase tracking-widest ${style}`}>
          {t('treatments.filter_' + treat.type, { defaultValue: treat.type })}
        </span>
      </div>

      <p className="text-body-sm text-on-surface-variant leading-relaxed">{treat.description}</p>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
        {treat.dosage && (
          <MetaRow icon="💊" label={t('treatments.details.dosage')} value={treat.dosage} />
        )}
        {treat.application_method && (
          <MetaRow icon="🌿" label={t('treatments.details.method')} value={treat.application_method} />
        )}
        {treat.timing && (
          <MetaRow icon="🕐" label={t('treatments.details.timing')} value={treat.timing} />
        )}
        {treat.waiting_period && (
          <MetaRow icon="⏳" label={t('treatments.details.waiting_period')} value={treat.waiting_period} />
        )}
        <MetaRow icon="💰" label={t('treatments.details.cost')} value={t('common.' + treat.cost_estimate, { defaultValue: treat.cost_estimate })} />
        <MetaRow icon="⚡" label={t('treatments.details.effectiveness')} value={t('common.' + treat.effectiveness, { defaultValue: treat.effectiveness })} />
      </div>

      {treat.is_certified_organic && (
        <span className="inline-flex items-center gap-1 text-label-sm font-label text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
          ✓ {t('treatments.details.organic_badge')}
        </span>
      )}
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5 col-span-1">
      <span className="text-sm leading-tight">{icon}</span>
      <div className="min-w-0">
        <p className="text-label-sm text-on-surface-variant font-label">{label}</p>
        <p className="text-body-sm text-on-surface capitalize">{value}</p>
      </div>
    </div>
  )
}

// ─── Feedback chip bar ────────────────────────────────────────────────────────

// Defined inside component now to support dynamic translations.

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryDetailPage() {
  const { t }     = useTranslation()
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const [tab, setTab] = useState<'overview' | 'treatments'>('overview')

  const feedbackOptions = useMemo(() => [
    { value: 'correct' as const,   label: `✓ ${t('analyse.feedback.correct', { defaultValue: 'Correct' })}`,   color: 'text-primary border-primary/30 bg-primary/10' },
    { value: 'incorrect' as const, label: `✗ ${t('analyse.feedback.incorrect', { defaultValue: 'Wrong' })}`,     color: 'text-error border-error/30 bg-error/10' },
    { value: 'unsure' as const,    label: `? ${t('analyse.feedback.unsure', { defaultValue: 'Unsure' })}`,    color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  ], [t])

  const { data: pred, isLoading, isError } = useQuery({
    queryKey: ['prediction', id],
    queryFn:  () => predictionsApi.get(id!),
    enabled:  !!id,
  })

  const feedbackMut = useMutation({
    mutationFn: (fb: 'correct' | 'incorrect' | 'unsure') =>
      predictionsApi.feedback(id!, { feedback: fb }),
    onSuccess: () => {
      toast.success(t('analyse.feedback.success', { defaultValue: 'Feedback saved!' }))
      qc.invalidateQueries({ queryKey: ['prediction', id] })
      qc.invalidateQueries({ queryKey: ['history'] })
    },
    onError: () => toast.error(t('analyse.feedback.error', { defaultValue: 'Could not save feedback.' })),
  })

  const deleteMut = useMutation({
    mutationFn: () => predictionsApi.delete(id!),
    onSuccess: () => {
      toast.success(t('history.details.delete_success', { defaultValue: 'Scan deleted.' }))
      navigate('/history', { replace: true })
      qc.invalidateQueries({ queryKey: ['history'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error(t('history.details.delete_error', { defaultValue: 'Could not delete scan.' })),
  })

  if (isLoading) return <AppLayout title={t('history.details.title', { defaultValue: 'Scan Detail' })} backHref="/history"><DetailSkeleton /></AppLayout>
  if (isError || !pred) {
    return (
      <AppLayout title={t('history.details.title', { defaultValue: 'Scan Detail' })} backHref="/history">
        <EmptyState
          icon={<span className="text-3xl">⚠️</span>}
          title={t('history.details.not_found_title', { defaultValue: 'Scan not found' })}
          description={t('history.details.not_found_desc', { defaultValue: "This scan may have been deleted or you don't have access." })}
          action={{ label: t('history.details.back', { defaultValue: 'Back to History' }), onClick: () => navigate('/history') }}
        />
      </AppLayout>
    )
  }

  const severity  = resolveSeverity(pred)
  const confPct   = Math.round((pred.confidence ?? 0) * 100)
  const topLabel  = pred.top_predictions?.[0]?.label
    ? formatLabel(pred.top_predictions[0].label)
    : pred.is_healthy ? t('common.healthy') : t('analyse.results.unknown', { defaultValue: 'Unknown' })

  // Treatments from the prediction's nested disease (if backend returns them)
  const treatments: Treatment[] = (pred as unknown as { disease?: { treatments?: Treatment[] } })
    ?.disease?.treatments ?? []

  return (
    <AppLayout title="Scan Detail" backHref="/history">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Hero image ─────────────────────────────────────────────────── */}
        <div className="glass rounded-3xl overflow-hidden">
          <div className="relative h-56 bg-surface-container-highest">
            {pred.image_url ? (
              <img src={pred.image_url} alt={topLabel} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20 text-6xl">🌿</div>
            )}
            {/* Severity badge overlay */}
            <div className="absolute top-3 left-3">
              <SeverityBadge severity={severity} showDot />
            </div>
            <div className="absolute top-3 right-3 glass-heavy rounded-lg px-2.5 py-1">
              <p className="text-label-sm font-label text-on-surface-variant">{formatDateTime(pred.created_at)}</p>
            </div>
          </div>

          {/* Title bar */}
          <div className="px-5 py-4 border-t border-white/[0.04]">
            <h2 className="text-title-lg font-heading font-bold text-on-surface">{topLabel}</h2>
            {pred.original_filename && (
              <p className="text-label-sm font-label text-on-surface-variant mt-0.5">{pred.original_filename}</p>
            )}
          </div>
        </div>

        {/* ── Confidence + Feedback ──────────────────────────────────────── */}
        <div className="glass rounded-2xl p-5 flex items-center gap-6">
          <ConfidenceMeter value={confPct} size={88} strokeWidth={8} label={t('analyse.results.confidence')} />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-widest mb-1.5">
                {t('analyse.feedback.desc')}
              </p>
              <div className="flex gap-2 flex-wrap">
                {feedbackOptions.map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => feedbackMut.mutate(value)}
                    disabled={feedbackMut.isPending}
                    className={[
                      'px-3 py-1.5 rounded-full text-label-sm font-label border transition-all active:scale-95',
                      pred.feedback === value
                        ? color + ' font-semibold'
                        : 'text-on-surface-variant border-white/[0.08] hover:border-white/20',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {pred.model_version && (
              <p className="text-label-sm font-label text-on-surface-variant">
                Model: <span className="text-primary font-mono">{pred.model_version}</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex glass rounded-2xl p-1.5 gap-1.5">
          {(['overview', 'treatments'] as const).map((tValue) => (
            <button
              key={tValue}
              onClick={() => setTab(tValue)}
              className={[
                'flex-1 py-2 rounded-xl text-label-sm font-label capitalize transition-all',
                tab === tValue
                  ? 'bg-primary text-on-primary shadow-neon-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface',
              ].join(' ')}
            >
              {tValue === 'overview' ? t('history.details.tab_overview', { defaultValue: 'Overview' }) : t('nav.treatments')}
            </button>
          ))}
        </div>

        {/* ── Overview tab ──────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-3">
            {/* Top predictions */}
            {pred.top_predictions && pred.top_predictions.length > 0 && (
              <div className="glass rounded-2xl p-4 space-y-2">
                <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-widest mb-3">
                  {t('analyse.results.top_predictions', { defaultValue: 'Top Predictions' })}
                </p>
                {pred.top_predictions.map((pr, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-label-sm font-label text-on-surface-variant w-5 shrink-0">{i + 1}</span>
                    <p className="text-body-sm text-on-surface flex-1 truncate">{formatLabel(pr.label)}</p>
                    <span className="text-label-sm font-label text-primary shrink-0">{formatConfidence(pr.confidence)}</span>
                    <div className="w-16 h-1 rounded-full bg-surface-container-highest overflow-hidden shrink-0">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pr.confidence * 100}%`, opacity: 1 - i * 0.15 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Location */}
            {(pred.latitude != null && pred.longitude != null) && (
              <div className="glass rounded-2xl p-4 flex items-center gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-label-sm font-label text-on-surface-variant">{t('history.details.gps_location', { defaultValue: 'GPS Location' })}</p>
                  <p className="text-body-sm text-on-surface font-mono">
                    {pred.latitude.toFixed(5)}, {pred.longitude.toFixed(5)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Treatments tab ─────────────────────────────────────────────── */}
        {tab === 'treatments' && (
          <div className="space-y-3">
            {treatments.length === 0 ? (
              <EmptyState
                icon={<span className="text-3xl">🌿</span>}
                title={t('treatments.no_results')}
                description={
                  pred.is_healthy
                    ? t('analyse.results.healthy_desc')
                    : t('treatments.no_results_desc', { defaultValue: "Treatment data for this disease hasn't been added yet." })
                }
                className="py-8"
              />
            ) : (
              treatments.map((treatItem) => <TreatmentCard key={treatItem.id} t={treatItem} />)
            )}
          </div>
        )}

        {/* ── Delete ─────────────────────────────────────────────────────── */}
        <div className="pt-2 border-t border-white/[0.04]">
          <button
            onClick={() => {
              if (confirm(t('history.details.delete_confirm', { defaultValue: 'Delete this scan permanently?' }))) deleteMut.mutate()
            }}
            disabled={deleteMut.isPending}
            className="w-full py-3 rounded-2xl text-error text-body-sm font-label hover:bg-error/10 transition-colors"
          >
            {deleteMut.isPending ? t('history.details.deleting', { defaultValue: 'Deleting…' }) : t('history.details.delete_btn', { defaultValue: '🗑 Delete this scan' })}
          </button>
        </div>

      </div>
    </AppLayout>
  )
}
