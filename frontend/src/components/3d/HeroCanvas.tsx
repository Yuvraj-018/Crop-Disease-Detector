import { useEffect, useRef } from 'react'

// ─── HeroCanvas ────────────────────────────────────────────────────────────
// Pure Canvas2D leaf-scanning animation — zero library dependencies,
// zero version conflicts.  Renders a stylised leaf being scanned by a
// neon laser line with orbiting particles.

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Assert non-null — we already guarded above; this satisfies TS strict null checks
    // in all inner functions that reference `ctx` via closure.
    const c = ctx as CanvasRenderingContext2D

    // ── Resize observer ────────────────────────────────────────────────────
    let W = 0, H = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr  = window.devicePixelRatio || 1
      W = rect.width;  H = rect.height
      canvas.width  = W * dpr
      canvas.height = H * dpr
      c.scale(dpr, dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // ── Orbit particles ────────────────────────────────────────────────────
    const COUNT = 55
    const particles = Array.from({ length: COUNT }, (_, i) => {
      const angle  = (i / COUNT) * Math.PI * 2
      const radius = 115 + (Math.random() - 0.5) * 45
      return {
        angle,
        radius,
        y:     (Math.random() - 0.5) * 170,
        speed: 0.003 + Math.random() * 0.006,
        size:  1.0 + Math.random() * 1.8,
        alpha: 0.25 + Math.random() * 0.55,
      }
    })

    // ── Data-readout lines ─────────────────────────────────────────────────
    const readouts = [
      { label: 'DISEASE',   value: 'Analyzing…', y: -70 },
      { label: 'CROP',      value: 'Tomato',     y: -40 },
      { label: 'CONF',      value: '--.--%',      y: -10 },
      { label: 'STATUS',    value: 'SCANNING',   y:  20 },
    ]

    // ── Leaf SVG path data (drawn procedurally) ───────────────────────────
    // Using a bezier-based organic leaf shape
    function drawLeaf(cx: number, cy: number, t: number) {
      const breathe = Math.sin(t * 0.8) * 3

      // 3D rotation angles
      const rotY = Math.sin(t * 0.6) * 0.15
      const rotX = Math.cos(t * 0.4) * 0.10

      // Outer glow
      const grad = c.createRadialGradient(cx, cy, 10, cx, cy, 90 + breathe)
      grad.addColorStop(0,   'rgba(0,230,118,0.18)')
      grad.addColorStop(0.5, 'rgba(16,185,129,0.06)')
      grad.addColorStop(1,   'transparent')
      c.beginPath()
      c.arc(cx, cy, 95 + breathe, 0, Math.PI * 2)
      c.fillStyle = grad
      c.fill()

      // Leaf body
      c.save()
      c.translate(cx, cy)
      // Pseudo-3D tilt and rotation
      c.rotate(Math.sin(t * 0.25) * 0.08)
      c.scale(Math.cos(rotY), Math.cos(rotX))
      
      // Drop shadow for 3D depth
      c.shadowColor = 'rgba(0, 230, 118, 0.4)'
      c.shadowBlur = 20
      c.shadowOffsetX = Math.sin(rotY) * 15
      c.shadowOffsetY = 10 + Math.abs(Math.sin(rotX)) * 5

      const leafGrad = c.createRadialGradient(0, -20, 5, 0, 0, 75)
      leafGrad.addColorStop(0,   '#0b2e1b')
      leafGrad.addColorStop(0.6, '#071a10')
      leafGrad.addColorStop(1,   '#04160c') // Slightly lighter edge to pop in 3D

      c.beginPath()
      // Leaf outline: bezier leaf shape
      c.moveTo(0, -72)
      c.bezierCurveTo( 55, -55,  68,  30,   0,  72)
      c.bezierCurveTo(-68,  30, -55, -55,   0, -72)
      c.fillStyle   = leafGrad
      c.fill()

      // Clear shadow for veins and outlines
      c.shadowColor = 'transparent'
      c.shadowBlur = 0
      
      // Leaf border glow
      c.strokeStyle = 'rgba(0,230,118,0.4)'
      c.lineWidth   = 2.0
      c.stroke()

      // Midrib (centre vein)
      c.beginPath()
      c.moveTo(0, -70)
      c.bezierCurveTo(2, 0, 1, 40, 0, 70)
      c.strokeStyle = 'rgba(0,230,118,0.35)'
      c.lineWidth   = 1
      c.stroke()

      // Side veins (4 pairs)
      for (let i = 1; i <= 4; i++) {
        const yBase = -52 + i * 24
        const xOff  = 10 + i * 4
        const xEnd  = 35 + i * 6

        c.beginPath()
        c.moveTo(xOff * 0.3, yBase)
        c.bezierCurveTo(xOff, yBase + 8, xEnd, yBase + 14, xEnd + 5, yBase + 6)
        c.strokeStyle = 'rgba(0,230,118,0.18)'
        c.lineWidth   = 0.7
        c.stroke()

        c.beginPath()
        c.moveTo(-xOff * 0.3, yBase)
        c.bezierCurveTo(-xOff, yBase + 8, -xEnd, yBase + 14, -xEnd - 5, yBase + 6)
        c.stroke()
      }

      c.restore()
    }

    // ── Corner brackets ────────────────────────────────────────────────────
    function drawBrackets(cx: number, cy: number, halfW: number, halfH: number, alpha: number) {
      const len = 22
      const pos = [
        [-halfW, -halfH], [halfW, -halfH], [-halfW, halfH], [halfW, halfH],
      ] as const
      c.strokeStyle = `rgba(0,230,118,${alpha})`
      c.lineWidth   = 2
      c.lineCap     = 'square'
      for (const [bx, by] of pos) {
        const sx = Math.sign(bx)
        const sy = Math.sign(by)
        c.beginPath()
        c.moveTo(cx + bx - sx * len, cy + by)
        c.lineTo(cx + bx, cy + by)
        c.lineTo(cx + bx, cy + by + sy * len)
        c.stroke()
      }
    }

    // ── Scan laser ─────────────────────────────────────────────────────────
    function drawLaser(cx: number, cy: number, halfH: number, scanY: number) {
      // scanY goes 0 → 1
      const y = cy - halfH + scanY * halfH * 2

      // Fade in/out at edges
      const edge  = Math.min(scanY, 1 - scanY) * 10
      const alpha = Math.min(edge / 0.5, 1)

      const laserGrad = c.createLinearGradient(cx - 75, y, cx + 75, y)
      laserGrad.addColorStop(0,   'transparent')
      laserGrad.addColorStop(0.2, `rgba(0,230,118,${alpha * 0.15})`)
      laserGrad.addColorStop(0.5, `rgba(0,230,118,${alpha * 0.95})`)
      laserGrad.addColorStop(0.8, `rgba(0,230,118,${alpha * 0.15})`)
      laserGrad.addColorStop(1,   'transparent')

      c.beginPath()
      c.moveTo(cx - 80, y)
      c.lineTo(cx + 80, y)
      c.lineWidth   = 2.5
      c.strokeStyle = laserGrad
      c.stroke()

      // Glow behind the line
      const glowGrad = c.createLinearGradient(cx - 80, y, cx + 80, y)
      glowGrad.addColorStop(0,   'transparent')
      glowGrad.addColorStop(0.5, `rgba(0,230,118,${alpha * 0.12})`)
      glowGrad.addColorStop(1,   'transparent')

      c.beginPath()
      c.rect(cx - 80, y - 8, 160, 16)
      c.fillStyle = glowGrad
      c.fill()
    }

    // ── HUD readout overlay ────────────────────────────────────────────────
    function drawHUD(cx: number, cy: number, scanY: number, t: number) {
      c.font      = '9px "Space Grotesk", monospace'
      c.textAlign = 'left'
      const rx      = cx + 95

      readouts.forEach((r, i) => {
        const flash = i === 0 || i === 2  // animate these
        const val   =
          flash
            ? i === 0
              ? scanY > 0.5 ? 'Blight' : 'Analyzing…'
              : scanY > 0.5 ? `${(scanY * 91.2).toFixed(1)}%` : '--.--%'
            : r.value

        c.fillStyle = 'rgba(0,230,118,0.32)'
        c.fillText(r.label, rx, cy + r.y)
        c.fillStyle = `rgba(255,255,255,${0.6 + Math.sin(t * 2 + i) * 0.08})`
        c.fillText(val, rx + 44, cy + r.y)

        // Separator line
        c.beginPath()
        c.moveTo(rx, cy + r.y + 4)
        c.lineTo(rx + 80, cy + r.y + 4)
        c.strokeStyle = 'rgba(0,230,118,0.10)'
        c.lineWidth   = 0.5
        c.stroke()
      })

      // Blinking status dot
      if (Math.floor(t * 2) % 2 === 0) {
        c.beginPath()
        c.arc(cx + 108, cy + 36, 3.5, 0, Math.PI * 2)
        c.fillStyle = 'rgba(0,230,118,0.9)'
        c.fill()
      }
    }

    // ── Main render loop ───────────────────────────────────────────────────
    let raf: number
    const start = performance.now()

    const draw = () => {
      const t      = (performance.now() - start) / 1000
      const scanY  = (t * 0.45) % 1          // 0 → 1 loop

      c.clearRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2

      c.save()
      // Global scale to make everything larger and tilt to enhance the 3D look
      c.translate(cx, cy)
      // 1.45x bigger + slight dynamic breathing
      const zoom = 1.45 + Math.sin(t * 1.5) * 0.02
      c.scale(zoom, zoom * 0.96) // 0.96 squeezes Y slightly for an isometric-ish tilt
      c.translate(-cx, -cy)

      // Ambient background glow
      const bgGlow = c.createRadialGradient(cx, cy, 20, cx, cy, 200)
      bgGlow.addColorStop(0,   'rgba(0,230,118,0.04)')
      bgGlow.addColorStop(0.6, 'rgba(10,185,80,0.02)')
      bgGlow.addColorStop(1,   'transparent')
      c.beginPath()
      c.arc(cx, cy, 200, 0, Math.PI * 2)
      c.fillStyle = bgGlow
      c.fill()

      // Orbiting particles
      particles.forEach((p) => {
        p.angle += p.speed
        const x   = cx + Math.cos(p.angle) * p.radius
        const y   = cy + Math.sin(p.angle * 0.5) * 60 + p.y * 0.4

        c.beginPath()
        c.arc(x, y, p.size, 0, Math.PI * 2)
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        const nearLeaf = Math.max(0, 1 - dist / 130)
        c.fillStyle = `rgba(63,255,139,${p.alpha * (0.5 + nearLeaf * 0.5)})`
        c.fill()
      })

      // Leaf
      drawLeaf(cx, cy, t)

      // Scan reticle brackets
      const pulse = 0.55 + Math.sin(t * 2.2) * 0.15
      drawBrackets(cx, cy, 88, 82, pulse)

      // Laser
      drawLaser(cx, cy, 82, scanY)

      // HUD
      drawHUD(cx, cy, scanY, t)

      c.restore() // End global transform

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[380px]">
      {/* Ambient radial glow behind the canvas */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,230,118,0.10) 0%, transparent 65%)',
        }}
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10"
        style={{ background: 'transparent' }}
      />
    </div>
  )
}

