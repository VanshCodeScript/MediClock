import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HealthMetrics } from "@/hooks/useHealthMetrics";
import {
  getStressColor,
  getSugarColor,
  getHeartRiskColor,
  getSleepColor,
  getMedicationRiskColor,
  getEmissiveIntensity,
} from "@/utils/healthColorUtils";

interface HumanBodyProps {
  metrics: HealthMetrics;
}

interface BodyMesh {
  name: string;
  mesh: THREE.Mesh;
  getColor: (metrics: HealthMetrics) => THREE.Color;
}

/**
 * HumanBody Component
 * 
 * Creates a procedural 3D human body model with body regions
 * that change color and glow based on health metrics:
 * - Head: Stress level
 * - Chest: Heart rate and medication risk
 * - Abdomen: Blood sugar
 * - Overall body glow: Sleep quality
 */
export const HumanBody: React.FC<HumanBodyProps> = ({ metrics }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMeshes = useRef<BodyMesh[]>([]);
  const pulseRef = useRef<number>(0);

  useEffect(() => {
    if (!groupRef.current) return;

    // Clear previous meshes
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }
    bodyMeshes.current = [];

    // Create head
    const headGeo = new THREE.SphereGeometry(0.25, 32, 32);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xa3b8cc,
      roughness: 0.3,
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.6, 0);
    head.castShadow = true;
    groupRef.current.add(head);
    bodyMeshes.current.push({
      name: "head",
      mesh: head,
      getColor: (m) => getStressColor(m.stress),
    });

    // Create torso/chest
    const chestGeo = new THREE.CapsuleGeometry(0.3, 0.8, 16, 32);
    const chestMat = new THREE.MeshStandardMaterial({
      color: 0x8fa8c8,
      roughness: 0.3,
      metalness: 0.1,
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 0.7, 0);
    chest.castShadow = true;
    groupRef.current.add(chest);
    bodyMeshes.current.push({
      name: "chest",
      mesh: chest,
      getColor: (m) => {
        // Blend heart rate risk and medication risk
        const heartRisk = getHeartRiskColor((m.heartRate - 40) / 80 * 100);
        const medRisk = getMedicationRiskColor(m.medicationRisk);
        const blended = new THREE.Color();
        blended.lerpColors(heartRisk, medRisk, 0.5);
        return blended;
      },
    });

    // Create abdomen
    const abdomGeo = new THREE.CapsuleGeometry(0.25, 0.6, 16, 32);
    const abdomMat = new THREE.MeshStandardMaterial({
      color: 0x8fa8c8,
      roughness: 0.3,
      metalness: 0.1,
    });
    const abdomen = new THREE.Mesh(abdomGeo, abdomMat);
    abdomen.position.set(0, -0.3, 0);
    abdomen.castShadow = true;
    groupRef.current.add(abdomen);
    bodyMeshes.current.push({
      name: "abdomen",
      mesh: abdomen,
      getColor: (m) => getSugarColor(m.bloodSugar),
    });

    // Create left arm
    const leftArmGeo = new THREE.CapsuleGeometry(0.08, 0.6, 8, 16);
    const leftArmMat = new THREE.MeshStandardMaterial({
      color: 0x8fa8c8,
      roughness: 0.4,
      metalness: 0.05,
    });
    const leftArm = new THREE.Mesh(leftArmGeo, leftArmMat);
    leftArm.position.set(-0.55, 0.7, 0);
    leftArm.rotation.z = 0.2;
    leftArm.castShadow = true;
    groupRef.current.add(leftArm);

    // Create right arm
    const rightArmGeo = new THREE.CapsuleGeometry(0.08, 0.6, 8, 16);
    const rightArmMat = new THREE.MeshStandardMaterial({
      color: 0x8fa8c8,
      roughness: 0.4,
      metalness: 0.05,
    });
    const rightArm = new THREE.Mesh(rightArmGeo, rightArmMat);
    rightArm.position.set(0.55, 0.7, 0);
    rightArm.rotation.z = -0.2;
    rightArm.castShadow = true;
    groupRef.current.add(rightArm);

    // Create left leg
    const leftLegGeo = new THREE.CapsuleGeometry(0.1, 0.7, 8, 16);
    const leftLegMat = new THREE.MeshStandardMaterial({
      color: 0x8fa8c8,
      roughness: 0.4,
      metalness: 0.05,
    });
    const leftLeg = new THREE.Mesh(leftLegGeo, leftLegMat);
    leftLeg.position.set(-0.15, -0.8, 0);
    leftLeg.castShadow = true;
    groupRef.current.add(leftLeg);

    // Create right leg
    const rightLegGeo = new THREE.CapsuleGeometry(0.1, 0.7, 8, 16);
    const rightLegMat = new THREE.MeshStandardMaterial({
      color: 0x8fa8c8,
      roughness: 0.4,
      metalness: 0.05,
    });
    const rightLeg = new THREE.Mesh(rightLegGeo, rightLegMat);
    rightLeg.position.set(0.15, -0.8, 0);
    rightLeg.castShadow = true;
    groupRef.current.add(rightLeg);

    return () => {
      // Cleanup geometries and materials
      headGeo.dispose();
      headMat.dispose();
      chestGeo.dispose();
      chestMat.dispose();
      abdomGeo.dispose();
      abdomMat.dispose();
      leftArmGeo.dispose();
      leftArmMat.dispose();
      rightArmGeo.dispose();
      rightArmMat.dispose();
      leftLegGeo.dispose();
      leftLegMat.dispose();
      rightLegGeo.dispose();
      rightLegMat.dispose();
    };
  }, []);

  // Update colors and glow based on metrics
  useEffect(() => {
    bodyMeshes.current.forEach(({ mesh, getColor }) => {
      const color = getColor(metrics);
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.color.copy(color);
      material.emissive.copy(color);
      material.emissiveIntensity = getEmissiveIntensity(
        mesh.name === "head" ? metrics.stress :
        mesh.name === "chest" ? (metrics.heartRate - 40) / 80 * 100 :
        mesh.name === "abdomen" ? Math.min(metrics.bloodSugar, 180) / 1.8 :
        50
      ) * 0.8;
    });
  }, [metrics]);

  // Animation loop for rotations and heartbeat
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle auto-rotation (handled by OrbitControls now, but keeping for smooth motion)
      groupRef.current.rotation.y += 0.0005;

      // Heartbeat pulse on chest
      pulseRef.current = clock.getElapsedTime();
      const chestMesh = bodyMeshes.current.find((m) => m.name === "chest");
      if (chestMesh) {
        // Heart rate: 60-120 bpm → pulse speed
        const pulseSpeed = metrics.heartRate / 60;
        const pulseScale = 1 + Math.sin(pulseRef.current * pulseSpeed * Math.PI) * 0.08;
        chestMesh.mesh.scale.set(1, pulseScale, 1);
        
        // Breathing animation
        const breathScale = 1 + Math.sin(pulseRef.current * 0.5) * 0.05;
        groupRef.current.scale.y = breathScale;
      }
    }
  });

  return <group ref={groupRef} />;
};

export default HumanBody;
