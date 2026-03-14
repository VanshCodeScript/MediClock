import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Lightbulb, Loader2, Moon, Salad, Clock3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getOrCreateCurrentUserId } from "@/lib/userSession";

type Insight = {
  type: string;
  severity: "low" | "medium" | "high";
  metric: string;
  value: string;
  message: string;
  recommendation: string;
  llmExplanation?: string;
};

type InsightResponse = {
  metrics?: {
    sleep_duration?: string;
    breakfast_gap?: string;
    lunch_gap?: string;
    dinner_gap?: string;
    sleep_food_gap?: string;
  };
  insights?: Insight[];
  llmUsed?: boolean;
};

const severityClass: Record<string, string> = {
  high: "status-red",
  medium: "status-yellow",
  low: "status-green",
};

const typeMeta: Record<string, { title: string; icon: any; color: string }> = {
  sleep: { title: "Sleep Insights", icon: Moon, color: "text-indigo-500 bg-indigo-50" },
  meal: { title: "Meal Timing Insights", icon: Salad, color: "text-orange-500 bg-orange-50" },
  circadian: { title: "Circadian Rhythm Insights", icon: Clock3, color: "text-blue-500 bg-blue-50" },
};

const SuggestionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InsightResponse>({ insights: [] });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = await getOrCreateCurrentUserId();
        const response = await api.circadianInsights.getHealthSuggestionsByUserId(userId, true);

        if (response?.error || response?.message?.toLowerCase?.().includes("not found")) {
          throw new Error(response?.error || response?.message || "Circadian profile not found");
        }

        setData({
          metrics: response?.metrics,
          insights: Array.isArray(response?.insights) ? response.insights : [],
          llmUsed: Boolean(response?.llmUsed),
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load suggestions");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const grouped = useMemo(() => {
    const insights = data.insights || [];
    return insights.reduce((acc: Record<string, Insight[]>, item) => {
      const key = item.type || "circadian";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [data.insights]);

  const insightGroups = Object.entries(grouped);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent"><Lightbulb className="w-5 h-5 text-primary" /></div>
          <div>
            <h3 className="font-display font-semibold text-base">Circadian Health Insights</h3>
            <p className="text-sm text-muted-foreground">
              Deterministic rule engine with {data.llmUsed ? "Groq-enhanced" : "fallback"} explanations
            </p>
          </div>
        </motion.div>

        {loading && (
          <div className="glass-card p-6 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Generating your circadian suggestions...
          </div>
        )}

        {error && (
          <div className="glass-card p-4 border-l-4 border-red-400 bg-red-50/40 text-sm text-red-700">
            {error}. Please complete your circadian profile first.
          </div>
        )}

        {!loading && !error && data.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Sleep duration</p><p className="font-semibold">{data.metrics.sleep_duration}</p></div>
            <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Breakfast gap</p><p className="font-semibold">{data.metrics.breakfast_gap}</p></div>
            <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Lunch gap</p><p className="font-semibold">{data.metrics.lunch_gap}</p></div>
            <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Dinner gap</p><p className="font-semibold">{data.metrics.dinner_gap}</p></div>
            <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Dinner to sleep</p><p className="font-semibold">{data.metrics.sleep_food_gap}</p></div>
          </div>
        )}

        {!loading && !error && insightGroups.length === 0 && (
          <div className="glass-card p-6 text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No major circadian issues detected from your current schedule.
          </div>
        )}

        {insightGroups.map(([type, items], i) => {
          const meta = typeMeta[type] || typeMeta.circadian;
          const Icon = meta.icon;
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${meta.color}`}><Icon className="w-5 h-5" /></div>
                <h3 className="font-display font-semibold">{meta.title}</h3>
              </div>
              <div className="space-y-3">
                {items.map((item, j) => (
                  <div key={`${item.metric}-${j}`} className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border capitalize ${severityClass[item.severity] || "status-yellow"}`}>
                        {item.severity}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.metric}</span>
                      <span className="text-xs text-muted-foreground">• {item.value}</span>
                    </div>
                    <p className="text-sm text-foreground">{item.message}</p>
                    <p className="text-sm text-muted-foreground">Recommendation: {item.recommendation}</p>
                    {item.llmExplanation && (
                      <div className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-primary" />
                        <span>{item.llmExplanation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageTransition>
  );
};

export default SuggestionsPage;
