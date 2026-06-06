/**
 * Design Tokens — Biolume Command
 * Use these TypeScript constants when you need programmatic access.
 * For Tailwind classes use the config tokens (e.g., `text-primary`, `bg-surface`).
 */

// ─── Color Palette ─────────────────────────────────────────────────────────

export const colors = {
  // Surfaces (dark void)
  surface:            '#0b0f0c',
  surfaceDim:         '#0b0f0c',
  surfaceBright:      '#272e28',
  surfaceVariant:     '#212722',
  surfaceContainer:   '#151b17',
  surfaceContainerLow:    '#0f1511',
  surfaceContainerHigh:   '#1b211c',
  surfaceContainerHighest:'#212722',
  surfaceContainerLowest: '#000000',

  // Primary neon emerald
  primary:          '#3fff8b',
  primaryDim:       '#24f07e',
  primaryContainer: '#13ea79',

  // Secondary teal
  secondary:          '#69f6b8',
  secondaryDim:       '#58e7ab',
  secondaryContainer: '#006c49',

  // Tertiary lime
  tertiary:          '#f4ffc6',
  tertiaryDim:       '#c7ef00',
  tertiaryContainer: '#d1fc00',

  // Error states
  error:          '#ff716c',
  errorDim:       '#d7383b',
  errorContainer: '#9f0519',

  // On-colors
  onBackground:        '#f9fdf7',
  onSurface:           '#f9fdf7',
  onSurfaceVariant:    '#a8aca6',
  onPrimary:           '#005d2c',
  onPrimaryContainer:  '#004f24',
  onSecondary:         '#005a3c',
  onSecondaryContainer:'#e1ffec',
  onTertiary:          '#546600',
  onTertiaryContainer: '#4c5d00',
  onError:             '#490006',
  onErrorContainer:    '#ffa8a3',

  // Utility
  outline:        '#727771',
  outlineVariant: '#444945',

  // Signatures
  neon:     '#00E676',   // The electric green
  emerald:  '#10B981',   // Deeper green
  obsidian: '#060A07',   // Darkest bg
} as const

// ─── Typography ────────────────────────────────────────────────────────────

export const fonts = {
  heading: '"Plus Jakarta Sans", system-ui, sans-serif',
  body:    'Manrope, system-ui, sans-serif',
  label:   '"Space Grotesk", monospace',
  mono:    '"JetBrains Mono", monospace',
} as const

// ─── Shadows / Glows ──────────────────────────────────────────────────────

export const glows = {
  neonSm:   '0 0 8px 0 rgba(0, 230, 118, 0.5)',
  neonMd:   '0 0 16px 0 rgba(0, 230, 118, 0.5), 0 0 32px 0 rgba(0, 230, 118, 0.2)',
  neonLg:   '0 0 32px 0 rgba(0, 230, 118, 0.6), 0 0 64px 0 rgba(0, 230, 118, 0.25)',
  glassSm:  '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
  glassMd:  '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
  glassLg:  '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)',
} as const

// ─── Severity Colors ───────────────────────────────────────────────────────

export type Severity = 'healthy' | 'low' | 'medium' | 'high' | 'critical'

export const severityConfig: Record<Severity, {
  label:   string
  color:   string
  bg:      string
  border:  string
  glow:    string
  tailwind:string
}> = {
  healthy:  { label: 'Healthy',  color: '#3fff8b', bg: 'rgba(63,255,139,0.12)',  border: 'rgba(63,255,139,0.25)',  glow: '0 0 8px rgba(63,255,139,0.4)',    tailwind: 'text-primary bg-primary/10 border-primary/25' },
  low:      { label: 'Low',      color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  glow: '0 0 8px rgba(16,185,129,0.4)',    tailwind: 'text-emerald bg-emerald/10 border-emerald/25' },
  medium:   { label: 'Medium',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', glow: '0 0 8px rgba(251,191,36,0.4)',    tailwind: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25' },
  high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', glow: '0 0 8px rgba(249,115,22,0.4)',    tailwind: 'text-orange-400 bg-orange-400/10 border-orange-400/25' },
  critical: { label: 'Critical', color: '#ff716c', bg: 'rgba(255,113,108,0.12)',border: 'rgba(255,113,108,0.25)',glow: '0 0 12px rgba(255,113,108,0.5)',   tailwind: 'text-error bg-error/10 border-error/25' },
}

// ─── Animation Durations ───────────────────────────────────────────────────

export const durations = {
  fast:   150,   // ms
  normal: 250,
  slow:   400,
  verySlow: 700,
} as const

// ─── Z-Index Scale ─────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  raised:  10,
  dropdown:20,
  sticky:  30,
  overlay: 40,
  modal:   50,
  toast:   60,
  tooltip: 70,
} as const

// ─── Breakpoints ───────────────────────────────────────────────────────────

export const breakpoints = {
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  '2xl': 1536,
} as const
