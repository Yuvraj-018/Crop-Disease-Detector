import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

// ─── Scan Laser Plane ──────────────────────────────────────────────────────

function ScanLaser() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.getElapsedTime() * 0.5) % 1
    // Oscillate Y from -1.2 to +1.2
    ref.current.position.y = -1.2 + t * 2.4
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = 
      t < 0.05 ? t / 0.05 : t > 0.95 ? (1 - t) / 0.05 : 0.85
  })

  return (
    <mesh ref={ref} rotation={[0, 0, 0]}>
      <planeGeometry args={[2.4, 0.015]} />
      <meshBasicMaterial
        color="#00E676"
        transparent
        opacity={0.85}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Corner Bracket ────────────────────────────────────────────────────────

function CornerBracket({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  const color = '#00E676'

  const geom = useMemo(() => {
    const shape  = new THREE.Shape()
    const size   = 0.28
    const thick  = 0.018

    // L-shape (horizontal + vertical strokes)
    shape.moveTo(0, 0)
    shape.lineTo(size, 0)
    shape.lineTo(size, thick)
    shape.lineTo(thick, thick)
    shape.lineTo(thick, size)
    shape.lineTo(0, size)
    shape.closePath()

    const extrudeSettings = { depth: 0.01, bevelEnabled: false }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])

  return (
    <mesh position={position} rotation={rotation} geometry={geom}>
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// ─── Leaf Mesh ─────────────────────────────────────────────────────────────

function LeafMesh() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.3
    ref.current.rotation.z = Math.sin(t * 0.2) * 0.08
  })

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.15}
      floatIntensity={0.6}
    >
      <mesh ref={ref} castShadow>
        <sphereGeometry args={[0.95, 64, 64]} />
        <MeshDistortMaterial
          color="#0b2e1b"
          emissive="#00E676"
          emissiveIntensity={0.08}
          distort={0.35}
          speed={1.5}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Neon outline sphere */}
      <mesh scale={1.02}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshBasicMaterial
          color="#00E676"
          wireframe
          transparent
          opacity={0.04}
        />
      </mesh>
    </Float>
  )
}

// ─── Orbiting Particles ────────────────────────────────────────────────────

function OrbitParticles() {
  const count  = 60
  const radius = 1.8

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r     = radius + (Math.random() - 0.5) * 0.6
      const y     = (Math.random() - 0.5) * 2.5
      pos[i * 3]     = Math.cos(angle) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(angle) * r
    }
    return pos
  }, [])

  const ref = useRef<THREE.Points>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * 0.06
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#3fff8b"
        size={0.025}
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  )
}

// ─── Scan Box (wireframe frame around the leaf) ───────────────────────────

function ScanBox() {
  return (
    <group>
      {/* Corners — top-left, top-right, bottom-left, bottom-right */}
      <CornerBracket position={[-1.1, 1.15, 0.01]}   rotation={[0, 0, 0]} />
      <CornerBracket position={[ 1.1, 1.15, 0.01]}   rotation={[0, 0, Math.PI / 2]} />
      <CornerBracket position={[-1.1,-1.15, 0.01]}   rotation={[0, 0, -Math.PI / 2]} />
      <CornerBracket position={[ 1.1,-1.15, 0.01]}   rotation={[0, 0, Math.PI]} />

      {/* Scan line */}
      <ScanLaser />
    </group>
  )
}

// ─── Ambient Lights ────────────────────────────────────────────────────────

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]}  intensity={1.2} color="#3fff8b" />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#10B981" />
      <pointLight position={[0, -3, 3]}  intensity={0.5} color="#ffffff" />
    </>
  )
}

// ─── Full Scanner Scene ────────────────────────────────────────────────────

export function LeafScanner() {
  return (
    <>
      <SceneLights />
      <OrbitParticles />
      <ScanBox />
      <LeafMesh />
    </>
  )
}
