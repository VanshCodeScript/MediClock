import * as THREE from "three";

/**
 * Color mapping utility for health metrics
 * Returns THREE.Color objects based on metric values
 */

/**
 * Get color for stress level (0-100)
 * 0-40: Green (normal)
 * 40-70: Yellow (elevated)
 * 70+: Red (high)
 */
export const getStressColor = (value: number): THREE.Color => {
  if (value < 40) {
    return new THREE.Color(0x22c55e); // Green
  } else if (value < 70) {
    return new THREE.Color(0xfbbf24); // Yellow
  } else {
    return new THREE.Color(0xef4444); // Red
  }
};

/**
 * Get color for blood sugar (mg/dL)
 * <100: Green (normal)
 * 100-140: Yellow (borderline)
 * 140+: Red (high)
 */
export const getSugarColor = (value: number): THREE.Color => {
  if (value < 100) {
    return new THREE.Color(0x22c55e); // Green
  } else if (value < 140) {
    return new THREE.Color(0xfbbf24); // Yellow
  } else {
    return new THREE.Color(0xef4444); // Red
  }
};

/**
 * Get color for heart rate based on risk (0-100)
 * 0-40: Green (normal)
 * 40-70: Yellow (elevated)
 * 70+: Red (high risk)
 */
export const getHeartRiskColor = (value: number): THREE.Color => {
  if (value < 40) {
    return new THREE.Color(0x22c55e); // Green
  } else if (value < 70) {
    return new THREE.Color(0xfbbf24); // Yellow
  } else {
    return new THREE.Color(0xef4444); // Red
  }
};

/**
 * Get color for sleep quality (0-100)
 * 80-100: Green (excellent)
 * 60-79: Yellow (fair)
 * <60: Red (poor)
 */
export const getSleepColor = (value: number): THREE.Color => {
  if (value >= 80) {
    return new THREE.Color(0x22c55e); // Green
  } else if (value >= 60) {
    return new THREE.Color(0xfbbf24); // Yellow
  } else {
    return new THREE.Color(0xef4444); // Red
  }
};

/**
 * Get color for medication risk (0-100)
 * 0-30: Green (low risk)
 * 30-60: Yellow (moderate risk)
 * 60+: Red (high risk)
 */
export const getMedicationRiskColor = (value: number): THREE.Color => {
  if (value < 30) {
    return new THREE.Color(0x22c55e); // Green
  } else if (value < 60) {
    return new THREE.Color(0xfbbf24); // Yellow
  } else {
    return new THREE.Color(0xef4444); // Red
  }
};

/**
 * Get color intensity for emissive glow effect (0-1)
 * Higher value = brighter glow
 */
export const getEmissiveIntensity = (healthValue: number): number => {
  // Values closer to 0 or 100 will have higher intensity
  const distance = Math.abs(healthValue - 50);
  return 0.3 + (distance / 50) * 1.5;
};

/**
 * Get color hex string for UI display
 */
export const getColorHex = (color: THREE.Color): string => {
  return `#${color.getHexString()}`;
};

/**
 * Interpolate between colors based on a value (0-1)
 * Useful for smooth color transitions
 */
export const interpolateColor = (
  color1: THREE.Color,
  color2: THREE.Color,
  factor: number
): THREE.Color => {
  const result = new THREE.Color();
  result.lerpColors(color1, color2, Math.max(0, Math.min(1, factor)));
  return result;
};
