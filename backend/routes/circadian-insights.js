import express from "express";
import CircadianProfile from "../models/CircadianProfile.js";
import {
  generateCircadianInsights,
  generateMedicationExplanation,
  findOptimalMedicationTime,
} from "../services/llmService.js";
import Medication from "../models/Medication.js";
import { generateMedicationSchedule } from "../services/medicationScheduler.js";

const router = express.Router();

// Lightweight constraint library for algorithmic fitting when DB constraints are absent.
const constraintLibrary = [
  {
    drugName: "metformin",
    foodRule: "after food",
    preferredCircadianWindow: ["morning", "evening"],
    spacingHours: 12,
    explanation: "Take after meals to improve GI tolerance and stabilize glucose through the day.",
  },
  {
    drugName: "atorvastatin",
    foodRule: "none",
    preferredCircadianWindow: ["night"],
    spacingHours: 24,
    explanation: "Night dosing aligns with nighttime cholesterol synthesis.",
  },
  {
    drugName: "lisinopril",
    foodRule: "none",
    preferredCircadianWindow: ["morning"],
    spacingHours: 24,
    explanation: "Morning dosing supports daytime blood-pressure control.",
  },
  {
    drugName: "levothyroxine",
    foodRule: "empty stomach",
    preferredCircadianWindow: ["morning"],
    spacingHours: 24,
    explanation: "Empty-stomach morning dosing improves absorption consistency.",
  },
  {
    drugName: "omeprazole",
    foodRule: "before food",
    preferredCircadianWindow: ["morning"],
    spacingHours: 24,
    explanation: "Take before breakfast to maximize proton-pump inhibition.",
  },
  {
    drugName: "amoxicillin",
    foodRule: "none",
    preferredCircadianWindow: ["morning", "afternoon", "evening"],
    spacingHours: 8,
    explanation: "Even spacing maintains therapeutic concentration and lowers resistance risk.",
  },
];

const getDoseCountFromFrequency = (frequency) => {
  if (!frequency) return 1;
  const f = String(frequency).toLowerCase();
  if (f.includes("twice")) return 2;
  if (f.includes("three")) return 3;
  if (f.includes("four")) return 4;
  return 1;
};

/**
 * POST /api/circadian-insights - Generate LLM-powered circadian insights
 * Analyzes user's daily schedule and provides personalized insights
 */
router.post("/generate-insights", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Get user's circadian profile
    const circadianProfile = await CircadianProfile.findOne({ userId });
    if (!circadianProfile) {
      return res.status(404).json({ message: "Circadian profile not found. Please create one first." });
    }

    // Generate insights using LLM
    const insights = await generateCircadianInsights(circadianProfile);

    res.json({
      message: "Circadian insights generated successfully",
      userId,
      insights,
      profile: {
        chronotype: circadianProfile.chronotype,
        timezone: circadianProfile.timezone,
        wakeTime: circadianProfile.wakeTime,
        sleepTime: circadianProfile.sleepTime,
      },
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ message: "Error generating insights", error: error.message });
  }
});

/**
 * POST /api/circadian-insights/schedule-with-llm - Generate schedule using LLM reasoning
 * Takes medications and circadian profile, uses LLM to find optimal times
 */
router.post("/schedule-with-llm", async (req, res) => {
  try {
    const { userId, medicationIds, medications: inlineMedications = [] } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Get user's circadian profile
    const circadianProfile = await CircadianProfile.findOne({ userId });
    if (!circadianProfile) {
      return res.status(404).json({ message: "Circadian profile not found" });
    }

    let medications = [];
    if (Array.isArray(medicationIds) && medicationIds.length > 0) {
      medications = await Medication.find({ _id: { $in: medicationIds } });
    } else if (Array.isArray(inlineMedications) && inlineMedications.length > 0) {
      medications = inlineMedications;
    }

    if (medications.length === 0) {
      return res.status(400).json({ message: "Provide either medicationIds or medications[]" });
    }

    // 1) Deterministic fitting: apply constraints + circadian windows + spacing.
    const algorithmResult = generateMedicationSchedule(medications, circadianProfile, constraintLibrary);

    // 2) LLM enhancement: generate explanation per scheduled dose.
    const scheduleWithExplanations = await Promise.all(
      algorithmResult.recommendedSchedule.map(async (dose) => {
        const medication = medications.find((m) =>
          String(m.name || m.drugName || "").toLowerCase() === String(dose.drugName || "").toLowerCase()
        );

        const explanation = await generateMedicationExplanation(
          {
            name: dose.drugName,
            dosage: dose.dosage,
            condition: medication?.condition || medication?.reason || "General therapy",
          },
          dose.recommendedTime,
          circadianProfile
        );

        return {
          ...dose,
          llmExplanation: explanation.explanation,
          llmBenefit: explanation.benefit,
        };
      })
    );

    // 3) Optional LLM refinement for each medicine (kept lightweight and fault-tolerant).
    const llmRefinements = await Promise.all(
      medications.map(async (m) => {
        const lowerName = String(m.name || m.drugName || "").toLowerCase();
        const constraint =
          constraintLibrary.find((c) => c.drugName.toLowerCase() === lowerName) || {
            foodRule: "none",
            preferredCircadianWindow: ["morning"],
            spacingHours: 24,
            halfLife: "unknown",
            peakAbsorption: "unknown",
            incompatibilities: [],
          };

        const llm = await findOptimalMedicationTime(
          {
            name: m.name || m.drugName,
            dosage: m.dosage,
            frequency: m.frequency,
            condition: m.condition || m.reason || "General therapy",
          },
          circadianProfile,
          {
            foodRule: constraint.foodRule,
            preferredWindow: constraint.preferredCircadianWindow,
            halfLife: constraint.halfLife || "unknown",
            peakAbsorption: constraint.peakAbsorption || "unknown",
            incompatibilities: constraint.incompatibilities || [],
            spacingHours: constraint.spacingHours || (24 / getDoseCountFromFrequency(m.frequency)),
          }
        );

        return {
          medication: m.name || m.drugName,
          llmSuggestedTimes: llm.times,
          llmRationale: llm.reasons,
          efficacyImprovement: llm.efficacyImprovement,
          circadianConsiderations: llm.circadianConsiderations,
        };
      })
    );

    res.json({
      message: "Hybrid schedule generated (constraint-fit + LLM explanations)",
      userId,
      algorithm: {
        name: "Constraint-first circadian fitting",
        notes: [
          "Food constraints mapped to meal-relative windows",
          "Preferred circadian windows used when food constraints absent",
          "Dose spacing and overlap checks applied",
        ],
      },
      schedule: {
        recommendedSchedule: scheduleWithExplanations,
        conflicts: algorithmResult.conflicts,
        optimization: algorithmResult.optimization,
      },
      llmRefinements,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error generating LLM schedule:", error);
    res.status(500).json({ message: "Error generating schedule", error: error.message });
  }
});

/**
 * GET /api/circadian-insights/user/:userId - Get latest insights for user
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const circadianProfile = await CircadianProfile.findOne({ userId });
    if (!circadianProfile) {
      return res.status(404).json({ message: "Circadian profile not found" });
    }

    const insights = await generateCircadianInsights(circadianProfile);

    res.json({
      userId,
      insights,
      profile: circadianProfile,
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ message: "Error fetching insights", error: error.message });
  }
});

/**
 * POST /api/circadian-insights/optimize-medication - Find optimal time for a single medication
 */
router.post("/optimize-medication", async (req, res) => {
  try {
    const { userId, medicationId } = req.body;

    if (!userId || !medicationId) {
      return res.status(400).json({ message: "userId and medicationId are required" });
    }

    // Get circadian profile
    const circadianProfile = await CircadianProfile.findOne({ userId });
    if (!circadianProfile) {
      return res.status(404).json({ message: "Circadian profile not found" });
    }

    // Get medication
    const medication = await Medication.findById(medicationId);
    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }

    // Use LLM to find optimal time
    const constraints = {
      foodRule: medication.foodRule || "none",
      preferredWindow: medication.preferredCircadianWindow || ["morning", "afternoon"],
      halfLife: "12-24 hours", // Default
      peakAbsorption: "1-2 hours",
      incompatibilities: medication.incompatibleDrugs || [],
      spacingHours: medication.spacingHours || 0,
    };

    const llmTiming = await findOptimalMedicationTime(
      {
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        condition: medication.reason || "General therapy",
      },
      circadianProfile,
      constraints
    );

    const suggestedTime = (llmTiming?.times && llmTiming.times[0]) || circadianProfile.wakeTime;
    const explanation = await generateMedicationExplanation(medication, suggestedTime, circadianProfile);

    res.json({
      message: "Medication optimization complete",
      medication: {
        name: medication.name,
        dosage: medication.dosage,
      },
      optimalTiming: {
        suggestedTime,
        alternativeTimes: llmTiming?.times || [],
        llmRationale: llmTiming?.reasons || [],
        ...explanation,
      },
      constraints,
    });
  } catch (error) {
    console.error("Error optimizing medication:", error);
    res.status(500).json({ message: "Error optimizing medication", error: error.message });
  }
});

export default router;
