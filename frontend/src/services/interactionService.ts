/**
 * Drug Interaction Service
 * Handles communication with backend API
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
  dynamicRiskRating?: number;
  alternativesByDrug?: AlternativeGroup[];
}

export interface InteractionCheckResponse {
  interactions: InteractionResult[];
}

/* ------------------------------------------------ */
/* API Config */
/* ------------------------------------------------ */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const REQUEST_TIMEOUT = 8000;

/* ------------------------------------------------ */
/* Generic Fetch Helper */
/* ------------------------------------------------ */

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(
        `API Error (${response.status}) ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(id);

    if (error.name === "AbortError") {
      throw new Error("Request timed out. Backend may be slow.");
    }

    throw error;
  }
}

/* ------------------------------------------------ */
/* Check Drug Interactions */
/* ------------------------------------------------ */

export async function checkDrugInteractions(
  drugs: string[]
): Promise<InteractionResult[]> {
  if (!drugs || drugs.length < 2) {
    throw new Error("At least two drugs required.");
  }

  try {
    const data: InteractionCheckResponse =
      await fetchWithTimeout(`${API_BASE_URL}/interactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drugs }),
      });

    return data?.interactions ?? [];
  } catch (error) {
    console.error("Drug interaction check failed:", error);
    throw error;
  }
}

/* ------------------------------------------------ */
/* Fetch Available Drugs */
/* ------------------------------------------------ */

export async function getDrugsList(): Promise<string[]> {
  try {
    const data = await fetchWithTimeout(`${API_BASE_URL}/drugs`);

    return data?.drugs ?? [];
  } catch (error) {
    console.error("Failed to fetch drug list:", error);
    return [];
  }
}

/* ------------------------------------------------ */
/* Risk Scoring */
/* ------------------------------------------------ */

export function getRiskScore(severity: string): number {
  const scores: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return scores[severity] ?? 1;
}

export function calculateOverallRisk(
  interactions: InteractionResult[]
): "none" | "low" | "medium" | "high" {
  if (!interactions || interactions.length === 0) {
    return "none";
  }

  const scores = interactions.map((i) => getRiskScore(i.severity));

  const avg =
    scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg >= 2.5) return "high";
  if (avg >= 1.5) return "medium";
  return "low";
}

/* ------------------------------------------------ */
/* API Health Check */
/* ------------------------------------------------ */

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}