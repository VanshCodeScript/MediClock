import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Pill, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getOrCreateCurrentUserId } from "@/lib/userSession";

const AddMedicationPage = () => {
  const [userId, setUserId] = useState<string>("");
  const [meds, setMeds] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "once daily",
    meal: "after food",
    disease: "",
  });

  const foodRuleLabelMap: Record<string, string> = {
    "before food": "Before Meal",
    "after food": "After Meal",
    "with food": "With Meal",
    "empty stomach": "Empty Stomach",
    none: "No food restriction",
  };

  const loadMeds = async (uid: string) => {
    const response = await api.medications.getByUserId(uid);
    if (Array.isArray(response)) {
      setMeds(response);
      return;
    }
    throw new Error(response?.error || "Failed to load medications");
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const uid = await getOrCreateCurrentUserId();
        setUserId(uid);
        await loadMeds(uid);
      } catch (err: any) {
        setError(err?.message || "Failed to initialize medication page");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("User session not ready");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        userId,
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        foodRule: form.meal,
        reason: form.disease.trim() || `${form.meal}`,
      };

      const response = await api.medications.create(payload);
      if (response?.error) {
        throw new Error(response.error);
      }

      setForm({
        name: "",
        dosage: "",
        frequency: "once daily",
        meal: "after food",
        disease: "",
      });

      await loadMeds(userId);
    } catch (err: any) {
      setError(err?.message || "Failed to add medication");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="glass-card p-4 border-l-4 border-red-400 bg-red-50/50 text-red-700 text-sm">{error}</div>
        )}

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Add New Medication
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Medicine Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g., Aspirin"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Dosage</label>
              <input
                value={form.dosage}
                onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                required
                placeholder="e.g., 500mg"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                <option value="once daily">Once daily</option>
                <option value="twice daily">Twice daily</option>
                <option value="three times daily">Three times daily</option>
                <option value="as needed">As needed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Before/After Meal</label>
              <select
                value={form.meal}
                onChange={(e) => setForm((f) => ({ ...f, meal: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                <option value="before food">Before Meal</option>
                <option value="after food">After Meal</option>
                <option value="with food">With Meal</option>
                <option value="empty stomach">Empty Stomach</option>
                <option value="none">No food restriction</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Disease Treated</label>
              <input
                value={form.disease}
                onChange={(e) => setForm((f) => ({ ...f, disease: e.target.value }))}
                placeholder="e.g., Hypertension"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <motion.button
                disabled={submitting || loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 gradient-blue text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add Medication"}
              </motion.button>
            </div>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-display font-semibold text-base mb-4">Current Medications</h3>
          <div className="grid gap-3">
            {loading && <div className="text-sm text-muted-foreground">Loading medications...</div>}
            {!loading && meds.length === 0 && <div className="text-sm text-muted-foreground">No medications in DB yet.</div>}
            {meds.map((m) => (
              <div key={m._id || `${m.name}-${m.dosage}`} className="glass-card-hover p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent"><Pill className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium">{m.name} - {m.dosage}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.frequency} · {foodRuleLabelMap[m.foodRule || "none"] || "No food restriction"} · {m.reason || "General"}
                    </p>
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
