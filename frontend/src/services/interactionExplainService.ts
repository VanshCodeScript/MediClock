/**
 * Service to generate patient-friendly explanations for drug interactions
 */

import { InteractionResult } from "./interactionService";

export type Severity = "high" | "medium" | "low";

/* ------------------------------------------------ */
/* Dynamic Risk Rating */
/* ------------------------------------------------ */

export function calculateDynamicRiskRating(
  interaction: InteractionResult
): number {
  let riskScore = 0;

  const severityScore: Record<Severity, number> = {
    high: 4,
    medium: 2.5,
    low: 1,
  };

  riskScore += severityScore[interaction.severity] ?? 2;

  const confidence = interaction.confidence ?? 50;
  riskScore += (confidence / 100) * 2;

  const sideEffectsCount = interaction.sideEffects?.length ?? 0;
  riskScore += Math.min((sideEffectsCount / 5) * 2, 2);

  if (interaction.mechanism) {
    riskScore += Math.min((interaction.mechanism.length / 200) * 1.5, 1.5);
  }

  if (interaction.recommendation?.toLowerCase().includes("avoid")) {
    riskScore += 0.5;
  }

  return Math.max(0, Math.min(10, riskScore));
}

/* ------------------------------------------------ */
/* Simple Explanation */
/* ------------------------------------------------ */

export function generateSimpleExplanation(
  interaction: InteractionResult
): string {
  const { drugA, drugB, severity, note } = interaction;

  const severityDescriptions: Record<Severity, string> = {
    high: "serious or potentially life-threatening",
    medium: "moderate and should be monitored carefully",
    low: "mild and unlikely to cause major problems",
  };

  const severityDesc = severityDescriptions[severity] ?? "moderate";

  if (note) {
    return `Taking ${drugA} together with ${drugB} can cause a ${severityDesc} interaction. ${note}`;
  }

  return `${drugA} and ${drugB} may interact in a ${severityDesc} way when taken together. Always consult your doctor before combining these medicines.`;
}

/* ------------------------------------------------ */
/* Mechanism Explanation */
/* ------------------------------------------------ */

export function generateMechanismExplanation(
  interaction: InteractionResult
): string {
  if (!interaction.mechanism) {
    return "The exact biological mechanism of this interaction is not fully documented.";
  }

  return `These medicines affect related biological systems. When used together they can amplify each other's effects. Scientific explanation: ${interaction.mechanism}`;
}

/* ------------------------------------------------ */
/* Side Effects */
/* ------------------------------------------------ */

const SIDE_EFFECT_REASONS: Record<string, string> = {
  "Stomach irritation":
    "because both medicines may irritate the stomach lining",
  "Gastrointestinal bleeding":
    "because the medicines thin the blood or irritate the digestive tract",
  "Increased bleeding risk":
    "due to reduced blood clotting ability when both medicines are present",
  Dizziness:
    "because the combination affects blood pressure or the nervous system",
  Nausea:
    "due to irritation of the digestive tract or nervous system response",
  "Liver damage":
    "because both medicines are processed by the liver",
  "Kidney problems":
    "because both medicines are filtered through the kidneys",
  Drowsiness:
    "because both medicines affect the central nervous system",
};

export function generateDetailedSideEffects(
  interaction: InteractionResult
): Array<{ effect: string; reason: string }> {
  if (!interaction.sideEffects?.length) return [];

  return interaction.sideEffects.map((effect) => ({
    effect,
    reason:
      SIDE_EFFECT_REASONS[effect] ??
      `due to interaction between ${interaction.drugA} and ${interaction.drugB}`,
  }));
}

/* ------------------------------------------------ */
/* Recommendations */
/* ------------------------------------------------ */

export function generateRecommendationActions(
  interaction: InteractionResult
): string[] {
  const actions: string[] = [];

  switch (interaction.severity) {
    case "high":
      actions.push(
        "Avoid taking both medicines together unless advised by a doctor",
        "Seek professional medical advice before combining these medicines"
      );
      break;

    case "medium":
      actions.push(
        "Take medicines at different times if advised",
        "Monitor for unusual symptoms or side effects"
      );
      break;

    default:
      actions.push(
        "These medicines usually have minimal interaction risk",
        "Follow prescribed dosage instructions carefully"
      );
  }

  if (interaction.timeGap) {
    actions.push(`Maintain the suggested time gap: ${interaction.timeGap}`);
  }

  if (interaction.recommendation) {
    actions.push(interaction.recommendation);
  }

  return actions;
}

/* ------------------------------------------------ */
/* Time Gap Explanation */
/* ------------------------------------------------ */

export function generateTimeGapExplanation(
  interaction: InteractionResult
): string | null {
  const gap = interaction.timeGap;

  if (!gap) return null;

  if (gap.includes("hours")) {
    return `Spacing these medicines by ${gap} helps reduce overlapping effects inside the body.`;
  }

  if (gap.toLowerCase().includes("avoid")) {
    return "These medicines should not be taken together at the same time.";
  }

  return `Follow this recommended timing: ${gap}`;
}

/* ------------------------------------------------ */
/* Confidence Explanation */
/* ------------------------------------------------ */

export function getConfidenceExplanation(confidence: number): string {
  if (confidence >= 90) return "Very high clinical evidence.";
  if (confidence >= 75) return "Strong clinical evidence.";
  if (confidence >= 60) return "Moderate medical documentation.";
  if (confidence >= 45) return "Limited clinical evidence.";
  return "Low evidence – consult a healthcare professional.";
}

/* ------------------------------------------------ */
/* Risk Score Explanation */
/* ------------------------------------------------ */

export function getRiskScoreExplanation(score: number): string {
  if (score >= 8) return "Very high risk interaction.";
  if (score >= 7) return "High risk interaction.";
  if (score >= 5) return "Moderate interaction risk.";
  if (score >= 3) return "Low-moderate interaction risk.";
  return "Minimal interaction risk.";
}

/* ------------------------------------------------ */
/* Alternatives */
/* ------------------------------------------------ */

export function formatAlternativesForDisplay(
  interaction: InteractionResult
) {
  if (interaction.alternativesByDrug?.length) {
    return interaction.alternativesByDrug;
  }

  if (!interaction.alternatives?.length) return [];

  return interaction.alternatives.map((alt) => ({
    drugName: "Alternative medication",
    alternatives: [
      {
        drug: alt,
        reason: "May reduce interaction risk",
      },
    ],
  }));
}

/* ------------------------------------------------ */
/* Severity Colors */
/* ------------------------------------------------ */

export function getSeverityColors(severity: Severity) {
  const map = {
    high: {
      label: "High Risk",
      description: "Dangerous interaction",
      textColor: "text-red-700",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    medium: {
      label: "Moderate Risk",
      description: "Monitor closely",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    low: {
      label: "Low Risk",
      description: "Minimal interaction",
      textColor: "text-green-700",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  };

  return map[severity];
}