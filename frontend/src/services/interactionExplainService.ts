/**
 * Service to generate patient-friendly explanations for drug interactions
 */

import { InteractionResult } from "./interactionService";

/**
 * Calculate dynamic risk rating based on interaction characteristics
 * Returns 0-10 scale
 */
export function calculateDynamicRiskRating(
  interaction: InteractionResult
): number {
  let riskScore = 0;

  // 1. Base risk from severity (0-4 points)
  const severityScore: Record<string, number> = {
    high: 4,
    medium: 2.5,
    low: 1,
  };
  riskScore += severityScore[interaction.severity] || 2;

  // 2. Confidence boost (0-2 points)
  const confidence = interaction.confidence || 50;
  riskScore += (confidence / 100) * 2;

  // 3. Side effects multiplier (0-2 points)
  const sideEffectsCount = interaction.sideEffects?.length || 0;
  const sideEffectScore = Math.min((sideEffectsCount / 5) * 2, 2);
  riskScore += sideEffectScore;

  // 4. Mechanism complexity (0-1.5 points)
  if (interaction.mechanism) {
    const mechanismLength = interaction.mechanism.length;
    const mechanismScore = Math.min((mechanismLength / 200) * 1.5, 1.5);
    riskScore += mechanismScore;
  }

  // 5. Recommendation flag (0-0.5 points)
  if (
    interaction.recommendation &&
    interaction.recommendation.toLowerCase().includes("avoid")
  ) {
    riskScore += 0.5;
  }

  // Clamp to 0-10 scale
  return Math.min(Math.max(riskScore, 0), 10);
}

/**
 * Generate a simple, patient-friendly explanation for an interaction
 */
export function generateSimpleExplanation(
  interaction: InteractionResult
): string {
  const { drugA, drugB, severity, note } = interaction;
  
  const severityDescriptions: Record<string, string> = {
    high: "serious or potentially life-threatening",
    medium: "moderate and should be monitored carefully",
    low: "mild and unlikely to cause major problems",
  };
  
  const severityDesc = severityDescriptions[severity] || "moderate";
  
  // Try to extract a simple reason from the note if it exists
  if (note && note.length > 0) {
    return `Taking ${drugA} together with ${drugB} can cause a ${severityDesc} interaction. ${note}`;
  }
  
  return `${drugA} and ${drugB} may interact in a ${severityDesc} manner when taken together. Please consult with your doctor about how to safely use these medicines together.`;
}

/**
 * Generate an explanation for how the interaction happens
 */
export function generateMechanismExplanation(
  interaction: InteractionResult
): string {
  const { mechanism } = interaction;
  
  if (!mechanism) {
    return "The specific biological mechanism of this interaction is not fully documented.";
  }
  
  const intro = "These medicines affect similar systems in your body. When taken together, they can amplify each other's effects. Here's the scientific explanation: ";
  return intro + mechanism;
}

/**
 * Generate human-friendly explanations for side effects
 */
export function generateDetailedSideEffects(
  interaction: InteractionResult
): Array<{ effect: string; reason: string }> {
  const { sideEffects, mechanism, drugA, drugB } = interaction;
  
  if (!sideEffects || sideEffects.length === 0) {
    return [];
  }
  
  const reasons: Record<string, string> = {
    "Stomach irritation":
      "because both medicines increase stomach acid or irritate the stomach lining",
    "Gastrointestinal bleeding":
      "because the medicines thin the blood or irritate the digestive tract",
    "Increased bleeding risk":
      "due to reduced blood clotting ability when both medicines are present",
    "Nausea or dizziness":
      "when both medicines affect the nervous system or inner ear",
    "Liver damage":
      "because both medicines are processed by the liver, increasing stress on this organ",
    "Kidney problems":
      "because both medicines are filtered through the kidneys, putting extra strain on them",
    "Headache": "due to changes in blood pressure or nerve activity from the interaction",
    "Dizziness":
      "because the combination affects blood pressure regulation or inner ear function",
    "Drowsiness": "when both medicines have sedative effects on the central nervous system",
    "Increased heart rate":
      "due to stimulant effects or changes in heart rhythm control",
    "Low blood pressure":
      "because both medicines lower blood vessel tone or heart function",
    "High blood pressure":
      "because the interaction may increase vasoconstriction or heart activity",
    "Weakness or fatigue":
      "due to reduced nutrient absorption or increased metabolic demands",
    "Muscle pain": "due to reduced blood flow or changes in muscle metabolism",
    "Rash or allergic reaction":
      "because the combination may trigger an exaggerated immune response",
  };
  
  return sideEffects.map((effect) => ({
    effect: effect,
    reason:
      reasons[effect] ||
      `due to interaction between ${drugA} and ${drugB}`,
  }));
}

/**
 * Generate structured recommendation actions
 */
export function generateRecommendationActions(
  interaction: InteractionResult
): string[] {
  const { recommendation, severity, timeGap } = interaction;
  const actions: string[] = [];
  
  // Add severity-based recommendation
  if (severity === "high") {
    actions.push("Avoid taking both medicines together unless specifically advised by your doctor");
    actions.push("Do not attempt to self-manage this interaction - seek immediate medical guidance");
  } else if (severity === "medium") {
    actions.push("Take these medicines at different times as recommended by your doctor");
    actions.push("Monitor for any unusual symptoms or side effects");
    actions.push("Report any concerns to your healthcare provider");
  } else {
    actions.push("These medicines can generally be used together with minimal risk");
    actions.push("Follow your doctor's dosing instructions carefully");
  }
  
  // Add time gap recommendation
  if (timeGap && !timeGap.toLowerCase().includes("same time")) {
    actions.push(`Maintain the suggested time gap: ${timeGap}`);
  }
  
  // Add monitoring advice
  if (severity !== "low") {
    actions.push("Watch for symptoms such as nausea, dizziness, stomach pain, or unusual bleeding");
  }
  
  // Add the original recommendation if it exists
  if (recommendation && recommendation.length > 0) {
    actions.push(recommendation);
  }
  
  return actions;
}

/**
 * Generate time gap explanation with context
 */
export function generateTimeGapExplanation(
  interaction: InteractionResult
): string | null {
  const { timeGap, drugA, drugB } = interaction;
  
  if (!timeGap) {
    return null;
  }
  
  const explanations: Record<string, string> = {
    "2 hours":
      "Spacing these medicines 2 hours apart allows your body to partially absorb the first medicine before the second one begins to work.",
    "4 hours":
      "A 4-hour gap gives your body enough time to start breaking down the first medicine before the second one is absorbed, reducing the overlap of their effects.",
    "6 hours":
      "Spacing these medicines 6 hours apart (typically morning and evening) minimizes the time both medicines are active in your body at the same time.",
    "8 hours":
      "An 8-hour gap provides substantial time for the first medicine to be processed by your liver and kidneys before the second medicine enters your system.",
    "12 hours":
      "These medicines should be taken at opposite ends of the day (morning and evening) to keep them as far apart as possible in your body.",
    "morning and evening":
      "Taking one medicine in the morning and the other in the evening provides maximum separation between doses.",
    "do not take together":
      "These medicines should never be taken at the same time. Space them as far apart as possible, ideally by at least 12 hours.",
  };
  
  let explanation = explanations[timeGap.toLowerCase()];
  
  if (!explanation) {
    // Try to find a matching pattern
    if (timeGap.includes("hours")) {
      explanation = `Space these medicines by at least ${timeGap} to reduce their interaction.`;
    } else if (
      timeGap.toLowerCase().includes("avoid") ||
      timeGap.toLowerCase().includes("together")
    ) {
      explanation =
        "These medicines should not be taken at the same time. Separate them as much as possible during the day.";
    } else {
      explanation = `Follow this dosing schedule: ${timeGap}`;
    }
  }
  
  return explanation;
}

/**
 * Generate explanation for confidence score
 */
export function getConfidenceExplanation(confidence: number): string {
  if (confidence >= 90) {
    return "Very High - This interaction is well-documented in medical literature and extensively studied.";
  } else if (confidence >= 75) {
    return "High - This interaction has strong clinical evidence and is widely recognized by healthcare providers.";
  } else if (confidence >= 60) {
    return "Moderate - This interaction is documented but may have limited clinical data or rare occurrences.";
  } else if (confidence >= 45) {
    return "Fair - This interaction has some evidence but requires further clinical confirmation.";
  } else {
    return "Low - This interaction is poorly documented; consult with a healthcare provider for personalized advice.";
  }
}

/**
 * Generate explanation for dynamic risk rating
 */
export function getRiskScoreExplanation(score: number): string {
  if (score >= 8) {
    return "Very High Risk - Dangerous interaction. These medicines should not be combined without close medical supervision.";
  } else if (score >= 7) {
    return "High Risk - Significant interaction. There is a high probability of clinically significant side effects.";
  } else if (score >= 5) {
    return "Moderate Risk - Notable interaction. Monitor closely for side effects and maintain proper dosing intervals.";
  } else if (score >= 3) {
    return "Low-Moderate Risk - Mild interaction. Usually manageable with proper spacing and monitoring.";
  } else {
    return "Low Risk - Minimal interaction. These medicines are generally safe to use together, but follow medical guidance.";
  }
}

/**
 * Format alternatives with better structure
 */
export function formatAlternativesForDisplay(
  interaction: InteractionResult
): Array<{
  drugName: string;
  alternatives: Array<{ drug: string; reason: string }>;
}> {
  if (interaction.alternativesByDrug && interaction.alternativesByDrug.length > 0) {
    return interaction.alternativesByDrug;
  }
  
  if (interaction.alternatives && interaction.alternatives.length > 0) {
    // Convert simple alternatives to structured format
    return interaction.alternatives.map((alt) => ({
      drugName: alt.includes(" instead of ") ? alt.split(" instead of ")[1] : "Standard medication",
      alternatives: [
        {
          drug: alt.replace(" instead of ", ""),
          reason: "A safer alternative with fewer interaction risks",
        },
      ],
    }));
  }
  
  return [];
}

/**
 * Get severity color classes
 */
export function getSeverityColors(severity: string): {
  label: string;
  description: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
} {
  const colors: Record<
    string,
    {
      label: string;
      description: string;
      textColor: string;
      bgColor: string;
      borderColor: string;
    }
  > = {
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

  return colors[severity] || colors.low;
}
