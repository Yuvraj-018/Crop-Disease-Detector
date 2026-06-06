import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppLayout } from '../components/layout/AppLayout'
import { useAnalyseMutation } from '../hooks/useAnalyse'
import type { Prediction } from '../types'
import { formatConfidence } from '../lib/utils'
import { SeverityBadge } from '../components/ui/Badge'
import { ConfidenceMeter } from '../components/ui/ProgressBar'
import type { Severity } from '../styles/tokens'

// ─── Types ───────────────────────────────────────────────────────────────────

type PageState = 'idle' | 'preview' | 'processing' | 'result'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveSeverity(p: Prediction): Severity {
  if (p.is_healthy) return 'healthy'
  const c = p.confidence ?? 0
  if (c >= 0.85) return 'critical'
  if (c >= 0.65) return 'high'
  if (c >= 0.4) return 'medium'
  return 'low'
}

function formatLabel(raw: string): string {
  return raw
    .replace(/___/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

// ─── Corner Brackets (targeting reticle) ─────────────────────────────────────

function ReticleBrackets({ active }: { active: boolean }) {
  const base = 'absolute w-6 h-6 border-2 transition-all duration-500'
  const color = active ? 'border-primary' : 'border-primary/30'
  return (
    <>
      <span className={`${base} ${color} top-3 left-3 border-r-0 border-b-0 rounded-tl-lg`} />
      <span className={`${base} ${color} top-3 right-3 border-l-0 border-b-0 rounded-tr-lg`} />
      <span className={`${base} ${color} bottom-3 left-3 border-r-0 border-t-0 rounded-bl-lg`} />
      <span className={`${base} ${color} bottom-3 right-3 border-l-0 border-t-0 rounded-br-lg`} />
    </>
  )
}

// ─── Processing Overlay ───────────────────────────────────────────────────────

function ProcessingOverlay({ preview }: { preview: string | null }) {
  const { t } = useTranslation()
  return (
    <div className="relative rounded-3xl overflow-hidden border border-primary/20 shadow-neon-md">
      {/* Background image / placeholder */}
      <div className="relative h-64 bg-surface-container-highest">
        {preview ? (
          <img src={preview} alt="Scanning" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-highest" />
        )}

        {/* Scan sweep line */}
        <div
          className="scan-sweep absolute inset-x-0 top-0 h-8 pointer-events-none"
          aria-hidden
        />

        {/* Radar ring animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Pulsing rings */}
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute rounded-full border border-primary/30"
                style={{
                  width:  `${80 + i * 36}px`,
                  height: `${80 + i * 36}px`,
                  animation: `pulse-scale 2.4s ease-out ${i * 0.6}s infinite`,
                  opacity: 1 - i * 0.28,
                }}
              />
            ))}
            {/* Center dot */}
            <span className="h-4 w-4 rounded-full bg-primary shadow-neon-sm animate-pulse-glow" />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="glass-heavy px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow shrink-0" />
          <p className="text-title-sm font-heading font-semibold text-on-surface">
            {t('analyse.diagnosing')}
            <span className="inline-flex gap-0.5 ml-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 rounded-full bg-primary"
                  style={{ animation: `pulse-scale 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </span>
          </p>
        </div>
        <p className="text-body-sm text-on-surface-variant font-label">
          {t('analyse.diagnosing_sub', { defaultValue: 'Analyzing leaf morphology and color patterns...' })}
        </p>

        {/* Indeterminate progress bar */}
        <div className="relative h-1 rounded-full bg-surface-container-highest overflow-hidden">
          <div className="progress-indeterminate absolute inset-0" />
        </div>
      </div>
    </div>
  )
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({
  prediction,
  onScanAgain,
}: {
  prediction: Prediction
  onScanAgain: () => void
}) {
  const navigate  = useNavigate()
  const { t }     = useTranslation()
  const severity  = resolveSeverity(prediction)
  const confPct   = Math.round((prediction.confidence ?? 0) * 100)
  const topLabel  = prediction.top_predictions?.[0]?.label
    ? formatLabel(prediction.top_predictions[0].label)
    : prediction.is_healthy ? t('analyse.results.healthy_title') : t('analyse.results.unknown', { defaultValue: 'Unknown Disease' })

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Hero confidence ring */}
      <div className="glass rounded-3xl p-6 flex flex-col items-center gap-4">
        <ConfidenceMeter value={confPct} size={108} strokeWidth={9} label={t('analyse.results.confidence')} />
        <div className="text-center">
          <p className="text-headline-sm font-heading font-bold text-on-surface tracking-tight">
            {topLabel}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <SeverityBadge severity={severity} showDot pulse={severity === 'healthy'} />
          </div>
        </div>
      </div>

      {/* Top 5 predictions */}
      {prediction.top_predictions && prediction.top_predictions.length > 1 && (
        <div className="glass rounded-2xl p-4 space-y-2">
          <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-widest mb-3">
            {t('analyse.results.top_predictions', { defaultValue: 'Top Predictions' })}
          </p>
          {prediction.top_predictions.map((pr, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-label-sm font-label text-on-surface-variant w-4 shrink-0">{i + 1}</span>
              <p className="text-body-sm text-on-surface flex-1 truncate">{formatLabel(pr.label)}</p>
              <span className="text-label-sm font-label text-primary shrink-0">
                {formatConfidence(pr.confidence)}
              </span>
              {/* Mini bar */}
              <div className="w-12 h-1 rounded-full bg-surface-container-highest overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pr.confidence * 100}%`, opacity: 1 - i * 0.15 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate(`/history/${prediction.id}`)}
          className={
            'px-4 py-3 rounded-2xl glass text-body-sm font-label text-on-surface ' +
            'hover:bg-surface-container-high hover:shadow-neon-sm transition-all active:scale-95'
          }
        >
          {t('analyse.results.view_report', { defaultValue: 'View Full Report →' })}
        </button>
        <button
          onClick={onScanAgain}
          className={
            'px-4 py-3 rounded-2xl bg-primary text-on-primary text-body-sm font-label font-semibold ' +
            'shadow-neon-md hover:shadow-neon-lg transition-all active:scale-95'
          }
        >
          {t('analyse.results.reanalyse', { defaultValue: 'Scan Again' })}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalysePage() {
  const { t } = useTranslation()
  const [pageState,  setPageState]  = useState<PageState>('idle')
  const [file,       setFile]       = useState<File | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [result,     setResult]     = useState<Prediction | null>(null)
  const { mutateAsync, isPending }  = useAnalyseMutation()

  // ── File handling ──────────────────────────────────────────────────────────
  const acceptFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error(t('analyse.toast.invalid_type', { defaultValue: 'Please upload a JPEG or PNG image.' }))
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error(t('analyse.toast.large_file', { defaultValue: 'Image must be under 10 MB.' }))
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setPageState('preview')
  }, [t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    noClick: true,           // we handle the click ourselves for styling control
    onDrop: (accepted) => { if (accepted[0]) acceptFile(accepted[0]) },
  })

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setResult(null)
    setPageState('idle')
  }

  const handleAnalyse = async () => {
    if (!file) return
    setPageState('processing')
    try {
      const pred = await mutateAsync({ file })
      setResult(pred)
      setPageState('result')
      toast.success(t('analyse.toast.success', { defaultValue: 'Scan complete!' }))
    } catch {
      // Error toast shown via onError in the hook
      setPageState('preview')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout title={t('nav.scan')}>
      {/*
        max-w-4xl keeps the content from stretching on 27-inch monitors.
        On mobile it's full-width with standard padding from AppLayout.
      */}
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-headline-md font-heading font-bold text-on-surface tracking-tight">
            {t('analyse.title')}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            {t('analyse.subtitle')}
          </p>
        </div>

        {/* ── Result view ─────────────────────────────────────────────────── */}
        {pageState === 'result' && result && (
          <ResultCard prediction={result} onScanAgain={handleClear} />
        )}

        {/* ── Processing overlay ──────────────────────────────────────────── */}
        {pageState === 'processing' && (
          <div className="space-y-4">
            <ProcessingOverlay preview={preview} />

            {/* Cancel */}
            <div className="text-center">
              <button
                onClick={handleClear}
                disabled={isPending}
                className="text-label-sm font-label text-on-surface-variant hover:text-error transition-colors uppercase tracking-wider"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* ── Idle / Preview upload zone ──────────────────────────────────── */}
        {(pageState === 'idle' || pageState === 'preview') && (
          <div className="space-y-4">

            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={[
                'relative rounded-3xl overflow-hidden transition-all duration-300',
                'border-2 border-dashed',
                isDragActive
                  ? 'border-primary bg-primary/5 shadow-neon-md'
                  : pageState === 'preview'
                  ? 'border-primary/30 shadow-neon-sm'
                  : 'reticle-pulse border-primary/25',
              ].join(' ')}
            >
              <input {...getInputProps()} />

              {/* Targeting corner brackets */}
              <ReticleBrackets active={isDragActive || pageState === 'preview'} />

              {/* ── IDLE state content ──────────────────────────────────── */}
              {pageState === 'idle' && (
                <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center">
                  {/* Upload icon */}
                  <div
                    className="h-20 w-20 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'rgba(0,230,118,0.06)',
                      boxShadow:  '0 0 32px rgba(0,230,118,0.12)',
                      border:     '1px solid rgba(0,230,118,0.15)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9 text-primary drop-shadow-[0_0_8px_rgba(0,230,118,0.6)]">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <p className="text-title-md font-heading font-bold text-on-surface">
                      {isDragActive ? t('analyse.dropzone.active') : t('analyse.dropzone.idle')}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {t('analyse.dropzone.or_tap', { defaultValue: 'or tap an option below to upload' })}
                    </p>
                  </div>

                  <p className="text-label-sm font-label text-on-surface-variant/50 uppercase tracking-widest">
                    {t('analyse.dropzone.helper')}
                  </p>
                </div>
              )}

              {/* ── PREVIEW state content ───────────────────────────────── */}
              {pageState === 'preview' && preview && (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-72 object-cover"
                  />
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClear() }}
                    className={
                      'absolute top-3 right-3 h-8 w-8 rounded-full ' +
                      'bg-surface-container-high/80 backdrop-blur text-on-surface ' +
                      'flex items-center justify-center hover:bg-error/20 hover:text-error ' +
                      'transition-colors border border-white/10'
                    }
                    aria-label="Remove image"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  {/* File info bar */}
                  <div className="glass-heavy px-4 py-2.5 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-primary shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="text-body-sm text-on-surface truncate flex-1">{file?.name}</span>
                    <span className="text-label-sm font-label text-on-surface-variant shrink-0">
                      {file ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Upload options row ──────────────────────────────────────── */}
            {pageState === 'idle' && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: t('analyse.options.camera', { defaultValue: 'Camera' }),  emoji: '📷', accept: 'image/*', capture: 'environment' },
                  { label: t('analyse.options.gallery', { defaultValue: 'Gallery' }), emoji: '🖼️', accept: 'image/*', capture: undefined },
                  { label: t('analyse.options.files', { defaultValue: 'Files' }),   emoji: '📁', accept: '.jpg,.jpeg,.png', capture: undefined },
                ].map(({ label, emoji, accept, capture }) => (
                  <button
                    key={label}
                    onClick={() => {
                      const inp = document.createElement('input')
                      inp.type   = 'file'
                      inp.accept = accept
                      if (capture) inp.setAttribute('capture', capture)
                      inp.onchange = (e) => {
                        const f = (e.target as HTMLInputElement).files?.[0]
                        if (f) acceptFile(f)
                      }
                      inp.click()
                    }}
                    className={
                      'flex flex-col items-center gap-1.5 py-4 rounded-2xl ' +
                      'glass hover:bg-surface-container-high hover:shadow-neon-sm ' +
                      'transition-all duration-200 active:scale-95'
                    }
                  >
                    <span className="text-2xl leading-none">{emoji}</span>
                    <span className="text-label-sm font-label text-on-surface-variant">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Analyse Now CTA ─────────────────────────────────────────── */}
            {pageState === 'preview' && (
              <button
                onClick={handleAnalyse}
                className={
                  'w-full py-4 rounded-2xl bg-primary text-on-primary ' +
                  'text-title-sm font-heading font-bold tracking-tight ' +
                  'shadow-neon-md hover:shadow-neon-lg transition-all duration-200 ' +
                  'active:scale-[0.98] flex items-center justify-center gap-2'
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
                {t('analyse.action_btn', { defaultValue: 'Analyse Now' })}
              </button>
            )}

            {/* ── What we analyse info card ───────────────────────────────── */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-widest">
                {t('analyse.info.title', { defaultValue: 'What we analyse' })}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  t('analyse.info.fungal', { defaultValue: 'Fungal infections' }),
                  t('analyse.info.bacterial', { defaultValue: 'Bacterial diseases' }),
                  t('analyse.info.nutrient', { defaultValue: 'Nutrient deficiencies' }),
                  t('analyse.info.viral', { defaultValue: 'Viral diseases' }),
                  t('analyse.info.pest', { defaultValue: 'Pest damage' }),
                  t('analyse.info.classes', { defaultValue: '38 disease classes' }),
                ].map((chip) => (
                  <span
                    key={chip}
                    className="px-3 py-1 rounded-full text-label-sm font-label bg-surface-container-high text-on-surface-variant border border-white/[0.05]"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="flex items-start gap-3 pt-1 border-t border-white/[0.04]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-primary mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-body-sm text-on-surface-variant">
                  {t('analyse.info.tip', { defaultValue: 'For best results, photograph a single leaf in good lighting with a plain background.' })}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Inline keyframes for pulse-scale (not in Tailwind by default) */}
      <style>{`
        @keyframes pulse-scale {
          0%   { transform: scale(0.9); opacity: 0.8; }
          50%  { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
      `}</style>
    </AppLayout>
  )
}
