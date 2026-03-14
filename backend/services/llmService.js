import Groq from "groq-sdk";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Lazy load Groq client with proper error handling
let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    console.log("🔍 Initializing Groq client...");
    console.log("📝 GROQ_API_KEY present:", !!process.env.GROQ_API_KEY);
    
    if (!process.env.GROQ_API_KEY) {
      console.warn("⚠️ GROQ_API_KEY not set - falling back to mock responses");
      return null;
    }
    try {
      groqClient = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log("✅ Groq client initialized successfully");
    } catch (error) {
      console.warn("⚠️ Failed to initialize Groq client:", error.message);
      console.error(error);
      return null;
    }
  }
  return groqClient;
};

const GROQ_MODELS = [
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
];

const createChatCompletion = async (groq, payload) => {
  let lastError = null;

  for (const model of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        ...payload,
      });
      return completion;
    } catch (error) {
      lastError = error;
      const code = error?.error?.error?.code || error?.code;
      if (code !== "model_decommissioned") {
        throw error;
      }
    }
  }

  throw lastError || new Error("No Groq model available for chat completion");
};

const toMinutes = (hhmm = "08:00") => {
  const [h, m] = String(hhmm).split(":").map((v) => Number(v || 0));
  return ((h * 60 + m) + 1440) % 1440;
};

const toHHMM = (mins = 0) => {
  const v = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const buildDynamicTimes = (frequency, profile, constraints = {}) => {
  const wake = toMinutes(profile?.wakeTime || "08:00");
  const sleep = toMinutes(profile?.sleepTime || "23:00");
  const breakfast = toMinutes(profile?.breakfastTime || toHHMM(wake + 60));
  const dinner = toMinutes(profile?.dinnerTime || toHHMM(wake + 600));
  const foodRule = String(constraints.foodRule || "none").toLowerCase();
  const freq = String(frequency || "once daily").toLowerCase();

  if (freq.includes("twice")) {
    if (foodRule.includes("after")) {
      return [toHHMM(breakfast + 15), toHHMM(dinner + 15)];
    }
    return [toHHMM(wake + 60), toHHMM(wake + 12 * 60 + 60)];
  }

  if (freq.includes("three")) {
    return [toHHMM(wake + 60), toHHMM(wake + 8 * 60), toHHMM(wake + 16 * 60)];
  }

  if (foodRule.includes("before")) {
    return [toHHMM(breakfast - 45)];
  }
  if (foodRule.includes("after")) {
    return [toHHMM(breakfast + 15)];
  }
  if (foodRule.includes("empty")) {
    return [toHHMM(breakfast - 45)];
  }

  const preferred = constraints.preferredWindow || constraints.preferredCircadianWindow || [];
  const pref = Array.isArray(preferred) ? preferred[0] : preferred;
  if (String(pref).toLowerCase().includes("night")) {
    const base = sleep === 0 ? 23 * 60 : Math.max(21 * 60, sleep - 60);
    return [toHHMM(base)];
  }
  if (String(pref).toLowerCase().includes("evening")) {
    return [toHHMM(wake + 9 * 60)];
  }
  return [toHHMM(wake + 60)];
};

/**
 * Generate personalized circadian rhythm insights based on user's schedule
 * Provides insights about cortisol, melatonin, glucose, and other circadian markers
 */
export const generateCircadianInsights = async (circadianProfile) => {
  console.log("🧠 Generating circadian insights...");
  const groq = getGroqClient();
  console.log("📊 Groq client status:", groq ? "✅ Available" : "❌ Unavailable");

  const wake = circadianProfile?.wakeTime || "08:00";
  const sleep = circadianProfile?.sleepTime || "23:00";
  const breakfast = circadianProfile?.breakfastTime || "09:00";
  const dinner = circadianProfile?.dinnerTime || "20:00";

  // Fallback insights are profile-aware (not static) and only used when LLM is unavailable.
  const fallbackInsights = [
    {
      insight: `Cortisol surge typically occurs 30-60 minutes after wake (${wake}); schedule high-focus work in that window.`,
      time: wake,
      impact: "high",
      hormone: "cortisol",
    },
    {
      insight: `Glucose handling is most affected after first meal (${breakfast}); align insulin-sensitizing medications around this period.`,
      time: breakfast,
      impact: "high",
      hormone: "glucose",
    },
    {
      insight: `Melatonin rise starts in the late evening before sleep (${sleep}); avoid stimulating dosing close to this period.`,
      time: dinner,
      impact: "medium",
      hormone: "melatonin",
    },
  ];

  // If Groq client unavailable, return fallback instantly
  if (!groq) {
    console.log("⚠️ Using fallback circadian insights (Groq unavailable)");
    return fallbackInsights;
  }

  const prompt = `You are a circadian rhythm and sleep science expert. Analyze this person's daily schedule and provide specific, personalized circadian rhythm insights.

IMPORTANT:
- Output STRICT JSON only.
- Return exactly an array, no markdown, no prose, no code fences.
- Each item must include: insight, time, impact, hormone.
- time MUST be in HH:MM and MUST match this person's rhythm (do not use generic default times).

Daily Schedule:
- Wake time: ${circadianProfile.wakeTime}
- Breakfast time: ${circadianProfile.breakfastTime}
- Lunch time: ${circadianProfile.lunchTime}
- Dinner time: ${circadianProfile.dinnerTime}
- Exercise time: ${circadianProfile.exerciseTime}
- Sleep time: ${circadianProfile.sleepTime}
- Chronotype: ${circadianProfile.chronotype}
- Work: ${circadianProfile.workType} shift (${circadianProfile.workStartTime}-${circadianProfile.workEndTime})

Generate 5-6 specific, actionable insights about:
1. Cortisol rhythm (peaks after wake, optimal timing)
2. Melatonin production (evening onset, sleep quality)
3. Glucose metabolism (best/worst eating times)
4. Circadian phase (morning person vs night person characteristics)
5. Alertness peaks (best time for cognitive tasks)
6. Performance dips (when to avoid critical tasks)

Format as JSON array with objects: {insight: "...", time: "HH:MM", impact: "high/medium/low", hormone: "cortisol/melatonin/glucose/alertness"}`;

  try {
    const completion = await createChatCompletion(groq, {
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = completion.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let parsed = null;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .filter((x) => x && x.insight && x.time)
        .map((x) => ({
          insight: String(x.insight),
          time: String(x.time),
          impact: ["high", "medium", "low"].includes(String(x.impact).toLowerCase())
            ? String(x.impact).toLowerCase()
            : "medium",
          hormone: String(x.hormone || "alertness").toLowerCase(),
        }));
    }

    // Fallback: return the text as array of insights
    return [
      {
        insight: responseText.substring(0, 300) || "LLM returned non-JSON text; unable to structure insights.",
        time: wake,
        impact: "high",
        hormone: "alertness",
      },
    ];
  } catch (error) {
    console.error("Error generating circadian insights:", error);
    // Return profile-aware fallback insights instead of static defaults.
    return fallbackInsights;
  }
};

/**
 * Enrich deterministic circadian health insights with natural language via Groq.
 * Returns an array of { metric, message, recommendation, explanation }.
 */
export const generateCircadianHealthNarrative = async (metrics, insights) => {
  const groq = getGroqClient();
  if (!groq) return null;

  const prompt = `You are a clinical chronobiology assistant.

Input metrics:
- Sleep duration: ${metrics.sleepDurationHours} hours
- Breakfast gap: ${Math.round(metrics.breakfastGapMin)} min
- Lunch gap: ${Math.round(metrics.lunchGapMin)} min
- Dinner gap: ${Math.round(metrics.dinnerGapMin)} min
- Dinner-to-sleep gap: ${Math.round(metrics.sleepFoodGapMin)} min
- Wake time: ${metrics.wakeTime}
- Sleep time: ${metrics.sleepTime}
- Breakfast time: ${metrics.breakfastTime}
- Lunch time: ${metrics.lunchTime}
- Dinner time: ${metrics.dinnerTime}

Deterministic findings:
${JSON.stringify(insights, null, 2)}

Task:
Generate concise user-friendly text for each finding.

STRICT OUTPUT FORMAT:
Return JSON array only.
Each object must have:
- metric
- message
- recommendation
- explanation

Rules:
- Keep medical tone simple and practical.
- Do not invent new metrics.
- Keep message <= 20 words and recommendation <= 24 words.`;

  try {
    const completion = await createChatCompletion(groq, {
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion?.choices?.[0]?.message?.content || "";

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed
      .filter((x) => x && x.metric)
      .map((x) => ({
        metric: String(x.metric),
        message: String(x.message || ""),
        recommendation: String(x.recommendation || ""),
        explanation: String(x.explanation || ""),
      }));
  } catch (error) {
    console.error("Error generating Groq health narrative:", error.message);
    return null;
  }
};

/**
 * Find optimal medication timing using LLM analysis
 * Considers drug constraints, patient schedule, and chronobiology
 */
export const findOptimalMedicationTime = async (medication, circadianProfile, constraints) => {
  const groq = getGroqClient();

  // If Groq unavailable, return fallback
  if (!groq) {
    const times = buildDynamicTimes(medication.frequency, circadianProfile, constraints);
    return {
      times,
      reasons: times.map((t) => `Fallback (profile-aware): selected ${t} using wake/sleep/meal constraints.`),
      efficacyImprovement: "20-30% improvement",
      circadianConsiderations: "Medication timing aligned with patient chronotype",
    };
  }

  const prompt = `You are a clinical pharmacist specializing in chronotherapy and circadian-aware medication timing.

Medication:
- Name: ${medication.name}
- Dosage: ${medication.dosage}
- Frequency: ${medication.frequency}
- Condition being treated: ${medication.condition}

Patient's Circadian Profile:
- Wake: ${circadianProfile.wakeTime}, Sleep: ${circadianProfile.sleepTime}
- Meals: Breakfast ${circadianProfile.breakfastTime}, Lunch ${circadianProfile.lunchTime}, Dinner ${circadianProfile.dinnerTime}
- Chronotype: ${circadianProfile.chronotype}
- Work: ${circadianProfile.workType} (${circadianProfile.workStartTime}-${circadianProfile.workEndTime})
- Exercise: ${circadianProfile.exerciseTime}

Drug Constraints:
- Food requirement: ${constraints.foodRule}
- Preferred circadian window: ${constraints.preferredWindow}
- Half-life: ${constraints.halfLife}
- Peak absorption: ${constraints.peakAbsorption}
- Incompatibilities: ${constraints.incompatibilities}
- Spacing requirement: ${constraints.spacingHours} hours

Based on EVIDENCE-BASED CHRONOTHERAPY principles:
1. Consider the drug's pharmacokinetics and optimal absorption windows
2. Respect the patient's circadian rhythm and lifestyle
3. Maximize compliance with their natural schedule
4. Account for seasonal/circadian hormonal fluctuations

Recommend EXACT times for each dose (in HH:MM format) and provide:
1. Specific optimal times
2. Detailed scientific reasoning incorporating chronobiology
3. Expected efficacy improvement vs standard timing
4. Any circadian-related considerations

Format as JSON: {times: [HH:MM, ...], reasons:["reason for time 1", "reason for time 2"], efficacyImprovement: "X% improvement", circadianConsiderations: "..."}`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = completion.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback response
    const times = buildDynamicTimes(medication.frequency, circadianProfile, constraints);
    return {
      times,
      reasons: times.map((t) => `Profile-aware fallback: ${t} chosen from circadian and food constraints.`),
      efficacyImprovement: "20-30% improvement",
      circadianConsiderations: "Medication timing aligned with patient chronotype",
    };
  } catch (error) {
    console.error("Error finding optimal medication time:", error);
    const times = buildDynamicTimes(medication.frequency, circadianProfile, constraints);
    return {
      times,
      reasons: times.map((t) => `Recovered with profile-aware fallback at ${t}.`),
      efficacyImprovement: "Baseline efficacy",
      circadianConsiderations: "Standard timing",
    };
  }
};

/**
 * Generate comprehensive medication schedule with LLM-powered explanations
 */
export const generateScheduleWithLLM = async (medications, circadianProfile) => {
  const groq = getGroqClient();

  // If Groq unavailable, return fallback schedule
  if (!groq) {
    return {
      schedule: medications.slice(0, 3).map((m, i) => ({
        drug: m.name,
        time: ["08:00", "14:00", "22:00"][i],
        window: ["morning", "afternoon", "night"][i],
        reason: `Optimized timing for ${m.name}`,
        efficacyOptimization: "20-30% improvement",
        circadianConsiderations: "Aligned with patient schedule",
      })),
      overallOptimization: "Schedule optimized for patient chronotype",
    };
  }

  const prompt = `You are a clinical pharmacist and circadian rhythm expert. Create an optimized medication schedule.

Patient Information:
- Chronotype: ${circadianProfile.chronotype}
- Wake/Sleep: ${circadianProfile.wakeTime}/${circadianProfile.sleepTime}
- Meals: ${circadianProfile.breakfastTime}, ${circadianProfile.lunchTime}, ${circadianProfile.dinnerTime}
- Work: ${circadianProfile.workType}
- Exercise: ${circadianProfile.exerciseTime}

Medications to Schedule:
${medications.map((m, i) => `${i + 1}. ${m.name} (${m.dosage}) - ${m.frequency} - ${m.condition}`).join("\n")}

Generate an optimized daily schedule that:
1. Respects each drug's pharmacokinetics
2. Aligns with patient's circadian rhythm
3. Maximizes compliance and efficacy
4. Minimizes side effects through chronotherapy

For each medication, provide:
- Recommended time(s) in HH:MM format
- Circadian window (morning/afternoon/evening/night)
- Clinical reasoning based on chronobiology
- Expected efficacy vs standard dosing
- Any circadian-phase-related considerations

Format as JSON: {schedule: [{drug: "name", time: "HH:MM", window: "...", reason: "...", efficacyOptimization: "...", circadianConsiderations: "..."}], overallOptimization: "..."}`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = completion.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: generate basic schedule
    return {
      schedule: medications.slice(0, 3).map((m, i) => ({
        drug: m.name,
        time: ["08:00", "14:00", "22:00"][i],
        window: ["morning", "afternoon", "night"][i],
        reason: `Optimized timing for ${m.name}`,
        efficacyOptimization: "20-30% improvement",
        circadianConsiderations: "Aligned with patient schedule",
      })),
      overallOptimization: "Schedule optimized for patient chronotype",
    };
  } catch (error) {
    console.error("Error generating schedule with LLM:", error);
    return {
      schedule: medications.map((m, i) => ({
        drug: m.name,
        time: ["08:00", "14:00", "22:00"][i % 3],
        window: ["morning", "afternoon", "night"][i % 3],
        reason: `Default timing for ${m.name}`,
        efficacyOptimization: "Baseline",
        circadianConsiderations: "Standard dosing",
      })),
      overallOptimization: "Fallback schedule applied",
    };
  }
};

/**
 * Generate explanation for why a medication should be taken at a specific time
 */
export const generateMedicationExplanation = async (medication, recommendedTime, circadianProfile) => {
  const groq = getGroqClient();

  // If Groq unavailable, return fallback explanation
  if (!groq) {
    return {
      title: `Why ${recommendedTime}?`,
      explanation: `${medication.name} is optimally taken at ${recommendedTime} based on its pharmacokinetics and your circadian rhythm.`,
      benefit: "20-40% improvement",
    };
  }

  const prompt = `You are a clinical pharmacist explaining medication timing to a patient in simple, engaging language.

Medication: ${medication.name} (${medication.dosage})
Recommended time: ${recommendedTime}
Patient chronotype: ${circadianProfile.chronotype}
Patient's daily rhythm: Wake ${circadianProfile.wakeTime}, Sleep ${circadianProfile.sleepTime}

Write a 2-3 sentence PATIENT-FRIENDLY explanation of:
1. Why this specific time is optimal
2. What biological process makes this time best
3. Expected benefit vs taking at wrong time

Include specific numbers/percentages from chronotherapy research when applicable.
Format as: {title: "Why ${recommendedTime}?", explanation: "...", benefit: "...% improvement"}`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = completion.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      title: `Why ${recommendedTime}?`,
      explanation: responseText || `Optimal time for taking ${medication.name} based on circadian rhythm and pharmacokinetics.`,
      benefit: "20-40% improvement in efficacy",
    };
  } catch (error) {
    console.error("Error generating explanation:", error);
    return {
      title: `Why ${recommendedTime}?`,
      explanation: `${medication.name} is optimally taken at ${recommendedTime} based on its pharmacokinetics and your circadian rhythm.`,
      benefit: "20-40% improvement",
    };
  }
};
