import React, { useState } from "react";
import { Html } from "@react-three/drei";
import { HealthMetrics } from "@/hooks/useHealthMetrics";
import { getColorHex, getStressColor, getSugarColor, getHeartRiskColor } from "@/utils/healthColorUtils";

interface HealthLabelProps {
  metrics: HealthMetrics;
}

interface LabelPosition {
  position: [number, number, number];
  label: string;
  value: string | number;
  unit: string;
  color: string;
}

/**
 * HealthLabels Component
 * 
 * Renders floating HTML labels above body regions
 * displaying health metrics with color coding
 */
export const HealthLabels: React.FC<HealthLabelProps> = ({ metrics }) => {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const labels: LabelPosition[] = [
    {
      position: [0, 2.0, 0.5],
      label: "Stress Level",
      value: Math.round(metrics.stress),
      unit: "%",
      color: getColorHex(getStressColor(metrics.stress)),
    },
    {
      position: [0.35, 0.9, 0.5],
      label: "Heart Rate",
      value: Math.round(metrics.heartRate),
      unit: "bpm",
      color: getColorHex(getHeartRiskColor((metrics.heartRate - 40) / 80 * 100)),
    },
    {
      position: [-0.35, -0.1, 0.5],
      label: "Blood Sugar",
      value: Math.round(metrics.bloodSugar),
      unit: "mg/dL",
      color: getColorHex(getSugarColor(metrics.bloodSugar)),
    },
    {
      position: [0.0, 0.0, 0.7],
      label: "Sleep Quality",
      value: Math.round(metrics.sleepScore),
      unit: "%",
      color: getColorHex(getStressColor(100 - metrics.sleepScore)),
    },
    {
      position: [0.0, -1.2, 0.5],
      label: "Med. Risk",
      value: Math.round(metrics.medicationRisk),
      unit: "%",
      color: getColorHex(getStressColor(metrics.medicationRisk)),
    },
  ];

  return (
    <>
      {labels.map((label) => (
        <Html
          key={label.label}
          position={label.position}
          distanceFactor={1}
          occlude="blending"
        >
          <div
            onMouseEnter={() => setHoveredLabel(label.label)}
            onMouseLeave={() => setHoveredLabel(null)}
            className={`
              px-3 py-2 rounded-lg backdrop-blur-md
              transition-all duration-200 cursor-pointer
              ${hoveredLabel === label.label ? "scale-110 shadow-lg" : "scale-100"}
              border border-opacity-30
            `}
            style={{
              backgroundColor: `${label.color}20`,
              borderColor: label.color,
            }}
          >
            <p className="text-xs font-semibold text-white" style={{ color: label.color }}>
              {label.label}
            </p>
            <p className="text-sm font-bold text-white whitespace-nowrap">
              {label.value}
              <span className="text-xs opacity-75 ml-1">{label.unit}</span>
            </p>
          </div>
        </Html>
      ))}
    </>
  );
};

export default HealthLabels;
