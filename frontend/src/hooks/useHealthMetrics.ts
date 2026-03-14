import { useEffect, useState } from "react";

export interface HealthMetrics {
  stress: number; // 0-100
  bloodSugar: number; // mg/dL
  heartRate: number; // bpm
  sleepScore: number; // 0-100
  medicationRisk: number; // 0-100
}

/**
 * Custom hook to provide health metrics data
 * Currently returns mock data, but can be extended to:
 * - Fetch from backend health database
 * - Connect to Google Fit API
 * - Integrate with wearable device APIs
 * - Use AI prediction engine
 */
export const useHealthMetrics = (): HealthMetrics => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    stress: 45,
    bloodSugar: 102,
    heartRate: 72,
    sleepScore: 78,
    medicationRisk: 35,
  });

  useEffect(() => {
    // Simulate real-time data updates with slight variations
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        stress: Math.max(0, Math.min(100, prev.stress + (Math.random() - 0.5) * 5)),
        bloodSugar: Math.max(60, Math.min(180, prev.bloodSugar + (Math.random() - 0.5) * 3)),
        heartRate: Math.max(40, Math.min(120, prev.heartRate + (Math.random() - 0.5) * 4)),
        sleepScore: Math.max(0, Math.min(100, prev.sleepScore + (Math.random() - 0.5) * 2)),
        medicationRisk: Math.max(0, Math.min(100, prev.medicationRisk + (Math.random() - 0.5) * 3)),
      }));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
};
