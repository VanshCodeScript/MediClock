import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import * as THREE from "three";

interface HealthPoint {
  label: string;
  value: string;
  status: "green" | "yellow" | "red";
  position: [number, number, number];
}

const healthPoints: HealthPoint[] = [
  { label: "Heart Rate", value: "72 bpm", status: "green", position: [0, 0.5, 0.5] },
  { label: "Blood Sugar", value: "110 mg/dL", status: "green", position: [0.3, -0.2, 0.4] },
  { label: "Hydration", value: "65%", status: "yellow", position: [-0.3, -0.5, 0.3] },
  { label: "Cholesterol", value: "195 mg/dL", status: "yellow", position: [0.2, 1.0, 0.3] },
  { label: "Body Temp", value: "98.6°F", status: "green", position: [-0.2, 1.3, 0.2] },
];

const statusColor = { green: "#22C55E", yellow: "#FACC15", red: "#EF4444" };

function HumanModel() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={group}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#a3b8cc" transparent opacity={0.6} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 16, 32]} />
        <meshStandardMaterial color="#8fa8c8" transparent opacity={0.5} />
      </mesh>
      {/* Left Arm */}
      <mesh position={[-0.55, 0.7, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 16]} />
        <meshStandardMaterial color="#8fa8c8" transparent opacity={0.4} />
      </mesh>
      {/* Right Arm */}
      <mesh position={[0.55, 0.7, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 16]} />
        <meshStandardMaterial color="#8fa8c8" transparent opacity={0.4} />
      </mesh>
      {/* Left Leg */}
      <mesh position={[-0.15, -0.3, 0]}>
        <capsuleGeometry args={[0.1, 0.7, 8, 16]} />
        <meshStandardMaterial color="#8fa8c8" transparent opacity={0.4} />
      </mesh>
      {/* Right Leg */}
      <mesh position={[0.15, -0.3, 0]}>
        <capsuleGeometry args={[0.1, 0.7, 8, 16]} />
        <meshStandardMaterial color="#8fa8c8" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function HealthIndicator({ point }: { point: HealthPoint }) {
  const [hovered, setHovered] = useState(false);
  return (
    <mesh
      position={point.position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial
        color={statusColor[point.status]}
        emissive={statusColor[point.status]}
        emissiveIntensity={hovered ? 2 : 0.5}
      />
      {hovered && (
        <Html distanceFactor={3} style={{ pointerEvents: "none" }}>
          <div className="glass-card px-3 py-2 text-xs whitespace-nowrap">
            <p className="font-semibold">{point.label}</p>
            <p className="text-muted-foreground">{point.value}</p>
          </div>
        </Html>
      )}
    </mesh>
  );
}

const HealthVisualization3D = () => (
  <PageTransition>
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden" style={{ height: "60vh" }}>
        <Canvas camera={{ position: [0, 0.5, 3], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, 5, -5]} intensity={0.4} />
          <Suspense fallback={null}>
            <HumanModel />
            {healthPoints.map((p) => (
              <HealthIndicator key={p.label} point={p} />
            ))}
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={(3 * Math.PI) / 4} />
        </Canvas>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {healthPoints.map((p) => (
          <motion.div key={p.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: statusColor[p.status] }} />
            <p className="text-xs text-muted-foreground">{p.label}</p>
            <p className="text-sm font-semibold">{p.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        {Object.entries(statusColor).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{key === "green" ? "Normal" : key === "yellow" ? "Warning" : "Critical"}</span>
          </div>
        ))}
      </div>
    </div>
  </PageTransition>
);

export default HealthVisualization3D;
