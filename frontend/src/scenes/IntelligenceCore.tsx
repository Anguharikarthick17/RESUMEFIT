import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// ── Pipeline nodes ────────────────────────────────────────────────────────────
const NODES = [
  { label: '01 Resume',    angle: 0,   radius: 2.5, color: '#111111', icon: '📄' },
  { label: '02 Extract',   angle: 60,  radius: 2.5, color: '#262626', icon: '⚡' },
  { label: '03 Segment',   angle: 120, radius: 2.5, color: '#333333', icon: '📑' },
  { label: '04 Parse',     angle: 180, radius: 2.5, color: '#444444', icon: '🔍' },
  { label: '05 Evidence',  angle: 240, radius: 2.5, color: '#10B981', icon: '🔗' },
  { label: '06 Fit Score', angle: 300, radius: 2.5, color: '#000000', icon: '🎯' },
]

function toRad(deg: number) { return (deg * Math.PI) / 180 }

// ── Core sphere ───────────────────────────────────────────────────────────────
function CoreSphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.2
      meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.05
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.3
    if (ring2Ref.current) ring2Ref.current.rotation.y = t * 0.25
  })

  return (
    <group>
      {/* Central Glass/Solid Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshStandardMaterial
          color="#F5F5F4"
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* Wireframe outer shell */}
      <mesh>
        <sphereGeometry args={[0.92, 16, 16]} />
        <meshBasicMaterial color="#CCCCCC" wireframe transparent opacity={0.35} />
      </mesh>

      {/* Orbit Ring 1 */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.4, 0.015, 8, 64]} />
        <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Orbit Ring 2 */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <torusGeometry args={[1.65, 0.01, 8, 64]} />
        <meshStandardMaterial color="#666666" transparent opacity={0.6} />
      </mesh>

      {/* Core Center Badge */}
      <Html center distanceFactor={7} style={{ pointerEvents: 'none' }}>
        <div className="bg-white/95 backdrop-blur-sm border border-[#E5E5E5] shadow-md px-2.5 py-1 rounded-full text-[10px] font-bold text-[#111111] tracking-wider uppercase select-none whitespace-nowrap">
          ResumeFit Core
        </div>
      </Html>
    </group>
  )
}

// ── Pipeline Node ─────────────────────────────────────────────────────────────
function PipelineNode({
  label, angle, radius, color, icon, index,
}: { label: string; angle: number; radius: number; color: string; icon: string; index: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const x = radius * Math.cos(toRad(angle))
  const z = radius * Math.sin(toRad(angle))

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const offset = index * (Math.PI / 3)
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.8 + offset) * 0.1
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4
    }
  })

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className="bg-white/95 backdrop-blur-sm border border-[#E5E5E5] shadow-sm px-2 py-0.5 rounded-md text-[10px] font-medium text-[#111111] whitespace-nowrap select-none mt-6 flex items-center gap-1 font-mono">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
      </Html>
    </group>
  )
}

// ── Connection lines ───────────────────────────────────────────────────────────
function ConnectionLines() {
  const { positions, colors } = useMemo(() => {
    const pos: number[] = []
    const col: number[] = []
    NODES.forEach(n => {
      const x = n.radius * Math.cos(toRad(n.angle))
      const z = n.radius * Math.sin(toRad(n.angle))
      pos.push(0, 0, 0, x, 0, z)
      const c = new THREE.Color(n.color)
      col.push(c.r, c.g, c.b, c.r, c.g, c.b)
    })
    return { positions: new Float32Array(pos), colors: new Float32Array(col) }
  }, [])

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.35} />
    </lineSegments>
  )
}

// ── Subtle background particle field ──────────────────────────────────────────
function ParticleField() {
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const count = 35
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const positions = useMemo(() =>
    Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 8,
    ]),
  [])

  useFrame(({ clock }) => {
    if (!instancedRef.current) return
    const t = clock.getElapsedTime()
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y + Math.sin(t * 0.25 + i) * 0.04, z)
      dummy.updateMatrix()
      instancedRef.current!.setMatrixAt(i, dummy.matrix)
    })
    instancedRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.014, 4, 4]} />
      <meshBasicMaterial color="#AAAAAA" transparent opacity={0.25} />
    </instancedMesh>
  )
}

// ── Scene group ───────────────────────────────────────────────────────────────
function SceneGroup() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock, mouse }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mouse.x * 0.12 + Math.sin(t * 0.06) * 0.04,
      0.03,
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -mouse.y * 0.06,
      0.03,
    )
  })

  return (
    <group ref={groupRef}>
      <CoreSphere />
      {NODES.map((n, i) => (
        <PipelineNode key={n.label} {...n} index={i} />
      ))}
      <ConnectionLines />
      <ParticleField />
    </group>
  )
}

export default function IntelligenceCore({ compact = false }: { compact?: boolean }) {
  const height = compact ? '260px' : '440px'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{ width: '100%', height, position: 'relative' }}
    >
      <Canvas
        camera={{ position: [0, 1.2, 6.5], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-4, 2, -2]} intensity={0.6} color="#111111" />
        <SceneGroup />
        {!compact && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.3}
            maxPolarAngle={Math.PI * 0.65}
            minPolarAngle={Math.PI * 0.35}
          />
        )}
      </Canvas>
    </motion.div>
  )
}
