import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function ScoreRing() {
  const outerRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime()
    if (outerRef.current) {
      outerRef.current.rotation.z = t * 0.4
      outerRef.current.rotation.x = THREE.MathUtils.lerp(outerRef.current.rotation.x, -mouse.y * 0.08, 0.05)
      outerRef.current.rotation.y = THREE.MathUtils.lerp(outerRef.current.rotation.y, mouse.x * 0.08, 0.05)
    }
    if (innerRef.current) {
      innerRef.current.rotation.z = -t * 0.25
    }
  })

  return (
    <group>
      {/* Background ring */}
      <mesh>
        <torusGeometry args={[1.75, 0.025, 8, 96]} />
        <meshBasicMaterial color="#E2E8F0" />
      </mesh>

      {/* Main animated ring */}
      <mesh ref={outerRef}>
        <torusGeometry args={[1.75, 0.045, 8, 96]} />
        <meshStandardMaterial
          color="#2563EB"
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* Inner accent ring */}
      <mesh ref={innerRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.05, 0.012, 8, 64]} />
        <meshStandardMaterial color="#60A5FA" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

export default function ResultScene({ score: _score }: { score: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.8], fov: 52 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-3, -2, -2]} intensity={0.5} color="#3B82F6" />
      <ScoreRing />
    </Canvas>
  )
}
