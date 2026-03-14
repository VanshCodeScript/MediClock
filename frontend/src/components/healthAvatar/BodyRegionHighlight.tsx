import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HealthMetrics } from "@/hooks/useHealthMetrics";
import {
  getStressColor,
  getSugarColor,
  getHeartRiskColor,
  getEmissiveIntensity,
} from "@/utils/healthColorUtils";

interface BodyRegionHighlightProps {
  metrics: HealthMetrics;
}

interface HighlightZone {
  position: [number, number, number];
  radius: number;
  metric: keyof HealthMetrics;
  getColor: (value: number) => THREE.Color;
  getIntensity: (value: number) => number;
}

/**
 * BodyRegionHighlight Component
 * 
 * Creates glowing highlight zones around specific body regions
 * based on metric thresholds. When metrics are in warning/critical
 * zones, these highlights become more prominent.
 */
export const BodyRegionHighlight: React.FC<BodyRegionHighlightProps> = ({ metrics }) => {
  const groupRef = useRef<THREE.Group>(null);
  const highlightMeshes = useRef<THREE.Mesh[]>([]);

  const highlightZones: HighlightZone[] = [
    {
      position: [0, 1.6, -0.3],
      radius: 0.35,
      metric: "stress",
      getColor: getStressColor,
      getIntensity: (value) => {
        // More intense glow for higher stress
        return Math.max(0, (value - 40) / 60);
      },
    },
    {
      position: [0, 0.7, -0.3],
      radius: 0.4,
      metric: "heartRate",
      getColor: (value) => getHeartRiskColor((value - 40) / 80 * 100),
      getIntensity: (value) => {
        // More intense glow for abnormal heart rates
        const normalized = (value - 40) / 80;
        return Math.abs(normalized - 0.5) * 2;
      },
    },
    {
      position: [0, -0.3, -0.3],
      radius: 0.35,
      metric: "bloodSugar",
      getColor: getSugarColor,
      getIntensity: (value) => {
        // More intense glow for high blood sugar
        return Math.max(0, (value - 100) / 80);
      },
    },
  ];

  useEffect(() => {
    if (!groupRef.current) return;

    // Clear previous highlights
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }
    highlightMeshes.current = [];

    // Create highlight zones
    highlightZones.forEach((zone) => {
      const geometry = new THREE.SphereGeometry(zone.radius, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(zone.position[0], zone.position[1], zone.position[2]);
      groupRef.current.add(mesh);
      highlightMeshes.current.push(mesh);
    });

    return () => {
      highlightZones.forEach((_, i) => {
        const mesh = highlightMeshes.current[i];
        if (mesh) {
          (mesh.geometry as THREE.BufferGeometry).dispose();
          (mesh.material as THREE.Material).dispose();
        }
      });
    };
  }, []);

  // Update highlight colors and opacity based on metrics
  useEffect(() => {
    highlightMeshes.current.forEach((mesh, index) => {
      const zone = highlightZones[index];
      const metricValue = metrics[zone.metric];
      const color = zone.getColor(metricValue as number);
      const intensity = zone.getIntensity(metricValue as number);

      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.copy(color);
      material.opacity = Math.min(0.4, intensity * 0.3);
    });
  }, [metrics]);

  // Pulsing animation
  useFrame(({ clock }) => {
    highlightMeshes.current.forEach((mesh, index) => {
      const zone = highlightZones[index];
      const metricValue = metrics[zone.metric];
      const intensity = zone.getIntensity(metricValue as number);

      if (intensity > 0) {
        const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.5 + 0.5;
        mesh.scale.set(
          1 + pulse * 0.1,
          1 + pulse * 0.1,
          1 + pulse * 0.1
        );
      } else {
        mesh.scale.set(1, 1, 1);
      }
    });
  });

  return <group ref={groupRef} />;
};

export default BodyRegionHighlight;
