import { generateCircadianHealthNarrative } from "./llmService.js";

const toMinutes = (hhmm = "00:00") => {
  const [h, m] = String(hhmm).split(":").map((v) => Number(v || 0));
  return ((h * 60 + m) + 1440) % 1440;
};

const diffMinutesForward = (start, end) => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return (e - s + 1440) % 1440;
};

const formatHours = (minutes) => `${(minutes / 60).toFixed(1)} hours`;
const formatMinutes = (minutes) => `${Math.round(minutes)} min`;

const isLateSleep = (sleepTime) => {
  const mins = toMinutes(sleepTime);
  return mins >= toMinutes("00:30") && mins <= toMinutes("05:00");
};

const classifySeverity = (metric, value) => {
  if (metric === "sleep_duration") {
    if (value < 6 || value > 10) return "high";
    if (value < 7 || value > 9) return "medium";
    return "low";
  }

  if (metric === "breakfast_gap") {
    if (value > 180) return "high";
    if (value > 120) return "medium";
    return "low";
  }

  if (metric === "meal_gap") {
    if (value < 180 || value > 420) return "high";
    if (value < 240 || value > 360) return "medium";
    return "low";
  }

  if (metric === "dinner_to_sleep_gap") {
    if (value < 60) return "high";
    if (value < 120) return "medium";
    return "low";
  }

  return "medium";
};

export const calculateCircadianBehavioralMetrics = (profile) => {
  const wakeTime = profile?.wake_time || profile?.wakeTime || "07:00";
  const sleepTime = profile?.sleep_time || profile?.sleepTime || "23:00";
  const breakfastTime = profile?.breakfast_time || profile?.breakfastTime || "08:00";
  const lunchTime = profile?.lunch_time || profile?.lunchTime || "13:00";
  const dinnerTime = profile?.dinner_time || profile?.dinnerTime || "20:00";

  const sleepDurationMin = diffMinutesForward(sleepTime, wakeTime);
  const breakfastGapMin = diffMinutesForward(wakeTime, breakfastTime);
  const lunchGapMin = diffMinutesForward(breakfastTime, lunchTime);
  const dinnerGapMin = diffMinutesForward(lunchTime, dinnerTime);
  const sleepFoodGapMin = diffMinutesForward(dinnerTime, sleepTime);

  return {
    wakeTime,
    sleepTime,
    breakfastTime,
    lunchTime,
    dinnerTime,
    sleepDurationMin,
    breakfastGapMin,
    lunchGapMin,
    dinnerGapMin,
    sleepFoodGapMin,
    sleepDurationHours: Number((sleepDurationMin / 60).toFixed(2)),
  };
};

export const evaluateCircadianHealthIssues = (metrics) => {
  const issues = [];
  const positives = [];

  const addPositive = (insight) => {
    positives.push({
      ...insight,
      severity: "low",
    });
  };

  if (metrics.sleepDurationHours < 6) {
    issues.push({
      type: "sleep",
      metric: "sleep_duration",
      value: formatHours(metrics.sleepDurationMin),
      message: "Sleep deprivation risk.",
      recommendation: "Aim for 7-9 hours of sleep to improve circadian stability and recovery.",
      severity: classifySeverity("sleep_duration", metrics.sleepDurationHours),
    });
  } else if (metrics.sleepDurationHours > 10) {
    issues.push({
      type: "sleep",
      metric: "sleep_duration",
      value: formatHours(metrics.sleepDurationMin),
      message: "Oversleeping detected.",
      recommendation: "Try to keep total sleep in the 7-9 hour range for better rhythm consistency.",
      severity: classifySeverity("sleep_duration", metrics.sleepDurationHours),
    });
  } else if (metrics.sleepDurationHours < 7 || metrics.sleepDurationHours > 9) {
    issues.push({
      type: "sleep",
      metric: "sleep_duration",
      value: formatHours(metrics.sleepDurationMin),
      message: "Sleep duration is outside the optimal circadian range.",
      recommendation: "Adjust bedtime or wake time gradually toward a stable 7-9 hour sleep window.",
      severity: classifySeverity("sleep_duration", metrics.sleepDurationHours),
    });
  } else {
    addPositive({
      type: "sleep",
      metric: "sleep_duration",
      value: formatHours(metrics.sleepDurationMin),
      message: "Your sleep duration is in the ideal 7-9 hour range.",
      recommendation: "Keep this duration consistent to preserve circadian stability.",
    });
  }

  if (isLateSleep(metrics.sleepTime)) {
    issues.push({
      type: "sleep",
      metric: "sleep_time",
      value: metrics.sleepTime,
      message: "Very late sleep timing detected.",
      recommendation: "Shift bedtime earlier by 15-30 minutes every few days until a consistent earlier schedule is reached.",
      severity: "medium",
    });
  } else {
    addPositive({
      type: "sleep",
      metric: "sleep_time",
      value: metrics.sleepTime,
      message: "Your sleep timing is circadian-friendly.",
      recommendation: "Maintain this bedtime pattern for stronger rhythm consistency.",
    });
  }

  if (metrics.breakfastGapMin > 120) {
    issues.push({
      type: "meal",
      metric: "breakfast_gap",
      value: formatMinutes(metrics.breakfastGapMin),
      message: "Breakfast is delayed after waking.",
      recommendation: "Try to eat within 1 hour of waking to support metabolic rhythm alignment.",
      severity: classifySeverity("breakfast_gap", metrics.breakfastGapMin),
    });
  } else if (metrics.breakfastGapMin <= 60) {
    addPositive({
      type: "meal",
      metric: "breakfast_gap",
      value: formatMinutes(metrics.breakfastGapMin),
      message: "Breakfast timing is well aligned after wake-up.",
      recommendation: "Continue eating within about an hour after waking.",
    });
  }

  if (metrics.lunchGapMin < 240 || metrics.lunchGapMin > 360) {
    issues.push({
      type: "meal",
      metric: "lunch_gap",
      value: formatMinutes(metrics.lunchGapMin),
      message: "Breakfast-to-lunch gap is outside the recommended 4-6 hour window.",
      recommendation: "Keep a more regular lunch interval to reduce circadian metabolic stress.",
      severity: classifySeverity("meal_gap", metrics.lunchGapMin),
    });
  } else {
    addPositive({
      type: "meal",
      metric: "lunch_gap",
      value: formatMinutes(metrics.lunchGapMin),
      message: "Breakfast-to-lunch spacing is in the healthy range.",
      recommendation: "Keep this 4-6 hour meal interval steady.",
    });
  }

  if (metrics.dinnerGapMin < 240 || metrics.dinnerGapMin > 360) {
    issues.push({
      type: "meal",
      metric: "dinner_gap",
      value: formatMinutes(metrics.dinnerGapMin),
      message: "Lunch-to-dinner gap is outside the recommended 4-6 hour window.",
      recommendation: "Maintain meal spacing closer to 4-6 hours for steadier circadian signaling.",
      severity: classifySeverity("meal_gap", metrics.dinnerGapMin),
    });
  } else {
    addPositive({
      type: "meal",
      metric: "dinner_gap",
      value: formatMinutes(metrics.dinnerGapMin),
      message: "Lunch-to-dinner spacing is in the healthy range.",
      recommendation: "Keep this interval stable to support metabolic rhythm.",
    });
  }

  if (metrics.sleepFoodGapMin < 120) {
    issues.push({
      type: "meal",
      metric: "dinner_to_sleep_gap",
      value: formatMinutes(metrics.sleepFoodGapMin),
      message: "Dinner is too close to bedtime.",
      recommendation: "Finish dinner at least 2 hours before sleep to support better sleep quality and glucose regulation.",
      severity: classifySeverity("dinner_to_sleep_gap", metrics.sleepFoodGapMin),
    });
  } else {
    addPositive({
      type: "meal",
      metric: "dinner_to_sleep_gap",
      value: formatMinutes(metrics.sleepFoodGapMin),
      message: "Dinner timing is appropriately separated from bedtime.",
      recommendation: "Continue finishing dinner at least 2 hours before sleep.",
    });
  }

  const irregularSignals = [
    isLateSleep(metrics.sleepTime),
    metrics.breakfastGapMin > 120,
    metrics.lunchGapMin < 240 || metrics.lunchGapMin > 360,
    metrics.dinnerGapMin < 240 || metrics.dinnerGapMin > 360,
    metrics.sleepFoodGapMin < 120,
  ].filter(Boolean).length;

  if (irregularSignals >= 2) {
    issues.push({
      type: "circadian",
      metric: "rhythm_irregularity",
      value: `${irregularSignals} irregular signals`,
      message: "Irregular circadian rhythm pattern detected.",
      recommendation: "Stabilize wake/sleep times and meal intervals daily to improve circadian alignment.",
      severity: irregularSignals >= 4 ? "high" : "medium",
    });
  } else {
    addPositive({
      type: "circadian",
      metric: "rhythm_regularity",
      value: `${irregularSignals} irregular signals`,
      message: "Your overall circadian pattern is reasonably consistent.",
      recommendation: "Keep sleep and meal timings stable across weekdays and weekends.",
    });
  }

  return [...issues, ...positives];
};

export const generateCircadianHealthInsights = async (profile, options = {}) => {
  const { useLLM = true } = options;
  const metrics = calculateCircadianBehavioralMetrics(profile);
  const deterministic = evaluateCircadianHealthIssues(metrics);

  if (!deterministic.length) {
    return {
      metrics,
      insights: [
        {
          type: "circadian",
          severity: "low",
          metric: "overall",
          value: "Within healthy ranges",
          message: "Your current schedule is broadly aligned with circadian health guidelines.",
          recommendation: "Keep your sleep and meal timing consistent day-to-day.",
        },
      ],
      llmUsed: false,
    };
  }

  if (!useLLM) {
    return { metrics, insights: deterministic, llmUsed: false };
  }

  const llmNarratives = await generateCircadianHealthNarrative(metrics, deterministic);
  if (!Array.isArray(llmNarratives) || llmNarratives.length === 0) {
    return { metrics, insights: deterministic, llmUsed: false };
  }

  const enriched = deterministic.map((insight) => {
    const llm = llmNarratives.find((x) => String(x.metric) === String(insight.metric));
    if (!llm) return insight;
    return {
      ...insight,
      message: llm.message || insight.message,
      recommendation: llm.recommendation || insight.recommendation,
      llmExplanation: llm.explanation || undefined,
    };
  });

  return { metrics, insights: enriched, llmUsed: true };
};
