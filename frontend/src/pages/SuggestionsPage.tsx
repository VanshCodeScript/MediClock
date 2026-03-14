import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Moon, Utensils, Dumbbell, Pill, Lightbulb } from "lucide-react";

const suggestions = [
  { category: "Sleep", icon: Moon, color: "text-indigo-500 bg-indigo-50", items: [
    "You sleep late (avg 1 AM) → shift evening medications 2 hours earlier.",
    "Inconsistent sleep pattern detected → consider melatonin supplement."
  ]},
  { category: "Diet", icon: Utensils, color: "text-orange-500 bg-orange-50", items: [
    "High cholesterol → evening statin recommended for better LDL reduction.",
    "Low fiber intake detected → may affect Metformin absorption."
  ]},
  { category: "Exercise", icon: Dumbbell, color: "text-emerald-500 bg-emerald-50", items: [
    "Moderate activity improves insulin sensitivity → take Metformin 30 min before workout.",
    "Post-exercise blood sugar dips detected → adjust dosage timing."
  ]},
  { category: "Medication", icon: Pill, color: "text-blue-500 bg-blue-50", items: [
    "Atorvastatin works best at night due to peak cholesterol synthesis.",
    "Lisinopril shows better results when taken in the morning."
  ]},
];

const SuggestionsPage = () => (
  <PageTransition>
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent"><Lightbulb className="w-5 h-5 text-primary" /></div>
        <div>
          <h3 className="font-display font-semibold text-base">AI Health Insights</h3>
          <p className="text-sm text-muted-foreground">Personalized recommendations based on your health data</p>
        </div>
      </motion.div>

      {suggestions.map((s, i) => (
        <motion.div key={s.category} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <h3 className="font-display font-semibold">{s.category}</h3>
          </div>
          <div className="space-y-3">
            {s.items.map((item, j) => (
              <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <span className="text-primary mt-0.5">•</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  </PageTransition>
);

export default SuggestionsPage;
