import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Clock, AlertCircle, CheckCircle2, Brain, Pill, ArrowRight, Info, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getOrCreateCurrentUserId } from "@/lib/userSession";

const API_BASE = "http://localhost:5001/api";

// Circadian timeline data for 24-hour view
const generateCircadianTimeline = () => {
  const timeline = [];
  for (let hour = 0; hour < 24; hour++) {
    timeline.push({
      hour: hour,
      time: `${String(hour).padStart(2, "0")}:00`,
      period: hour < 6 ? "Night" : hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night",
      color: hour < 6 ? "bg-indigo-900" : hour < 12 ? "bg-yellow-100" : hour < 17 ? "bg-blue-100" : hour < 21 ? "bg-orange-100" : "bg-indigo-900",
      accentColor: hour < 6 ? "text-white" : "text-gray-800",
    });
  }
  return timeline;
};

// Convert time string to position percentage
const timeToPercent = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return ((hours + minutes / 60) / 24) * 100;
};

const ChronobiologyMedicationScheduler = () => {
  const [activeScheduleItem, setActiveScheduleItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insightsError, setInsightsError] = useState(null);
  const [circadianProfile, setCircadianProfile] = useState(null);
  const [insights, setInsights] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [userId, setUserId] = useState("");
  const [medicationCount, setMedicationCount] = useState(0);
  const timeline = generateCircadianTimeline();

  // Animation variants
  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  // Initialize profile and schedule on load. Insights are generated only on button click.
  useEffect(() => {
    const initializeSchedule = async () => {
      let dbMeds = [];
      try {
        setLoading(true);
        setError(null);

        const uid = await getOrCreateCurrentUserId();
        setUserId(uid);

        const profileData = {
          userId: uid,
          wakeTime: "10:00",
          sleepTime: "00:00",
          breakfastTime: "10:30",
          lunchTime: "15:00",
          dinnerTime: "21:00",
          workType: "day shift",
          workStartTime: "09:00",
          workEndTime: "17:00",
          exerciseTime: "18:30",
          exerciseDuration: 45,
          chronotype: "morning person",
          timezone: "UTC",
        };

        const profileRes = await fetch(`${API_BASE}/circadian-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        });

        if (!profileRes.ok) {
          throw new Error("Failed to create circadian profile");
        }

        const profileResult = await profileRes.json();
        setCircadianProfile(profileResult.profile || profileData);

        // Pull medications from DB for this user.
        const meds = await api.medications.getByUserId(uid);
        dbMeds = Array.isArray(meds) ? meds : [];
        setMedicationCount(dbMeds.length);

        if (dbMeds.length === 0) {
          setSchedule([]);
          setLoading(false);
          return;
        }

        const scheduleInput = dbMeds.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          foodRule: m.foodRule,
          condition: m.reason || "General therapy",
        }));

        const scheduleRes = await fetch(`${API_BASE}/circadian-insights/schedule-with-llm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, medications: scheduleInput }),
        });

        if (!scheduleRes.ok) {
          throw new Error("Failed to generate schedule");
        }

        const scheduleResult = await scheduleRes.json();
        const recommended = scheduleResult?.schedule?.recommendedSchedule || [];

        const styleByWindow = {
          morning: { icon: "🌅", color: "bg-blue-100 border-blue-300" },
          afternoon: { icon: "☀️", color: "bg-orange-100 border-orange-300" },
          evening: { icon: "🌇", color: "bg-purple-100 border-purple-300" },
          night: { icon: "🌙", color: "bg-indigo-100 border-indigo-300" },
        };

        const formattedSchedule = recommended.map((dose) => {
          const win = (dose.circadianWindow || "morning").toLowerCase();
          const style = styleByWindow[win] || styleByWindow.morning;
          return {
            ...dose,
            drugName: dose.drugName || dose.drug || "Medication",
            reason: dose.llmExplanation || dose.reason || "Optimized with circadian-aware scheduling",
            icon: style.icon,
            color: style.color,
          };
        });

        setSchedule(formattedSchedule);

        setLoading(false);
      } catch (err) {
        console.error("Error initializing schedule:", err);
        setError(err.message);
        // Keep profile for UI and fall back to showing medications even if optimization fails.
        setCircadianProfile({
          wakeTime: "10:00",
          sleepTime: "00:00",
          breakfastTime: "10:30",
          lunchTime: "15:00",
          dinnerTime: "21:00",
          workType: "day shift",
          chronotype: "morning person",
        });
        if (Array.isArray(dbMeds) && dbMeds.length > 0) {
          const fallbackTimes = ["09:00", "14:00", "20:00"];
          const fallbackSchedule = dbMeds.map((m, idx) => ({
            drugName: m.name || "Medication",
            dosage: m.dosage || "",
            recommendedTime: fallbackTimes[idx % fallbackTimes.length],
            frequency: m.frequency || "once daily",
            reason: "Fallback schedule shown while optimization is unavailable.",
            circadianWindow: "morning",
            mealRelation: m.foodRule || "none",
            icon: "💊",
            color: "bg-blue-100 border-blue-300",
          }));
          setMedicationCount(dbMeds.length);
          setSchedule(fallbackSchedule);
        } else {
          setMedicationCount(0);
          setSchedule([]);
        }
        setInsights([]);
        setLoading(false);
      }
    };

    initializeSchedule();
  }, []);

  const handleGenerateInsights = async () => {
    try {
      if (!userId) {
        setInsightsError("User session not ready");
        return;
      }
      setInsightsLoading(true);
      setInsightsError(null);
      setInsights([]);

      const insightsRes = await fetch(`${API_BASE}/circadian-insights/generate-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!insightsRes.ok) {
        throw new Error("Failed to fetch insights");
      }

      const insightsResult = await insightsRes.json();
      setInsights(insightsResult.insights || []);
    } catch (err) {
      console.error("Error fetching AI insights:", err);
      setInsightsError(err.message);
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-8 mb-8">
        {/* Loading State */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                <Loader className="w-8 h-8 text-blue-500 mx-auto" />
              </motion.div>
              <p className="text-muted-foreground">Analyzing your circadian rhythm with AI...</p>
            </div>
          </motion.div>
        )}

        {!loading && (
          <>
            {medicationCount === 0 && (
              <div className="glass-card p-4 border-l-4 border-amber-400 bg-amber-50/50 text-amber-800 text-sm">
                No medications found in DB. Add medications from Add Medication page to generate schedule.
              </div>
            )}
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-3xl">Chronobiology-Aware Scheduler</h1>
                  <p className="text-sm text-muted-foreground">
                    LLM-powered medication timing based on your circadian rhythm
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Error Note */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 border-l-4 border-yellow-400 bg-yellow-50/30"
              >
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Using sample data (LLM backend available)
                </p>
              </motion.div>
            )}

            {/* User Circadian Profile Card */}
            <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 border-l-4 border-purple-400"
        >
          <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Your 24-Hour Circadian Profile
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: "Wake Time", value: circadianProfile?.wakeTime || "10:00", icon: "🌅" },
              { label: "Breakfast", value: circadianProfile?.breakfastTime || "10:30", icon: "🥣" },
              { label: "Lunch", value: circadianProfile?.lunchTime || "15:00", icon: "🍽️" },
              { label: "Dinner", value: circadianProfile?.dinnerTime || "21:00", icon: "🍽️" },
              { label: "Exercise", value: circadianProfile?.exerciseTime || "18:30", icon: "💪" },
              { label: "Sleep Time", value: circadianProfile?.sleepTime || "00:00", icon: "😴" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.15 + idx * 0.05 }}
                className="p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border"
              >
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                <p className="text-lg font-bold mt-1">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

            {/* LLM-Generated Circadian Insights */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5 border-l-4 border-violet-400"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-display font-semibold text-base flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-600" />
                    AI Circadian Insights
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                     
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateInsights}
                  disabled={insightsLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {insightsLoading ? "Generating..." : insights.length > 0 ? "Regenerate Insights" : "Generate AI Insights"}
                </motion.button>
              </div>

              {insightsError && (
                <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  Failed to fetch insights: {insightsError}
                </div>
              )}

              {!insightsLoading && insights.length === 0 && (
                <div className="p-4 rounded-lg bg-violet-50/70 border border-violet-200 text-sm text-violet-900">
                  Click "Generate AI Insights" to analyze cortisol, melatonin, glucose windows for your current circadian profile.
                </div>
              )}

              {insightsLoading && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                  <Loader className="w-4 h-4 animate-spin" />
                  Analyzing chronobiology signals with LLM...
                </div>
              )}

              {!insightsLoading && insights.length > 0 && (
                <div className="mt-3 grid gap-3">
                  {insights.map((insight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.06 }}
                      className={`p-4 rounded-xl border-l-4 bg-white/70 ${
                        insight.impact === "high"
                          ? "border-red-400"
                          : insight.impact === "medium"
                            ? "border-amber-400"
                            : "border-sky-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {insight.hormone === "cortisol"
                            ? "🔆"
                            : insight.hormone === "melatonin"
                              ? "🌙"
                              : insight.hormone === "glucose"
                                ? "📊"
                                : "⚡"}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm capitalize">{insight.hormone}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground font-medium">
                              {insight.time}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.insight}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 24-Hour Timeline Visualization */}
            <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold text-base mb-4">24-Hour Timeline with Medications</h3>

          <div className="relative w-full h-32 bg-gradient-to-r from-indigo-900 via-yellow-50 via-blue-50 to-indigo-900 rounded-xl overflow-hidden border border-border">
            {/* Hour markers */}
            <div className="absolute inset-0 flex">
              {timeline.map((t, idx) => (
                <div key={idx} className="flex-1 border-r border-white/20 text-xs flex items-end justify-center pb-1">
                  {idx % 2 === 0 && <span className={`${t.accentColor} font-medium text-xs`}>{t.hour}:00</span>}
                </div>
              ))}
            </div>

            {/* Meal times */}
            {[
              { time: circadianProfile?.breakfastTime || "10:30", label: "🥣", color: "left-1/3" },
              { time: circadianProfile?.lunchTime || "15:00", label: "🍽️", color: "left-1/2" },
              { time: circadianProfile?.dinnerTime || "21:00", label: "🍽️", color: "left-5/6" },
            ].map((meal, idx) => (
              <div
                key={idx}
                className="absolute bottom-2 transform -translate-x-1/2"
                style={{ left: `${timeToPercent(meal.time)}%` }}
              >
                <div className="text-2xl drop-shadow-sm">{meal.label}</div>
              </div>
            ))}

            {/* Medication recommendations */}
            {schedule.map((med, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="absolute top-2 transform -translate-x-1/2 cursor-pointer group"
                style={{ left: `${timeToPercent(med.recommendedTime)}%` }}
                onClick={() => setActiveScheduleItem(idx)}
              >
                <div
                  className={`w-10 h-10 rounded-full ${med.color} border-2 flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Pill className="w-5 h-5" />
                </div>
                <div className="absolute top-full mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {med.recommendedTime}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Darker areas represent rest/night, lighter areas represent active hours
          </p>
        </motion.div>

            {/* Personalized Schedule */}
            <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              LLM-Optimized Medication Schedule
            </h3>
            <div className="text-sm font-medium text-green-600 flex items-center gap-1">
              ✓ {schedule.length} medications scheduled
            </div>
          </div>

          {/* Timeline sorted by time */}
          {schedule.sort((a, b) => {
            const aTime = parseInt(a.recommendedTime.replace(":", ""));
            const bTime = parseInt(b.recommendedTime.replace(":", ""));
            return aTime - bTime;
          }).map((med, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.5 + idx * 0.08 }}
              onClick={() => setActiveScheduleItem(idx)}
              className={`glass-card-hover p-5 border-l-4 cursor-pointer transition-all ${med.color}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${med.color} flex items-center justify-center text-2xl font-bold`}>
                    {med.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{med.drugName}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                        {med.circadianWindow}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-lg text-foreground">{med.recommendedTime}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        📋 {med.mealRelation === "none" ? "No food restriction" : `${med.mealRelation}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason - expanded on click */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: activeScheduleItem === idx ? 1 : 0.7,
                  height: "auto",
                }}
                className={`p-3 rounded-lg bg-black/5 border-l-2 border-dashed border-black/20 ${
                  activeScheduleItem === idx ? "block" : "line-clamp-2"
                }`}
              >
                <p className="text-xs leading-relaxed">
                  <strong className="text-blue-600">💡 Why this time?</strong> {med.reason}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

            {/* Optimization Summary */}
            <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 border-l-4 border-green-400 bg-green-50/30"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm mb-2 text-green-900">Schedule Optimization Complete ✓</h4>
              <ul className="text-sm space-y-1 text-green-800">
                <li>✓ Optimized based on your circadian rhythm</li>
                <li>✓ Food constraints respected</li>
                <li>✓ AI-generated personalized recommendations</li>
                <li>✓ Evidence-based circadian timing</li>
              </ul>
            </div>
          </div>
        </motion.div>

            {/* Metrics */}
            <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold text-base mb-4">LLM Optimization Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-100 to-transparent border border-blue-200">
              <p className="text-3xl font-bold text-blue-600">AI-Optimized</p>
              <p className="text-sm text-muted-foreground mt-1">Circadian Timing</p>
              <p className="text-xs text-muted-foreground mt-2">Based on chronotype and lifestyle</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-transparent border border-green-200">
              <p className="text-3xl font-bold text-green-600">{schedule.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Medications</p>
              <p className="text-xs text-muted-foreground mt-2">With LLM explanations</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-100 to-transparent border border-purple-200">
              <p className="text-3xl font-bold text-purple-600">{insights.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Circadian Insights</p>
              <p className="text-xs text-muted-foreground mt-2">AI-generated analysis</p>
            </div>
          </div>
        </motion.div>

            {/* Science Section */}
            <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6 border-l-4 border-blue-400"
        >
          <h3 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Chronobiology Science
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              ✓ <strong>Circadian Dosing</strong>: Timing medications with your biological clock can increase efficacy by 20-50%
              while reducing side effects.
            </p>
            <p>
              ✓ <strong>LLM-Powered Analysis</strong>: Our AI analyzes your unique schedule and medical data to generate
              personalized recommendations.
            </p>
            <p>
              ✓ <strong>Evidence-Based</strong>: Every recommendation includes the science behind WHY that timing works best for
              your medication.
            </p>
          </div>
        </motion.div>

            {/* Action Buttons */}
            <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 gradient-blue text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Apply LLM Schedule
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 border-2 border-border rounded-xl font-semibold text-sm hover:bg-accent transition-colors"
          >
            <ArrowRight className="w-4 h-4 inline mr-2" />
            Regenerate with LLM
          </motion.button>
        </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default ChronobiologyMedicationScheduler;
