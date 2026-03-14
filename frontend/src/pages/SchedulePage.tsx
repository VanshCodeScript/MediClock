import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Brain, Clock, Moon, Utensils, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const factors = [
  { icon: Brain, label: "Circadian Rhythm", value: "Peak: 9 PM" },
  { icon: Utensils, label: "Meal Timing", value: "2h after dinner" },
  { icon: Moon, label: "Sleep Cycle", value: "11 PM – 7 AM" },
  { icon: Zap, label: "Drug Absorption", value: "Best on empty stomach" },
];

const comparisonData = [
  { time: "6 AM", effectiveness: 45 },
  { time: "9 AM", effectiveness: 60 },
  { time: "12 PM", effectiveness: 52 },
  { time: "3 PM", effectiveness: 65 },
  { time: "6 PM", effectiveness: 72 },
  { time: "9 PM", effectiveness: 87 },
];

const SchedulePage = () => (
  <PageTransition>
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 text-center gradient-blue text-primary-foreground">
        <Brain className="w-10 h-10 mx-auto mb-3 opacity-90" />
        <h2 className="font-display font-bold text-2xl mb-1">AI-Optimized Schedule</h2>
        <p className="opacity-80 text-sm">Based on your circadian rhythm, meals, and medication profile</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {factors.map((f, i) => (
          <motion.div key={f.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-4 text-center">
            <f.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <p className="text-sm font-semibold mt-1">{f.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h3 className="font-display font-semibold text-base mb-2">Recommended Schedule</h3>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/50 mb-6">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <p className="font-display font-bold text-2xl">9:00 PM</p>
            <p className="text-sm text-muted-foreground">Expected Effectiveness: <span className="font-semibold text-success">87%</span></p>
          </div>
        </div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Effectiveness by Time of Day</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonData}>
            <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="effectiveness" radius={[6, 6, 0, 0]}>
              {comparisonData.map((entry, index) => (
                <Cell key={index} fill={entry.effectiveness >= 80 ? "#22C55E" : entry.effectiveness >= 60 ? "#FACC15" : "#0000FF"} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  </PageTransition>
);

export default SchedulePage;
