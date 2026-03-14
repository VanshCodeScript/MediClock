/**
 * Service for checking drug-drug interactions
 */

export interface Alternative {
  drug: string;
  reason: string;
}

export interface AlternativeGroup {
  drugName: string;
  alternatives: Alternative[];
}

export interface InteractionResult {
  drugA: string;
  drugB: string;
  severity: "high" | "medium" | "low";
  note: string;
  mechanism?: string;
  sideEffects?: string[];
  recommendation?: string;
  timeGap?: string;
  confidence?: number;
  alternatives?: string[];
  dynamicRiskRating?: number;  // 0-10 numeric score
  alternativesByDrug?: AlternativeGroup[];  // Structured alternatives per drug
}

export interface InteractionCheckResponse {
  interactions: InteractionResult[];
}

const API_BASE_URL = "http://localhost:8000";

/**
 * Check for drug interactions
 */
export async function checkDrugInteractions(drugs: string[]): Promise<InteractionResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ drugs }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data: InteractionCheckResponse = await response.json();
    return data.interactions;
  } catch (error) {
    console.error("Error checking drug interactions:", error);
    throw error;
  }
}

/**
 * Get list of all available drugs
 */
export async function getDrugsList(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/drugs`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.drugs;
  } catch (error) {
    console.error("Error fetching drugs list:", error);
    throw error;
  }
}

/**
 * Get severity-based risk score
 */
export function getRiskScore(severity: string): number {
  const scores: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  return scores[severity] || 1;
}

/**
 * Calculate overall risk from multiple interactions
 */
export function calculateOverallRisk(interactions: InteractionResult[]): string {
  if (interactions.length === 0) return "none";

  const scores = interactions.map(i => getRiskScore(i.severity));
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avgScore >= 2.5) return "high";
  if (avgScore >= 1.5) return "medium";
  return "low";
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
