import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HealthMetrics } from "@/hooks/useHealthMetrics";
import {
  getStressColor,
  getSugarColor,
  getHeartRiskColor,
  getMedicationRiskColor,
} from "@/utils/healthColorUtils";

interface HealthHeatmapProps {
  metrics: HealthMetrics;
}

interface HeatmapZone {
  position: [number, number, number];
  radius: number;
  label: string;
  getColor: (metrics: HealthMetrics) => THREE.Color;
  getRiskLevel: (metrics: HealthMetrics) => number; // 0-1
}

/**
 * HealthHeatmap Component
 * 
 * Visualizes risk zones with expanding/contracting glow spheres.
 * Higher risk = larger, more intense glow.
 * 
 * Zones:
 * - Brain: Stress level
 * - Heart: Medication risk interactions
 * - Liver: Blood sugar processing
 */
export const HealthHeatmap: React.FC<HealthHeatmapProps> = ({ metrics }) => {
  const groupRef = useRef<THREE.Group>(null);
  const heatmapMeshes = useRef<THREE.Mesh[]>([]);

  const heatmapZones: HeatmapZone[] = [
    {
      position: [0, 1.6, 0],
      radius: 0.4,
      label: "Brain",
      getColor: (m) => getStressColor(m.stress),
      getRiskLevel: (m) => Math.min(1, m.stress / 100),
    },
    {
      position: [0, 0.7, 0],
      radius: 0.45,
      label: "Heart",
      getColor: (m) => getMedicationRiskColor(m.medicationRisk),
      getRiskLevel: (m) => Math.min(1, m.medicationRisk / 100),
    },
    {
      position: [0, -0.3, 0],
      radius: 0.35,
      label: "Metabolism",
      getColor: (m) => getSugarColor(m.bloodSugar),
      getRiskLevel: (m) => {
        // Normalize blood sugar to risk (70-140 is normal, extremes are risk)
        if (m.bloodSugar < 70) return (70 - m.bloodSugar) / 70;
        if (m.bloodSugar > 140) return (m.bloodSugar - 140) / 100;
        return 0;
      },
    },
  ];

  useEffect(() => {
    if (!groupRef.current) return;

    // Clear previous heatmap zones
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }
    heatmapMeshes.current = [];

    // Create heatmap zones
    heatmapZones.forEach((zone) => {
      const geometry = new THREE.IcosahedronGeometry(zone.radius, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        wireframe: false,
        fog: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(zone.position[0], zone.position[1], zone.position[2]);
      groupRef.current.add(mesh);
      heatmapMeshes.current.push(mesh);
    });

    return () => {
      heatmapZones.forEach((_, i) => {
        const mesh = heatmapMeshes.current[i];
        if (mesh) {
          (mesh.geometry as THREE.BufferGeometry).dispose();
          (mesh.material as THREE.Material).dispose();
        }
      });
    };
  }, []);

  // Update heatmap based on metrics
  useEffect(() => {
    heatmapMeshes.current.forEach((mesh, index) => {
      const zone = heatmapZones[index];
      const color = zone.getColor(metrics);
      const riskLevel = zone.getRiskLevel(metrics);

      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.copy(color);
      material.opacity = Math.max(0, riskLevel * 0.3);
    });
  }, [metrics]);

  // Breathing/Pulsing animation based on risk
  useFrame(({ clock }) => {
    heatmapMeshes.current.forEach((mesh, index) => {
      const zone = heatmapZones[index];
      const riskLevel = zone.getRiskLevel(metrics);

      if (riskLevel > 0.1) {
        // Pulse speed increases with risk
        const pulseSpeed = 1 + riskLevel * 2;
        const pulse = Math.sin(clock.getElapsedTime() * pulseSpeed) * 0.3 + 0.7;
        mesh.scale.set(pulse, pulse, pulse);

        // Rotation increases with risk
        mesh.rotation.x += 0.001 * riskLevel;
        mesh.rotation.y += 0.002 * riskLevel;
      } else {
        mesh.scale.set(0.9, 0.9, 0.9);
      }
    });
  });

  return <group ref={groupRef} />;
};

export default HealthHeatmap;
