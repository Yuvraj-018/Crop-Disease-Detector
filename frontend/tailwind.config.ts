import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ─── Color Palette : Biolume Command ────────────────────────────────
      colors: {
        // Base surfaces
        surface: {
          DEFAULT: '#0b0f0c',
          dim: '#0b0f0c',
          bright: '#272e28',
          tint: '#3fff8b',
          variant: '#212722',
        },
        'surface-container': {
          DEFAULT: '#151b17',
          low: '#0f1511',
          high: '#1b211c',
          highest: '#212722',
          lowest: '#000000',
        },

        // Primary neon emerald
        primary: {
          DEFAULT: '#3fff8b',
          dim: '#24f07e',
          container: '#13ea79',
          fixed: '#3fff8b',
          'fixed-dim': '#24f07e',
        },

        // Secondary teal
        secondary: {
          DEFAULT: '#69f6b8',
          dim: '#58e7ab',
          container: '#006c49',
          fixed: '#69f6b8',
          'fixed-dim': '#58e7ab',
        },

        // Tertiary lime
        tertiary: {
          DEFAULT: '#f4ffc6',
          dim: '#c7ef00',
          container: '#d1fc00',
          fixed: '#d4ff00',
          'fixed-dim': '#c7ef00',
        },

        // Semantic
        error: {
          DEFAULT: '#ff716c',
          dim: '#d7383b',
          container: '#9f0519',
        },

        // On- colors
        'on-background': '#f9fdf7',
        'on-surface': '#f9fdf7',
        'on-surface-variant': '#a8aca6',
        'on-primary': '#005d2c',
        'on-primary-container': '#004f24',
        'on-secondary': '#005a3c',
        'on-secondary-container': '#e1ffec',
        'on-tertiary': '#546600',
        'on-tertiary-container': '#4c5d00',
        'on-error': '#490006',
        'on-error-container': '#ffa8a3',

        // Utility
        outline: '#727771',
        'outline-variant': '#444945',

        // Inverse
        'inverse-surface': '#f6fbf4',
        'inverse-on-surface': '#515651',
        'inverse-primary': '#006e35',

        // Shortcuts
        neon: '#00E676', // The "signature" neon
        emerald: '#10B981',
        obsidian: '#060A07',
      },

      // ─── Typography ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        label: ['"Space Grotesk"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-lg': ['2.875rem', { lineHeight: '1.12', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '700' }],
        'headline-lg': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'headline-md': ['1.75rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        'headline-sm': ['1.5rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }],
        'title-lg': ['1.375rem', { lineHeight: '1.4' }],
        'title-md': ['1.125rem', { lineHeight: '1.5' }],
        'title-sm': ['0.9375rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body-md': ['0.875rem', { lineHeight: '1.6' }],
        'body-sm': ['0.75rem', { lineHeight: '1.5' }],
        'label-lg': ['0.875rem', { lineHeight: '1.25', letterSpacing: '0.08em', fontWeight: '600' }],
        'label-md': ['0.75rem', { lineHeight: '1.25', letterSpacing: '0.1em', fontWeight: '600' }],
        'label-sm': ['0.6875rem', { lineHeight: '1.25', letterSpacing: '0.1em', fontWeight: '500' }],
      },

      // ─── Spacing ─────────────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '84': '21rem',
        '88': '22rem',
        '96': '24rem',
      },

      // ─── Border Radius ────────────────────────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '3rem',
        'pill': '9999px',
      },

      // ─── Box Shadow / Glow ───────────────────────────────────────────────
      boxShadow: {
        'neon-sm':   '0 0 8px 0 rgba(0, 230, 118, 0.5)',
        'neon-md':   '0 0 16px 0 rgba(0, 230, 118, 0.5), 0 0 32px 0 rgba(0, 230, 118, 0.2)',
        'neon-lg':   '0 0 32px 0 rgba(0, 230, 118, 0.6), 0 0 64px 0 rgba(0, 230, 118, 0.25)',
        'neon-xl':   '0 0 64px 0 rgba(0, 230, 118, 0.4), 0 0 128px 0 rgba(0, 230, 118, 0.15)',
        'emerald-sm': '0 0 8px 0 rgba(16, 185, 129, 0.5)',
        'emerald-md': '0 0 16px 0 rgba(16, 185, 129, 0.5)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(0,0,0,0.2)',
        'glass-sm':  '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-md':  '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-lg':  '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        'card':      '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        'critical':  '0 0 12px 0 rgba(255, 113, 108, 0.5)',
      },

      // ─── Drop Shadow (for glow effects on text / icons) ─────────────────
      dropShadow: {
        'neon':    ['0 0 8px rgba(0, 230, 118, 0.8)', '0 0 20px rgba(0, 230, 118, 0.4)'],
        'emerald': ['0 0 6px rgba(16, 185, 129, 0.7)'],
        'error':   ['0 0 8px rgba(255, 113, 108, 0.7)'],
      },

      // ─── Backdrop Blur ────────────────────────────────────────────────────
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // ─── Background Image / Gradient ─────────────────────────────────────
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        'neon-gradient':    'linear-gradient(135deg, #00E676, #10B981)',
        'neon-radial':      'radial-gradient(circle, rgba(0, 230, 118, 0.15) 0%, transparent 70%)',
        'emerald-radial':   'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        'hero-radial':      'radial-gradient(ellipse at top right, rgba(0, 230, 118, 0.08) 0%, transparent 60%)',
        'surface-gradient': 'linear-gradient(180deg, #0f1511 0%, #0b0f0c 100%)',
        'glass-gradient':   'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        'glass-border':     'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
        'scan-laser':       'linear-gradient(90deg, transparent, #00E676, #00E676, transparent)',
        'severity-critical':'linear-gradient(135deg, #9f0519, #ff716c)',
        'severity-high':    'linear-gradient(135deg, #b45309, #f97316)',
        'severity-medium':  'linear-gradient(135deg, #92400e, #fbbf24)',
        'severity-low':     'linear-gradient(135deg, #065f46, #10b981)',
        'severity-healthy': 'linear-gradient(135deg, #064e3b, #3fff8b)',
      },

      // ─── Background Size ─────────────────────────────────────────────────
      backgroundSize: {
        'grid-20': '20px 20px',
      },

      // ─── Animations ───────────────────────────────────────────────────────
      keyframes: {
        'scan-laser': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '5%': { opacity: '1' },
          '95%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,230,118,0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(0,230,118,0.7), 0 0 48px rgba(0,230,118,0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-8px) rotate(1deg)' },
          '66%': { transform: 'translateY(-4px) rotate(-0.5deg)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'orbit': {
          from: { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'progress-bar': {
          from: { width: '0%' },
          to: { width: 'var(--progress-width, 100%)' },
        },
        'confidence-ring': {
          from: { strokeDashoffset: '283' },
          to: { strokeDashoffset: 'var(--ring-offset, 0)' },
        },
      },
      animation: {
        'scan-laser':       'scan-laser 2.4s ease-in-out infinite',
        'pulse-glow':       'pulse-glow 2s ease-in-out infinite',
        'float':            'float 4s ease-in-out infinite',
        'float-slow':       'float-slow 7s ease-in-out infinite',
        'shimmer':          'shimmer 2.2s linear infinite',
        'fade-in':          'fade-in 0.4s ease-out both',
        'fade-in-up':       'fade-in-up 0.6s ease-out both',
        'slide-in-right':   'slide-in-right 0.35s ease-out both',
        'scale-in':         'scale-in 0.3s ease-out both',
        'spin-slow':        'spin-slow 12s linear infinite',
        'orbit':            'orbit 8s linear infinite',
        'blink':            'blink 1.2s ease-in-out infinite',
        'progress-bar':     'progress-bar 1s ease-out both',
        'confidence-ring':  'confidence-ring 1.2s ease-out both',
      },
      animationDelay: {
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '800': '800ms',
        '1000': '1000ms',
      },

      // ─── Z-index scale ────────────────────────────────────────────────────
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // ─── Transitions ──────────────────────────────────────────────────────
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-in-expo': 'cubic-bezier(0.7, 0, 0.84, 0)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

export default config
