import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../components/layout/AppLayout'
import { outbreakApi } from '../api/library'
import type { OutbreakPoint } from '../api/library'

// ─── Severity → color map ─────────────────────────────────────────────────────

const severityColor: Record<string, string> = {
  healthy:  '#3fff8b',
  low:      '#10B981',
  medium:   '#fbbf24',
  high:     '#f97316',
  critical: '#ff716c',
}

function getColor(severity: string): string {
  return severityColor[severity.toLowerCase()] ?? '#3fff8b'
}

// ─── Leaflet Map component (lazy init to avoid SSR issues) ────────────────────

interface MapProps {
  points: OutbreakPoint[]
}

function OutbreakLeafletMap({ points }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<unknown>(null)
  const { t }        = useTranslation()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Dynamically import Leaflet to avoid build issues with SSR
    import('leaflet').then((L) => {
      // Leaflet default icon fix (Vite doesn't resolve the PNG URLs automatically)
      // We'll use CircleMarker instead, which needs no icons
      const map = L.map(containerRef.current!, {
        center:    [20.5937, 78.9629],   // Centre of India
        zoom:      5,
        zoomControl: true,
        attributionControl: true,
      })

      // Dark tile layer (CartoDB dark matter — free, no API key needed)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 18,
        },
      ).addTo(map)

      // Plot outbreak points as glowing circle markers
      points.forEach((pt) => {
        const color = getColor(pt.severity)

        // Outer glow ring
        L.circleMarker([pt.latitude, pt.longitude], {
          radius:      Math.min(6 + pt.count * 1.5, 22),
          fillColor:   color,
          fillOpacity: 0.15,
          color:       color,
          weight:      1,
          opacity:     0.4,
        }).addTo(map)

        // Inner marker
        const marker = L.circleMarker([pt.latitude, pt.longitude], {
          radius:      Math.min(4 + pt.count, 14),
          fillColor:   color,
          fillOpacity: 0.85,
          color:       '#0b0f0c',
          weight:      1.5,
          opacity:     1,
        }).addTo(map)

        // Popup
        marker.bindPopup(`
          <div style="
            background: rgba(21,27,23,0.97);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 12px 14px;
            color: #f9fdf7;
            font-family: 'Manrope', sans-serif;
            min-width: 160px;
          ">
            <p style="font-weight:700;font-size:14px;margin:0 0 4px">${pt.disease_name}</p>
            <p style="font-size:12px;color:#a8aca6;margin:0 0 6px">
              ${t('outbreak.cases_count', { count: pt.count, defaultValue: `${pt.count} cases` })}
            </p>
            <span style="
              display:inline-block;
              background:${color}22;
              color:${color};
              border:1px solid ${color}44;
              border-radius:9999px;
              padding:2px 10px;
              font-size:11px;
              font-weight:600;
              letter-spacing:.05em;
              text-transform:uppercase;
            ">${t('common.' + pt.severity.toLowerCase(), { defaultValue: pt.severity })}</span>
          </div>
        `, {
          className: 'leaflet-popup-dark',
          maxWidth: 220,
        })
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])   // run once on mount

  // If points change after initial render, update markers
  useEffect(() => {
    // For now, points are fetched once and the map is initialised.
    // A full implementation would clear + redraw markers on points change.
  }, [points])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: 'calc(100vh - var(--topbar-height) - var(--bottomnav-height, 0px))' }}
    />
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function MapLegend() {
  const { t } = useTranslation()
  const entries = [
    { label: t('common.critical'), color: '#ff716c' },
    { label: t('common.high'),     color: '#f97316' },
    { label: t('common.medium'),   color: '#fbbf24' },
    { label: t('common.low'),      color: '#10B981' },
    { label: t('common.healthy'),  color: '#3fff8b' },
  ]
  return (
    <div
      className="absolute bottom-6 right-4 z-[1000] glass-heavy rounded-2xl p-3 space-y-1.5"
      style={{ minWidth: 130 }}
    >
      <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-widest mb-2">
        {t('analyse.results.severity')}
      </p>
      {entries.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
          />
          <span className="text-label-sm font-label text-on-surface">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ points }: { points: OutbreakPoint[] }) {
  const { t, i18n } = useTranslation()
  const totalCases   = points.reduce((s, p) => s + p.count, 0)
  const uniqueDiseases = new Set(points.map((p) => p.disease_name)).size
  const criticalCount  = points.filter((p) => p.severity === 'critical').length

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass-heavy rounded-2xl px-4 py-2.5 flex items-center gap-5">
      {[
        { label: t('outbreak.stats.hotspots', { defaultValue: 'Hotspots' }),   value: points.length.toString() },
        { label: t('outbreak.stats.cases', { defaultValue: 'Cases' }),      value: totalCases.toLocaleString(i18n.language.startsWith('hi') ? 'hi-IN' : 'en-IN') },
        { label: t('outbreak.stats.diseases', { defaultValue: 'Diseases' }),   value: uniqueDiseases.toString() },
        { label: t('common.critical'),   value: criticalCount.toString(), red: true },
      ].map(({ label, value, red }) => (
        <div key={label} className="text-center">
          <p className={`text-title-sm font-heading font-bold leading-none ${red ? 'text-error' : 'text-primary'}`}>
            {value}
          </p>
          <p className="text-label-sm font-label text-on-surface-variant mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutbreakMapPage() {
  const { t } = useTranslation()
  const { data: points = [], isLoading, isError } = useQuery<OutbreakPoint[]>({
    queryKey:  ['outbreak'],
    queryFn:   outbreakApi.getData,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <AppLayout title={t('nav.outbreak')} noPadding>
      {/* Inject Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* Override leaflet popup background */}
      <style>{`
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-container {
          background: #0b0f0c;
          font-family: 'Manrope', sans-serif;
        }
        .leaflet-control-zoom a {
          background: rgba(33,39,34,0.9) !important;
          color: #f9fdf7 !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(63,255,139,0.12) !important;
          color: #3fff8b !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
        .leaflet-control-attribution {
          background: rgba(11,15,12,0.7) !important;
          color: #636963 !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #3fff8b !important;
        }
      `}</style>

      {/* Full-bleed map container */}
      <div
        className="relative w-full"
        style={{ height: 'calc(100vh - var(--topbar-height))' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low z-50">
            <div className="space-y-4 text-center">
              <div className="h-16 w-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
              <p className="text-body-md text-on-surface-variant">{t('outbreak.loading', { defaultValue: 'Loading outbreak data…' })}</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low">
            <div className="text-center space-y-2">
              <p className="text-3xl">⚠️</p>
              <p className="text-title-sm font-heading text-on-surface">{t('outbreak.failed')}</p>
              <p className="text-body-sm text-on-surface-variant">{t('outbreak.error_desc', { defaultValue: 'Check your connection and reload the page.' })}</p>
            </div>
          </div>
        )}

        {/* Map */}
        {!isLoading && !isError && (
          <>
            <OutbreakLeafletMap points={points} />
            {points.length > 0 && (
              <>
                <StatsBar points={points} />
                <MapLegend />
              </>
            )}
            {points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="glass rounded-2xl px-6 py-4 text-center">
                  <p className="text-title-sm font-heading text-on-surface">{t('outbreak.no_data')}</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">{t('outbreak.no_data_desc', { defaultValue: 'Data populates as scans are submitted from the field.' })}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
