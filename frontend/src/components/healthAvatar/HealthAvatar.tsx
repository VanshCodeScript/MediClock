import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { HumanBody } from "./HumanBody";
import { HealthLabels } from "./HealthLabels";
import { HealthHeatmap } from "./HealthHeatmap";
import { BodyRegionHighlight } from "./BodyRegionHighlight";
import { useHealthMetrics } from "@/hooks/useHealthMetrics";

interface HealthAvatarProps {
  className?: string;
}

/**
 * HealthAvatar Component
 * 
 * Creates a 3D visualization canvas with:
 * - Three.js scene setup
 * - Lighting configuration
 * - Camera positioning
 * - Human body model
 * - Health metric overlays
 * - Interactive controls
 */
export const HealthAvatar: React.FC<HealthAvatarProps> = ({ className = "" }) => {
  const metrics = useHealthMetrics();

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8}
          castShadow
        />
        <pointLight position={[-5, 5, -5]} intensity={0.4} />
        <pointLight position={[0, -2, 0]} intensity={0.3} />

        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={50} />

        {/* Main content */}
        <Suspense fallback={null}>
          {/* Human body with health metric coloring */}
          <HumanBody metrics={metrics} />

          {/* Body region highlights for warning zones */}
          <BodyRegionHighlight metrics={metrics} />

          {/* Health metric labels */}
          <HealthLabels metrics={metrics} />

          {/* Heatmap for risk zones */}
          <HealthHeatmap metrics={metrics} />
        </Suspense>

        {/* Interactive controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          autoRotate={true}
          autoRotateSpeed={2}
          minDistance={1.5}
          maxDistance={4}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={(5 * Math.PI) / 6}
        />
      </Canvas>
    </div>
  );
};

export default HealthAvatar;
