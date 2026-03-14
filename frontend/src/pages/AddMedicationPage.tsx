import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Pill, Plus } from "lucide-react";
import { useState } from "react";

const sampleMeds = [
  { name: "Metformin", dosage: "500mg", freq: "Twice daily", meal: "After", disease: "Diabetes" },
  { name: "Lisinopril", dosage: "10mg", freq: "Once daily", meal: "Before", disease: "Hypertension" },
  { name: "Atorvastatin", dosage: "20mg", freq: "Once daily", meal: "After", disease: "Cholesterol" },
];

const AddMedicationPage = () => {
  const [meds, setMeds] = useState(sampleMeds);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Add New Medication
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); }}>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Medicine Name</label>
              <input placeholder="e.g., Aspirin" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Dosage</label>
              <input placeholder="e.g., 500mg" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Frequency</label>
              <select className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                <option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As needed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Before/After Meal</label>
              <select className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                <option>Before Meal</option><option>After Meal</option><option>With Meal</option><option>Empty Stomach</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Disease Treated</label>
              <input placeholder="e.g., Hypertension" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
            </div>
            <div className="md:col-span-2">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-3 gradient-blue text-primary-foreground rounded-xl font-semibold text-sm">
                Add Medication
              </motion.button>
            </div>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-display font-semibold text-base mb-4">Current Medications</h3>
          <div className="grid gap-3">
            {meds.map((m) => (
              <div key={m.name} className="glass-card-hover p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent"><Pill className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium">{m.name} – {m.dosage}</p>
                    <p className="text-xs text-muted-foreground">{m.freq} · {m.meal} meal · {m.disease}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AddMedicationPage;
