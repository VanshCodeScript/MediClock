import { Canvas } from "@react-three/fiber";
import {
  Environment,
  useGLTF,
  ContactShadows,
  Center,
  OrbitControls,
} from "@react-three/drei";
import { useHealthMetrics } from "@/hooks/useHealthMetrics";
import {
  getColorHex,
  getStressColor,
  getSugarColor,
  getHeartRiskColor,
  getMedicationRiskColor,
  getSleepColor,
} from "@/utils/healthColorUtils";

/* ── CSS overlay label card ─────────────────────────────────── */
function AnnotationLabel({
  side,
  color,
  title,
  value,
  sub,
  topPct,
}: {
  side: "left" | "right";
  color: string;
  title: string;
  value: string;
  sub: string;
  topPct: string; // e.g. "18%"
}) {
  const isRight = side === "right";
  return (
    <div
      style={{
        position: "absolute",
        top: topPct,
        ...(isRight ? { right: "26%" } : { left: "26%" }),
        display: "flex",
        alignItems: "center",
        flexDirection: isRight ? "row-reverse" : "row",
        gap: 0,
        transform: "translateY(-50%)",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {/* card */}
      <div
        style={{
          background: "rgba(6,6,20,0.90)",
          backdropFilter: "blur(12px)",
          border: `1.5px solid ${color}`,
          borderRadius: 9,
          padding: "5px 11px",
          minWidth: 115,
          textAlign: isRight ? "right" : "left",
        }}
      >
        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
          {title}
        </div>
        <div style={{ fontSize: 16, color, fontWeight: 800, lineHeight: 1.3 }}>{value}</div>
        <div style={{ fontSize: 9, color: "#d1d5db", marginTop: 1 }}>{sub}</div>
      </div>

      {/* connector line */}
      <div style={{ display: "flex", alignItems: "center", flexDirection: isRight ? "row-reverse" : "row" }}>
        <div style={{ width: 25, height: 2, background: color, opacity: 0.75 }} />
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 7px ${color}`,
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
}

/* ── 3D avatar mesh ─────────────────────────────────────────── */
function HumanModel() {
  const { scene } = useGLTF("/models/human_avatar.glb");
  const metrics = useHealthMetrics();

  const stressColor = getColorHex(getStressColor(metrics.stress));
  const sugarColor  = getColorHex(getSugarColor(metrics.bloodSugar));
  const heartColor  = getColorHex(getHeartRiskColor(((metrics.heartRate - 40) / 80) * 100));
  const medColor    = getColorHex(getMedicationRiskColor(metrics.medicationRisk));

  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
      if (child.material) {
        child.material.roughness = 0.5;
        child.material.metalness = 0.1;
      }
      const name = child.name?.toLowerCase();
      if (name?.includes("head")) {
        child.material.emissive.set(stressColor);
        child.material.emissiveIntensity = 0.4;
      }
      if (name?.includes("chest")) {
        child.material.emissive.set(heartColor);
        child.material.emissiveIntensity = 0.5;
      }
      if (name?.includes("spine") || name?.includes("abdomen")) {
        child.material.emissive.set(sugarColor);
        child.material.emissiveIntensity = 0.4;
      }
      if (metrics.medicationRisk > 60) {
        child.material.emissive.set(medColor);
        child.material.emissiveIntensity = 0.25;
      }
    }
  });

  return (
    <Center>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={0.48}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

/* ── Main export ────────────────────────────────────────────── */
export const HealthAvatar = ({ className }: { className?: string }) => {
  const metrics = useHealthMetrics();

  const stressColor = getColorHex(getStressColor(metrics.stress));
  const heartColor  = getColorHex(getHeartRiskColor(((metrics.heartRate - 40) / 80) * 100));
  const sugarColor  = getColorHex(getSugarColor(metrics.bloodSugar));
  const sleepColor  = getColorHex(getSleepColor(metrics.sleepScore));

  const stressSub = metrics.stress < 40 ? "Normal" : metrics.stress < 70 ? "Elevated" : "High";
  const heartSub  = metrics.heartRate < 60 ? "Low" : metrics.heartRate < 100 ? "Normal" : "Elevated";
  const sugarSub  = metrics.bloodSugar < 100 ? "Optimal" : metrics.bloodSugar < 140 ? "Borderline" : "High";
  const sleepSub  = metrics.sleepScore >= 80 ? "Excellent" : metrics.sleepScore >= 60 ? "Fair" : "Poor";

  return (
    <div className={className} style={{ position: "relative" }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 5.5], fov: 55 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor("#00000000", 0);
          camera.lookAt(0, 0, 0);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 4]} intensity={1.4} castShadow />
        <Environment preset="studio" />
        <HumanModel />
        
        {/* Enable rotating and zooming, keep default home view */}
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        
        <ContactShadows position={[0, -0.75, 0]} opacity={0.4} scale={8} blur={2.5} />
      </Canvas>

      {/* CSS-overlay labels — perfectly positioned via %, independent of 3D math */}

      {/* RIGHT: 🧠 Stress → head (~22%) */}
      <AnnotationLabel side="right" topPct="22%" color={stressColor}
        title="🧠 Stress" value={`${Math.round(metrics.stress)}%`} sub={stressSub} />

      {/* RIGHT: ❤️ Heart Rate → chest (~36%) */}
      <AnnotationLabel side="right" topPct="36%" color={heartColor}
        title="❤️ Heart Rate" value={`${Math.round(metrics.heartRate)} bpm`} sub={heartSub} />

      {/* LEFT: 🩸 Blood Sugar → abdomen (~50%) */}
      <AnnotationLabel side="left" topPct="50%" color={sugarColor}
        title="🩸 Blood Sugar" value={`${Math.round(metrics.bloodSugar)} mg/dL`} sub={sugarSub} />

      {/* LEFT: 😴 Sleep → legs (~66%) */}
      <AnnotationLabel side="left" topPct="66%" color={sleepColor}
        title="😴 Sleep Quality" value={`${Math.round(metrics.sleepScore)}%`} sub={sleepSub} />
    </div>
  );
};

useGLTF.preload("/models/human_avatar.glb");
