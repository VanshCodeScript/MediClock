// Chronobiology-Aware Medication Scheduling Algorithm

/**
 * Convert HH:MM to minutes since midnight
 */
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to HH:MM
 */
export const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Check if a time is within a window
 */
export const isTimeInWindow = (time, windowStart, windowEnd) => {
  const timeMin = timeToMinutes(time);
  const startMin = timeToMinutes(windowStart);
  const endMin = timeToMinutes(windowEnd);

  if (startMin <= endMin) {
    return timeMin >= startMin && timeMin <= endMin;
  } else {
    // Window wraps around midnight
    return timeMin >= startMin || timeMin <= endMin;
  }
};

/**
 * Get the circadian window for a time
 */
export const getCircadianWindow = (time, wakeTime, sleepTime) => {
  const timeMin = timeToMinutes(time);
  const wakeMin = timeToMinutes(wakeTime);
  const sleepMin = timeToMinutes(sleepTime);

  // Check morning (wake to 12 PM)
  if (isTimeInWindow(time, wakeTime, '12:00')) {
    return 'morning';
  }
  // Check afternoon (12 PM to 5 PM)
  if (isTimeInWindow(time, '12:00', '17:00')) {
    return 'afternoon';
  }
  // Check evening (5 PM to 9 PM)
  if (isTimeInWindow(time, '17:00', '21:00')) {
    return 'evening';
  }
  // Night (9 PM to wake time)
  return 'night';
};

/**
 * Calculate allowed time windows for a drug based on constraints
 */
export const calculateDrugWindow = (drug, circadianProfile) => {
  const { wakeTime, sleepTime, breakfastTime, lunchTime, dinnerTime } = circadianProfile;
  const normalizedDrug = {
    foodRule: drug?.foodRule || 'none',
    preferredCircadianWindow: Array.isArray(drug?.preferredCircadianWindow)
      ? drug.preferredCircadianWindow
      : [],
    foodBuffer: drug?.foodBuffer || 15,
    explanation: drug?.explanation || 'Scheduled using baseline circadian rules.',
  };
  const windows = [];

  // Handle food constraints
  if (normalizedDrug.foodRule === 'after food') {
    // After breakfast
    const breakfastEnd = minutesToTime(timeToMinutes(breakfastTime) + normalizedDrug.foodBuffer);
    windows.push({ start: breakfastEnd, end: minutesToTime(timeToMinutes(breakfastTime) + 60) });

    // After lunch
    const lunchEnd = minutesToTime(timeToMinutes(lunchTime) + normalizedDrug.foodBuffer);
    windows.push({ start: lunchEnd, end: minutesToTime(timeToMinutes(lunchTime) + 60) });

    // After dinner
    const dinnerEnd = minutesToTime(timeToMinutes(dinnerTime) + normalizedDrug.foodBuffer);
    windows.push({ start: dinnerEnd, end: minutesToTime(timeToMinutes(dinnerTime) + 120) });
  } else if (normalizedDrug.foodRule === 'before food') {
    // Before breakfast
    const breakfastStart = breakfastTime;
    const windowStart = minutesToTime(timeToMinutes(wakeTime) + 30);
    windows.push({ start: windowStart, end: minutesToTime(timeToMinutes(breakfastStart) - 15) });

    // Before lunch
    windows.push({ start: '10:30', end: minutesToTime(timeToMinutes(lunchTime) - 15) });

    // Before dinner
    windows.push({ start: '17:00', end: minutesToTime(timeToMinutes(dinnerTime) - 15) });
  } else if (normalizedDrug.foodRule === 'with food') {
    // During meals
    windows.push({ start: minutesToTime(timeToMinutes(breakfastTime) - 15), end: minutesToTime(timeToMinutes(breakfastTime) + 45) });
    windows.push({ start: minutesToTime(timeToMinutes(lunchTime) - 15), end: minutesToTime(timeToMinutes(lunchTime) + 45) });
    windows.push({ start: minutesToTime(timeToMinutes(dinnerTime) - 15), end: minutesToTime(timeToMinutes(dinnerTime) + 45) });
  } else if (normalizedDrug.foodRule === 'empty stomach') {
    // Away from meals
    windows.push({ start: wakeTime, end: minutesToTime(timeToMinutes(breakfastTime) - 30) });
    windows.push({ start: minutesToTime(timeToMinutes(breakfastTime) + 60), end: minutesToTime(timeToMinutes(lunchTime) - 30) });
    windows.push({ start: minutesToTime(timeToMinutes(lunchTime) + 60), end: minutesToTime(timeToMinutes(dinnerTime) - 30) });
  } else {
    // No food constraint - use preferred circadian window
    if (normalizedDrug.preferredCircadianWindow.includes('morning')) {
      windows.push({ start: wakeTime, end: '12:00' });
    }
    if (normalizedDrug.preferredCircadianWindow.includes('afternoon')) {
      windows.push({ start: '12:00', end: '17:00' });
    }
    if (normalizedDrug.preferredCircadianWindow.includes('evening')) {
      windows.push({ start: '17:00', end: '21:00' });
    }
    if (normalizedDrug.preferredCircadianWindow.includes('night')) {
      windows.push({ start: '21:00', end: sleepTime });
    }

    // If no preferred windows are defined, allow broad active-day window.
    if (windows.length === 0) {
      windows.push({ start: wakeTime, end: sleepTime });
    }
  }

  return windows;
};

/**
 * Find the optimal time within a window
 */
export const findOptimalTime = (window, circadianProfile, preferredCircadianWindow) => {
  const startMin = timeToMinutes(window.start);
  const endMin = timeToMinutes(window.end);
  const midPoint = Math.floor((startMin + endMin) / 2);

  // Try to place it in the middle of the preferred window
  if (preferredCircadianWindow === 'morning' && isTimeInWindow(minutesToTime(midPoint), '06:00', '12:00')) {
    return minutesToTime(midPoint);
  }
  if (preferredCircadianWindow === 'evening' && isTimeInWindow(minutesToTime(midPoint), '17:00', '21:00')) {
    return minutesToTime(midPoint);
  }
  if (preferredCircadianWindow === 'night' && isTimeInWindow(minutesToTime(midPoint), '21:00', '23:59')) {
    return minutesToTime(midPoint);
  }

  // Otherwise, return the start of the window
  return window.start;
};

/**
 * Main scheduling algorithm
 */
export const generateMedicationSchedule = (medications, circadianProfile, drugDatabase = []) => {
  const schedule = [];
  const conflicts = [];
  const usedTimes = new Map(); // Track used times to avoid overlaps
  const medDoseTimes = new Map(); // Track dose times per medication to enforce spacing

  const normalizeFoodRule = (value) => {
    const v = String(value || '').toLowerCase();
    if (v.includes('empty')) return 'empty stomach';
    if (v.includes('before')) return 'before food';
    if (v.includes('after')) return 'after food';
    if (v.includes('with')) return 'with food';
    if (v === 'none' || v.includes('no food')) return 'none';
    return undefined;
  };

  const getDoseCountFromFrequency = (frequency) => {
    const f = String(frequency || '').toLowerCase();
    if (f.includes('once')) return 1;
    if (f.includes('twice') || f.includes('2')) return 2;
    if (f.includes('three') || f.includes('thrice') || f.includes('3')) return 3;
    return 1;
  };

  const hasGlobalConflict = (candidateTime, minimumMinutes = 30) => {
    for (const [existingTime] of usedTimes.entries()) {
      const diff = Math.abs(timeToMinutes(candidateTime) - timeToMinutes(existingTime));
      if (diff < minimumMinutes) return true;
    }
    return false;
  };

  const hasSameMedicationSpacingConflict = (medName, candidateTime, minSpacingMinutes) => {
    if (!medDoseTimes.has(medName)) return false;
    const existingTimes = medDoseTimes.get(medName);
    for (const t of existingTimes) {
      const diff = Math.abs(timeToMinutes(candidateTime) - timeToMinutes(t));
      if (diff < minSpacingMinutes) return true;
    }
    return false;
  };

  const buildWindowCandidates = (window, stepMinutes = 30) => {
    const start = timeToMinutes(window.start);
    const end = timeToMinutes(window.end);
    const candidates = [];

    // Same instant window
    if (start === end) {
      return [minutesToTime(start)];
    }

    if (start < end) {
      for (let m = start; m <= end; m += stepMinutes) {
        candidates.push(minutesToTime(m));
      }
      return candidates;
    }

    // Wrap-around window (e.g., 21:00 -> 06:00)
    for (let m = start; m < 24 * 60; m += stepMinutes) {
      candidates.push(minutesToTime(m));
    }
    for (let m = 0; m <= end; m += stepMinutes) {
      candidates.push(minutesToTime(m));
    }
    return candidates;
  };

  const pickCandidateInWindow = (
    window,
    medKey,
    minSameMedSpacing,
    preferredWindow,
    stepMinutes = 30
  ) => {
    const preferred = findOptimalTime(window, circadianProfile, preferredWindow);
    const candidates = buildWindowCandidates(window, stepMinutes);

    // Prioritize the optimal candidate first, then the remaining candidates in order.
    const ordered = [preferred, ...candidates.filter((t) => t !== preferred)];

    for (const candidateTime of ordered) {
      if (
        !hasGlobalConflict(candidateTime, 30) &&
        !hasSameMedicationSpacingConflict(medKey, candidateTime, minSameMedSpacing)
      ) {
        return candidateTime;
      }
    }

    return null;
  };

  // Enhance medications with constraint data
  const enhancedMeds = medications.map((med) => {
    const constraint = drugDatabase.find((d) => d.drugName.toLowerCase() === med.name.toLowerCase());
    const inferredFoodRule =
      normalizeFoodRule(med.foodRule) ||
      normalizeFoodRule(med.meal) ||
      normalizeFoodRule(med.reason);

    const baseConstraint =
      constraint || {
        drugName: med.name,
        foodRule: 'none',
        preferredCircadianWindow: ['morning'],
        explanation: 'No specific drug constraints found; using generalized circadian fitting.',
      };

    return {
      ...med,
      constraint: {
        ...baseConstraint,
        foodRule: inferredFoodRule || baseConstraint.foodRule || 'none',
      },
    };
  });

  // Process each medication
  for (const med of enhancedMeds) {
    const constraint = med.constraint;
    const windows = calculateDrugWindow(constraint, circadianProfile);

    if (windows.length === 0) {
      // No specific constraint, use preferred window
      const preferredWindow = constraint.preferredCircadianWindow?.[0] || 'morning';
      const time = findOptimalTime(
        { start: '08:00', end: '22:00' },
        circadianProfile,
        preferredWindow
      );
      schedule.push({
        drugName: med.name,
        dosage: med.dosage,
        recommendedTime: time,
        frequency: med.frequency,
        reason: `No specific food constraint. ${constraint.explanation || 'Standard recommendation.'}`,
        circadianWindow: getCircadianWindow(time, circadianProfile.wakeTime, circadianProfile.sleepTime),
        mealRelation: 'none',
      });
      continue;
    }

    // Find the best window considering frequency
    const frequency = med.frequency || 'once daily';
    const numDoses = getDoseCountFromFrequency(frequency);
    const timeBetweenDoses = Math.floor((24 * 60) / numDoses);
    const medKey = String(med.name || '').toLowerCase();
    if (!medDoseTimes.has(medKey)) medDoseTimes.set(medKey, []);

    for (let dose = 0; dose < numDoses; dose++) {
      let bestTime = null;
      // Use a practical minimum spacing so constrained windows (e.g., empty stomach)
      // still allow all required daily doses to be scheduled.
      const minSameMedSpacing = numDoses > 1 ? Math.max(120, Math.floor(timeBetweenDoses * 0.5)) : 0;

      // Find a viable slot inside each window instead of testing only one timestamp.
      for (const window of windows) {
        const candidateTime = pickCandidateInWindow(
          window,
          medKey,
          minSameMedSpacing,
          constraint.preferredCircadianWindow?.[0],
          30
        );

        if (candidateTime) {
          bestTime = candidateTime;
          break;
        }
      }

      // Fallback: scan the full day in 30-minute increments to avoid dropping meds.
      if (!bestTime) {
        const medTimes = medDoseTimes.get(medKey);
        let candidateMin = timeToMinutes(circadianProfile.wakeTime);
        if (medTimes.length > 0) {
          candidateMin = timeToMinutes(medTimes[medTimes.length - 1]) + timeBetweenDoses;
        }
        candidateMin = ((candidateMin % (24 * 60)) + (24 * 60)) % (24 * 60);

        for (let step = 0; step < 48; step++) {
          const candidateTime = minutesToTime((candidateMin + step * 30) % (24 * 60));
          if (
            !hasGlobalConflict(candidateTime, 30) &&
            !hasSameMedicationSpacingConflict(medKey, candidateTime, minSameMedSpacing)
          ) {
            bestTime = candidateTime;
            break;
          }
        }
      }

      if (bestTime) {
        usedTimes.set(bestTime, med.name);
        medDoseTimes.get(medKey).push(bestTime);
        schedule.push({
          drugName: med.name,
          dosage: med.dosage,
          recommendedTime: bestTime,
          frequency: frequency,
          reason: constraint.explanation || 'Optimal timing based on circadian rhythm.',
          circadianWindow: getCircadianWindow(bestTime, circadianProfile.wakeTime, circadianProfile.sleepTime),
          mealRelation: constraint.foodRule || 'none',
        });
      }
    }
  }

  // Sort by time
  schedule.sort((a, b) => timeToMinutes(a.recommendedTime) - timeToMinutes(b.recommendedTime));

  // Calculate optimization score
  const optimizationScore = Math.min(100, Math.round((schedule.length / enhancedMeds.length) * 100));

  return {
    recommendedSchedule: schedule,
    conflicts: conflicts,
    optimization: {
      score: optimizationScore,
      notes: `Successfully scheduled ${schedule.length}/${enhancedMeds.length} medications.`,
    },
  };
};

export default {
  timeToMinutes,
  minutesToTime,
  getCircadianWindow,
  calculateDrugWindow,
  findOptimalTime,
  generateMedicationSchedule,
};
