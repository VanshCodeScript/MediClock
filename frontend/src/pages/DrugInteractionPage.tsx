import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { DrugSelector } from "@/components/DrugSelector";
import {
  AlertTriangle,
  Clock,
  Shield,
  AlertCircle,
  Lightbulb,
  Zap,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  checkDrugInteractions,
  InteractionResult,
  calculateOverallRisk,
  healthCheck,
} from "@/services/interactionService";
import {
  generateSimpleExplanation,
  generateMechanismExplanation,
  generateDetailedSideEffects,
  generateRecommendationActions,
  generateTimeGapExplanation,
  getConfidenceExplanation,
  getRiskScoreExplanation,
  formatAlternativesForDisplay,
  getSeverityColors,
  calculateDynamicRiskRating,
} from "@/services/interactionExplainService";
import InteractionLoadingAnimation from "@/components/InteractionLoadingAnimation";

// Calculate numeric risk score (0-10) - using dynamic calculation
const calculateRiskScore = (interactionList: InteractionResult[]): number => {
  if (interactionList.length === 0) return 0;
  const dynamicScores = interactionList.map((inter) => {
    // Use calculated dynamic rating if not provided or if it's the static 6.1
    return inter.dynamicRiskRating && inter.dynamicRiskRating !== 6.1
      ? inter.dynamicRiskRating
      : calculateDynamicRiskRating(inter);
  });
  const avgScore = dynamicScores.reduce((a, b) => a + b, 0) / dynamicScores.length;
  return avgScore;
};

const DrugInteractionPage = () => {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<InteractionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  // Minimum loading time in milliseconds
  const MIN_LOADING_TIME = 6000;
  let loadingStartTime: number;

  // Check API health on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const ready = await healthCheck();
        setIsApiReady(ready);
        if (!ready) {
          setApiError("Backend API not available. Please start the Python server.");
        }
      } catch (error) {
        setIsApiReady(false);
        setApiError("Could not connect to backend API.");
      }
    };

    checkApi();
  }, []);

  const handleCheckInteractions = async () => {
    if (selectedDrugs.length < 2) return;

    setIsLoading(true);
    setShowLoadingAnimation(true);
    setApiError(null);
    loadingStartTime = Date.now();

    try {
      const results = await checkDrugInteractions(selectedDrugs);
      
      // Ensure loading animation shows for at least MIN_LOADING_TIME
      const elapsedTime = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      
      setInteractions(results);
      setShowLoadingAnimation(false);
    } catch (error) {
      setApiError("Failed to check interactions. Please try again.");
      setInteractions([]);
      setShowLoadingAnimation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const overallRisk = calculateOverallRisk(interactions);
  const riskScore = calculateRiskScore(interactions);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* API Status */}
        {!isApiReady && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-l-4 border-red-500 bg-red-500/20"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-red-700 text-base">Backend API Not Available</p>
                <p className="text-red-600 text-sm mt-2">
                  To use drug interactions, start the Python FastAPI server:
                  <br />
                  <code className="bg-red-900/20 px-3 py-2 rounded mt-2 block text-xs font-mono border border-red-500">
                    cd backend/python && python3 -m uvicorn app.main:app
                    --reload --port 8000
                  </code>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Drug Selector */}
        <DrugSelector
          selectedDrugs={selectedDrugs}
          onDrugsChange={setSelectedDrugs}
          onCheck={handleCheckInteractions}
          isLoading={isLoading}
        />

        {/* Loading Animation - Full Screen Overlay */}
        <AnimatePresence>
          {showLoadingAnimation && (
            <motion.div
              key="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card p-12 rounded-2xl shadow-2xl max-w-md w-full mx-4"
              >
                <InteractionLoadingAnimation minDuration={MIN_LOADING_TIME} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overall Risk Score with Dynamic Rating */}
        {interactions.length > 0 && !showLoadingAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-8 border-4 ${
              riskScore >= 7
                ? "border-red-600 bg-gradient-to-r from-red-600/25 to-red-500/15"
                : riskScore >= 4
                  ? "border-yellow-500 bg-gradient-to-r from-yellow-500/25 to-yellow-400/15"
                  : "border-green-600 bg-gradient-to-r from-green-600/25 to-green-500/15"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-semibold">Overall Medication Risk</p>
                  <p className={`text-5xl font-bold capitalize mt-2 ${
                    riskScore >= 7
                      ? "text-red-700 dark:text-red-500"
                      : riskScore >= 4
                        ? "text-yellow-700 dark:text-yellow-500"
                        : "text-green-700 dark:text-green-500"
                  }`}>
                    {overallRisk}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-2">Dynamic Risk Score</p>
                  <p
                    className={`text-6xl font-black ${
                      riskScore >= 7
                        ? "text-red-700 dark:text-red-500"
                        : riskScore >= 4
                          ? "text-yellow-700 dark:text-yellow-500"
                          : "text-green-700 dark:text-green-500"
                    }`}
                  >
                    {riskScore.toFixed(1)}
                  </p>
                  <p className="text-base font-semibold text-gray-600 dark:text-gray-400 mt-2">out of 10</p>
                </div>
              </div>

              {/* Risk Visualization Bar */}
              <div className="w-full">
                <div className="flex justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span>Low Risk</span>
                  <span>High Risk</span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-4 overflow-hidden border-2 border-gray-400">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(riskScore / 10) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      riskScore >= 7
                        ? "bg-red-600"
                        : riskScore >= 4
                          ? "bg-yellow-500"
                          : "bg-green-600"
                    }`}
                  />
                </div>
              </div>

              {/* Risk Score Explanation */}
              <div className="pt-4 border-t-2 border-gray-400">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
                  {getRiskScoreExplanation(riskScore)}
                </p>
              </div>

              <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                Found <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{interactions.length}</span> interaction{interactions.length !== 1 ? "s" : ""} between your medicines
              </p>
            </div>
          </motion.div>
        )}

        {/* Interactions Header */}
        {interactions.length > 0 && !showLoadingAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 border-4 border-amber-600 bg-amber-600/20"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-700 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold text-2xl text-amber-900 dark:text-amber-300">
                  ⚠️ Detailed Drug Interaction Analysis
                </h3>
                <p className="text-base text-amber-800 dark:text-amber-200 mt-2 font-semibold">
                  Below is a comprehensive clinical analysis of each detected interaction. This information is provided for educational purposes and should not replace professional medical advice.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* No interactions message */}
        {selectedDrugs.length >= 2 &&
          !isLoading &&
          interactions.length === 0 &&
          !apiError &&
          !showLoadingAnimation && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 text-center border-4 border-green-600 bg-gradient-to-b from-green-600/30 to-green-500/10"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-700 dark:text-green-400 mx-auto mb-3" />
              </motion.div>
              <h3 className="font-semibold text-2xl text-green-900 dark:text-green-300">
                ✅ No Harmful Drug Interactions Detected
              </h3>
              <p className="text-base text-green-800 dark:text-green-200 mt-3 font-semibold">
                The selected medicines do not show any known harmful interactions in our database. However, always follow medical advice and consult a healthcare professional if unsure.
              </p>
            </motion.div>
          )}

        {/* Error message */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-4 border-red-600 bg-red-600/30"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-base font-semibold text-red-800 dark:text-red-200">{apiError}</p>
            </div>
          </motion.div>
        )}

        {/* Interactions List - Enhanced */}
        {interactions.length > 0 && !showLoadingAnimation && (
          <div className="space-y-4">
            {interactions.map((inter, i) => {
              const severityColors = getSeverityColors(inter.severity);
              const simpleExplanation = generateSimpleExplanation(inter);
              const mechanismExplanation = generateMechanismExplanation(inter);
              const detailedEffects = generateDetailedSideEffects(inter);
              const recommendationActions = generateRecommendationActions(inter);
              const timeGapExplanation = generateTimeGapExplanation(inter);
              const confidenceExpl = getConfidenceExplanation(
                inter.confidence || 50
              );
              const formattedAlternatives = formatAlternativesForDisplay(inter);
              // Use calculated dynamic rating if not provided or if it's the static 6.1
              const dynamicRating =
                inter.dynamicRiskRating && inter.dynamicRiskRating !== 6.1
                  ? inter.dynamicRiskRating
                  : calculateDynamicRiskRating(inter);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`glass-card-hover p-6 space-y-4 border-4 rounded-xl ${
                    inter.severity === "high"
                      ? "border-red-600 bg-red-600/10"
                      : inter.severity === "medium"
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-green-600 bg-green-600/10"
                  }`}
                >
                  {/* 1. Drug Pair Header */}
                  <div className="flex items-start justify-between pb-4 border-b-2 border-gray-400">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-base px-4 py-2 rounded-lg bg-blue-600 text-white border-2 border-blue-700">
                          {inter.drugA}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-lg font-bold">+</span>
                        <span className="font-bold text-base px-4 py-2 rounded-lg bg-blue-600 text-white border-2 border-blue-700">
                          {inter.drugB}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Risk Level & Severity Indicator */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 font-semibold text-base ${
                        inter.severity === "high"
                          ? "bg-red-600/80 border-red-700 text-white"
                          : inter.severity === "medium"
                            ? "bg-yellow-500/80 border-yellow-600 text-black"
                            : "bg-green-600/80 border-green-700 text-white"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          inter.severity === "high"
                            ? "bg-white animate-pulse"
                            : inter.severity === "medium"
                              ? "bg-black animate-pulse"
                              : "bg-white animate-pulse"
                        }`}
                      />
                      <span>
                        {severityColors.label} – {severityColors.description}
                      </span>
                    </div>
                  </div>

                  {/* 3. Dynamic Risk Score */}
                  {dynamicRating !== undefined && (
                    <div className={`p-5 rounded-lg border-2 font-semibold ${
                      dynamicRating >= 7
                        ? "bg-red-600/40 border-red-700 text-red-900 dark:text-red-200"
                        : dynamicRating >= 4
                          ? "bg-yellow-500/40 border-yellow-600 text-yellow-900 dark:text-yellow-200"
                          : "bg-green-600/40 border-green-700 text-green-900 dark:text-green-200"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-base font-bold">
                          Dynamic Risk Score
                        </p>
                        <p className="text-4xl font-black">
                          {dynamicRating.toFixed(1)}/10
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {getRiskScoreExplanation(dynamicRating)}
                      </p>
                    </div>
                  )}

                  {/* 4. Simple Explanation */}
                  <div className="p-6 bg-blue-600/40 rounded-lg border-2 border-blue-700">
                    <p className="text-base font-bold text-blue-900 dark:text-blue-200 mb-2">
                      🔵 Simple Explanation
                    </p>
                    <p className="text-base font-semibold text-blue-900 dark:text-blue-200 leading-relaxed">
                      {simpleExplanation}
                    </p>
                  </div>

                  {/* 5. Medical Explanation */}
                  {inter.note && (
                    <div className="p-6 bg-purple-600/40 rounded-lg border-2 border-purple-700">
                      <p className="text-base font-bold text-purple-900 dark:text-purple-200 mb-2">
                        🟣 Medical Explanation
                      </p>
                      <p className="text-base font-semibold text-purple-900 dark:text-purple-200">{inter.note}</p>
                    </div>
                  )}

                  {/* 6. How This Interaction Happens */}
                  {inter.mechanism && (
                    <div className="p-6 bg-indigo-600/40 rounded-lg border-2 border-indigo-700">
                      <p className="text-base font-bold text-indigo-900 dark:text-indigo-200 mb-2">
                        ⚙️ How This Interaction Happens
                      </p>
                      <p className="text-base font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
                        {mechanismExplanation.split("Mechanism")[0].trim()}
                      </p>
                      <p className="text-base font-semibold text-indigo-900 dark:text-indigo-200 italic border-l-4 border-indigo-700 pl-3">
                        {inter.mechanism}
                      </p>
                    </div>
                  )}

                  {/* 7. Possible Effects */}
                  {detailedEffects.length > 0 && (
                    <div className="p-6 bg-amber-600/40 rounded-lg border-2 border-amber-700">
                      <p className="text-base font-bold text-amber-900 dark:text-amber-200 mb-3">
                        ⚠️ Possible Effects
                      </p>
                      <ul className="space-y-3">
                        {detailedEffects.map((effect, idx) => (
                          <li key={idx} className="text-base font-semibold text-amber-900 dark:text-amber-200">
                            <span className="font-black">🔹 {effect.effect}</span>
                            <span className="block text-sm mt-1">
                              may occur {effect.reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 8. Confidence Level */}
                  {inter.confidence !== undefined && (
                    <div className="p-6 bg-sky-600/40 rounded-lg border-2 border-sky-700">
                      <p className="text-base font-bold text-sky-900 dark:text-sky-200 mb-3">
                        📊 Confidence Level
                      </p>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-full h-3 border border-gray-500">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${inter.confidence}%` }}
                            transition={{ duration: 0.6 }}
                            className="bg-sky-600 h-3 rounded-full"
                          />
                        </div>
                        <span className="text-base font-bold text-sky-900 dark:text-sky-200 min-w-fit">
                          {inter.confidence.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                        {confidenceExpl}
                      </p>
                    </div>
                  )}

                  {/* 9. Recommended Action */}
                  <div className="p-6 bg-green-600/40 rounded-lg border-2 border-green-700">
                    <p className="text-base font-bold text-green-900 dark:text-green-200 mb-3">
                      ✅ Recommended Action
                    </p>
                    <ul className="space-y-2">
                      {recommendationActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-green-700 dark:text-green-400 mt-0.5 font-black text-lg">✓</span>
                          <span className="text-base font-semibold text-green-900 dark:text-green-200">
                            {action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 10. Suggested Time Gap */}
                  {timeGapExplanation && (
                    <div className="flex items-start gap-3 p-6 bg-orange-600/40 rounded-lg border-2 border-orange-700">
                      <Clock className="w-5 h-5 text-orange-900 dark:text-orange-200 flex-shrink-0 mt-1 font-bold" />
                      <div>
                        <p className="text-base font-bold text-orange-900 dark:text-orange-200 mb-2">
                          ⏱️ Suggested Time Gap
                        </p>
                        <p className="text-base font-bold text-orange-900 dark:text-orange-200">
                          {inter.timeGap}
                        </p>
                        <p className="text-base font-semibold text-orange-900 dark:text-orange-200 italic mt-2">
                          {timeGapExplanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 11. Safer Alternatives */}
                  {formattedAlternatives.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-green-700 dark:text-green-400" />
                        <p className="text-base font-bold text-green-700 dark:text-green-400">
                          💡 Safer Alternatives
                        </p>
                      </div>
                      {formattedAlternatives.map((altGroup, altIdx) => (
                        <motion.div
                          key={altIdx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: altIdx * 0.1 }}
                          className="p-5 bg-green-600/40 rounded-lg border-2 border-green-700"
                        >
                          <p className="text-base font-bold text-green-900 dark:text-green-200 mb-3">
                            Instead of <span className="font-black text-lg">{altGroup.drugName}</span>, consider:
                          </p>
                          <div className="space-y-2">
                            {altGroup.alternatives.map((alt, altItemIdx) => (
                              <motion.div
                                key={altItemIdx}
                                whileHover={{ scale: 1.02, paddingLeft: 8 }}
                                transition={{ type: "spring", stiffness: 400 }}
                                className="flex items-start gap-3 text-base bg-white/50 dark:bg-black/30 p-3 rounded-lg cursor-pointer border border-green-500"
                              >
                                <Zap className="w-4 h-4 text-green-700 dark:text-green-400 flex-shrink-0 mt-0.5 font-bold" />
                                <div className="flex-1">
                                  <p className="font-bold text-green-900 dark:text-green-200">
                                    {alt.drug}
                                  </p>
                                  {alt.reason && (
                                    <p className="text-sm font-semibold text-green-800 dark:text-green-300 mt-1">
                                      {alt.reason}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="flex items-start gap-3 p-5 bg-red-600/20 rounded-lg border-2 border-red-600">
                    <Info className="w-5 h-5 text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5 font-bold" />
                    <p className="text-base font-semibold text-red-900 dark:text-red-200">
                      ⚠️ This analysis is for informational purposes. Always consult with a healthcare professional before making any changes to your medication regimen.
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default DrugInteractionPage;
