import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { AlertTriangle, Clock, Shield } from "lucide-react";

const interactions = [
  { drugA: "Metformin", drugB: "Lisinopril", severity: "low", spacing: "No spacing needed", note: "Generally safe to combine." },
  { drugA: "Warfarin", drugB: "Aspirin", severity: "high", spacing: "Avoid combination", note: "Significantly increased bleeding risk." },
  { drugA: "Atorvastatin", drugB: "Amlodipine", severity: "medium", spacing: "4 hours apart", note: "May increase statin side effects." },
  { drugA: "Metformin", drugB: "Alcohol", severity: "high", spacing: "Avoid", note: "Risk of lactic acidosis." },
];

const sevColors: Record<string, string> = { low: "status-green", medium: "status-yellow", high: "status-red" };

const DrugInteractionPage = () => (
  <PageTransition>
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-l-4 border-warning">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-semibold text-base">Drug Interaction Warnings</h3>
            <p className="text-sm text-muted-foreground mt-1">The following interactions have been detected based on your current medications.</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {interactions.map((inter, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-hover p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm px-3 py-1 rounded-lg bg-accent">{inter.drugA}</span>
                <span className="text-muted-foreground text-xs">+</span>
                <span className="font-medium text-sm px-3 py-1 rounded-lg bg-accent">{inter.drugB}</span>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${sevColors[inter.severity]}`}>
                {inter.severity} risk
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" /> {inter.spacing}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Shield className="w-3.5 h-3.5" /> {inter.note}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </PageTransition>
);

export default DrugInteractionPage;
