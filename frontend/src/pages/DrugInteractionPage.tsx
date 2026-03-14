import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { DrugSelector } from "@/components/DrugSelector";
import { AlertTriangle, Clock, Shield, AlertCircle, Lightbulb, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import {
  checkDrugInteractions,
  InteractionResult,
  calculateOverallRisk,
  healthCheck,
} from "@/services/interactionService";

const sevColors: Record<string, string> = {
  low: "status-green",
  medium: "status-yellow",
  high: "status-red",
};

// Get risk color based on dynamic risk rating
const getRiskColor = (risk: number): string => {
  if (risk >= 7) return "text-red-600";
  if (risk >= 4) return "text-yellow-600";
  return "text-green-600";
};

const getRiskBgColor = (risk: number): string => {
  if (risk >= 7) return "bg-red-500/10 border-red-500/30";
  if (risk >= 4) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-green-500/10 border-green-500/30";
};

// Calculate numeric risk score (0-10)
const calculateRiskScore = (interactions: InteractionResult[]): number => {
  if (interactions.length === 0) return 0;
  const avgDynamicRisk = interactions.reduce((sum, i) => sum + (i.dynamicRiskRating || 5), 0) / interactions.length;
  return avgDynamicRisk;
};

const DrugInteractionPage = () => {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<InteractionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

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
    setApiError(null);

    try {
      const results = await checkDrugInteractions(selectedDrugs);
      setInteractions(results);
    } catch (error) {
      setApiError("Failed to check interactions. Please try again.");
      setInteractions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const overallRisk = calculateOverallRisk(interactions);
  const riskScore = calculateRiskScore(interactions);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* API Status */}
        {!isApiReady && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 border-l-4 border-warning bg-warning/10"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Backend API Not Available</p>
                <p className="text-muted-foreground text-xs mt-1">
                  To use drug interactions, start the Python FastAPI server:
                  <br />
                  <code className="bg-muted px-2 py-1 rounded mt-1 block text-xs">
                    cd backend/python && python3 -m uvicorn app.main:app --reload --port 8000
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

        {/* Overall Risk Score with Dynamic Rating */}
        {interactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-6 border-l-4 border border-primary/30 ${getRiskBgColor(riskScore)}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Medication Risk</p>
                  <p className="text-3xl font-bold capitalize mt-1">{overallRisk}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Dynamic Risk Score</p>
                  <p className={`text-5xl font-bold ${getRiskColor(riskScore)}`}>
                    {riskScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">out of 10</p>
                </div>
              </div>
              
              {/* Risk Visualization Bar */}
              <div className="w-full">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Low Risk</span>
                  <span>High Risk</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(riskScore / 10) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      riskScore >= 7
                        ? "bg-red-500"
                        : riskScore >= 4
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Found {interactions.length} interaction{interactions.length !== 1 ? "s" : ""} between your medicines
              </p>
            </div>
          </motion.div>
        )}

        {/* Interactions Header */}
        {interactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-l-4 border-warning"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-base">
                  Drug Interaction Warnings
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The following interactions have been detected based on your selected medications. Safer alternatives are suggested below each interaction.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* No interactions message */}
        {selectedDrugs.length >= 2 && !isLoading && interactions.length === 0 && !apiError && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 text-center border-l-4 border-green-500"
          >
            <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold">No Interactions Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Good news! No harmful interactions detected between your selected medicines.
            </p>
          </motion.div>
        )}

        {/* Error message */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 border-l-4 border-destructive bg-destructive/10"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{apiError}</p>
            </div>
          </motion.div>
        )}

        {/* Interactions List - Enhanced */}
        {interactions.length > 0 && (
          <div className="space-y-4">
            {interactions.map((inter, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card-hover p-6"
              >
                {/* Drug pair and severity header with dynamic risk */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-sm px-3 py-1 rounded-lg bg-accent">
                        {inter.drugA}
                      </span>
                      <span className="text-muted-foreground text-xs">+</span>
                      <span className="font-medium text-sm px-3 py-1 rounded-lg bg-accent">
                        {inter.drugB}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${sevColors[inter.severity]}`}
                    >
                      {inter.severity} risk
                    </span>
                    {inter.dynamicRiskRating !== undefined && (
                      <div className={`text-center px-3 py-1 rounded-lg border ${getRiskBgColor(inter.dynamicRiskRating)}`}>
                        <p className={`text-xs font-semibold ${getRiskColor(inter.dynamicRiskRating)}`}>
                          {inter.dynamicRiskRating.toFixed(1)}/10
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main interaction description */}
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{inter.note}</p>
                </div>

                {/* Mechanism */}
                {inter.mechanism && (
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-1">Mechanism</p>
                    <p className="text-xs text-muted-foreground">{inter.mechanism}</p>
                  </div>
                )}

                {/* Grid: Side Effects and Other Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {/* Side Effects */}
                  {inter.sideEffects && inter.sideEffects.length > 0 && (
                    <div className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                      <p className="text-xs font-semibold text-warning mb-2">Possible Effects</p>
                      <ul className="list-disc ml-4 space-y-1">
                        {inter.sideEffects.map((effect, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground">
                            {effect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence Score */}
                  {inter.confidence !== undefined && (
                    <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                      <p className="text-xs font-semibold text-blue-600 mb-1">Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${inter.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {inter.confidence.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendation */}
                {inter.recommendation && (
                  <div className="mb-4 p-3 bg-accent/5 rounded-lg border border-accent/20">
                    <p className="text-xs font-semibold text-primary mb-1">Recommendation</p>
                    <p className="text-xs text-muted-foreground">{inter.recommendation}</p>
                  </div>
                )}

                {/* Time Gap - with Icon */}
                {inter.timeGap && (
                  <div className="flex items-start gap-2 p-3 bg-secondary/5 rounded-lg border border-secondary/20 mb-4">
                    <Clock className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-secondary mb-0.5">Suggested Time Gap</p>
                      <p className="text-xs text-muted-foreground">{inter.timeGap}</p>
                    </div>
                  </div>
                )}

                {/* Safer Alternatives - Per Drug */}
                {inter.alternativesByDrug && inter.alternativesByDrug.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4 text-green-600" />
                      <p className="text-xs font-semibold text-green-600">Safer Alternatives</p>
                    </div>
                    {inter.alternativesByDrug.map((altGroup, altIdx) => (
                      <div
                        key={altIdx}
                        className="p-4 bg-green-500/5 rounded-lg border border-green-500/20"
                      >
                        <p className="text-xs font-semibold text-green-700 mb-2">
                          Instead of <span className="font-bold">{altGroup.drugName}</span>, consider:
                        </p>
                        <div className="space-y-2">
                          {altGroup.alternatives.map((alt, altItemIdx) => (
                            <div
                              key={altItemIdx}
                              className="flex items-start gap-2 text-xs bg-white/50 dark:bg-black/20 p-2 rounded"
                            >
                              <Zap className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-green-700">{alt.drug}</p>
                                {alt.reason && (
                                  <p className="text-muted-foreground">{alt.reason}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback to simple alternatives */}
                {(!inter.alternativesByDrug || inter.alternativesByDrug.length === 0) &&
                  inter.alternatives &&
                  inter.alternatives.length > 0 && (
                    <div className="mt-4 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Safer Alternatives
                      </p>
                      <ul className="list-disc ml-4 space-y-1">
                        {inter.alternatives.map((alt, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground">
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default DrugInteractionPage;
