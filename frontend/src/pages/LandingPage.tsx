import { Suspense, lazy, Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'

// Lazy-load the 3D canvas (heavy — keeps initial bundle small)
const HeroCanvas = lazy(() =>
  import('../components/3d/HeroCanvas').then((m) => ({ default: m.HeroCanvas })),
)

// ─── 3D Error Boundary ─────────────────────────────────────────────────────
// Catches WebGL / Three.js reconciler crashes so the rest of the page renders.
class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      // Graceful fallback — ambient glow orb so the layout still looks great
      return (
        <div className="h-full w-full flex items-center justify-center">
          <div
            className="h-56 w-56 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(0,230,118,0.35) 0%, rgba(16,185,129,0.15) 50%, transparent 70%)',
              boxShadow: '0 0 80px 20px rgba(0,230,118,0.2)',
            }}
          />
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Stats ─────────────────────────────────────────────────────────────────

const STATS = [
  { value: '12,400+', label: 'Farmers Protected',  glow: true },
  { value: '38',      label: 'Diseases Detected',  glow: false },
  { value: '96.2%',   label: 'Model Accuracy',     glow: true },
  { value: '<2s',     label: 'Scan Time',           glow: false },
]

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
    ),
    title: 'Instant Scan',
    desc:  'Point your camera at any leaf. Results in under 2 seconds.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    title: '38 Diseases',
    desc:  'Trained on 87,000 leaf images across 12 major crops.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    title: 'Outbreak Map',
    desc:  'Real-time regional disease tracking across every Indian state.',
  },
]

// ─── Floating Stat Card ────────────────────────────────────────────────────

function StatCard({ value, label, glow }: { value: string; label: string; glow: boolean }) {
  return (
    <div
      className={cn(
        'glass rounded-2xl px-4 py-3 flex flex-col',
        glow && 'shadow-neon-sm border-primary/15',
      )}
    >
      <p
        className={cn(
          'text-display-sm font-heading font-bold leading-none',
          glow ? 'text-primary' : 'text-on-surface',
        )}
      >
        {value}
      </p>
      <p className="text-body-sm text-on-surface-variant mt-0.5">{label}</p>
    </div>
  )
}

// ─── Landing Page ──────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 glass border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-neon-sm group-hover:shadow-neon-md transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8C8 10 5.9 16.17 3.82 19c-1.12-1-1.82-2.76-1.82-4.23C2 8.65 6.15 3 13.5 3c3.12 0 5.5 1.5 5.5 1.5L17 8z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8c0 4.97-4 9-9 9" />
              </svg>
            </div>
            <span className="text-title-md font-heading font-bold text-on-surface">
              Crop<span className="text-primary">Guard</span>
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {['Features', 'About', 'Pricing'].map((n) => (
              <a
                key={n}
                href={`#${n.toLowerCase()}`}
                className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {n}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Text column */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Badge */}
            <div className="animate-fade-in">
              <Badge variant="neon" dot pulse>
                AI-Powered · Detect. Diagnose. Protect.
              </Badge>
            </div>

            {/* Headline */}
            <h1
              className="text-display-xl lg:text-[4rem] font-heading font-bold leading-[1.05] tracking-tight text-on-surface animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              Protect Your
              <br />
              Harvest with{' '}
              <span className="text-primary text-glow-neon">AI Vision</span>
            </h1>

            {/* Sub-headline */}
            <p
              className="text-body-lg text-on-surface-variant max-w-md leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              Point your phone at any leaf. CropGuard's ML model identifies
              38 diseases across 12 crops — with treatment plans, outbreak maps, and history. Free for Indian farmers.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-3 pt-2 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto shadow-neon-md">
                  Start Scanning Free →
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Sign in to Dashboard
                </Button>
              </Link>
            </div>

            {/* Stats grid */}
            <div
              className="grid grid-cols-2 gap-3 pt-4 animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              {STATS.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>
          </div>

          {/* Right — 3D Canvas column */}
          <div
            className="order-1 lg:order-2 h-[380px] lg:h-[540px] relative animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <CanvasErrorBoundary>
              <Suspense
                fallback={
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  </div>
                }
              >
                <HeroCanvas />
              </Suspense>
            </CanvasErrorBoundary>

            {/* Floating label */}
            <div className="absolute top-4 right-4 glass rounded-xl px-3 py-1.5 text-label-sm font-label text-primary animate-blink">
              ● SCANNING
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section
        id="features"
        className="border-t border-white/[0.05] py-20 lg:py-28 bg-surface-container-low"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-label-md font-label text-primary uppercase tracking-widest mb-3">
              Why CropGuard?
            </p>
            <h2 className="text-display-md font-heading font-bold text-on-surface">
              Everything a farmer needs.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="glass rounded-3xl p-6 group hover:shadow-neon-sm hover:border-primary/20 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:shadow-neon-sm transition-all mb-4">
                  {f.icon}
                </div>
                <h3 className="text-title-lg font-heading font-semibold text-on-surface mb-2">{f.title}</h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-display-md font-heading font-bold text-on-surface">
            Ready to save your{' '}
            <span className="text-primary text-glow-sm">harvest?</span>
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Join thousands of farmers already using CropGuard to detect disease before it spreads.
          </p>
          <Link to="/register">
            <Button size="lg" className="shadow-neon-md px-10">
              Create Free Account →
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-title-sm font-heading font-bold text-on-surface/60">
              Crop<span className="text-primary/60">Guard</span>
            </span>
          </Link>
          <p className="text-body-sm text-on-surface-variant">
            © 2026 CropGuard. Building for the Indian farmer. 🌾
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors">Privacy</a>
            <a href="#" className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
