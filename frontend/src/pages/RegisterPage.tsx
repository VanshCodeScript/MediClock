import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { useState } from "react";

const getApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) {
    return String(envBase).replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5001/api/v1`;
  }

  return "http://localhost:5001/api/v1";
};

const API_BASE = getApiBaseUrl();
const steps = ["Personal Info", "Health Details", "Lifestyle"];

const RegisterPage = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    email: "",
    password: "",
    phone: "",
    condition: "",
    currentMedications: "",
    allergies: "",
    wakeTime: "07:00",
    sleepTime: "23:00",
    breakfastTime: "08:00",
    lunchTime: "13:00",
    dinnerTime: "19:00",
    activityLevel: "Moderate",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          age: form.age ? Number(form.age) : undefined,
          gender: form.gender,
          phone: form.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      localStorage.setItem("mediclock_token", data.token);
      localStorage.setItem("mediclock_user", JSON.stringify(data.user));
      localStorage.setItem("mediclock_user_id", data.user._id);

      navigate("/dashboard");
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">MediClock</span>
        </div>

        <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-muted-foreground mb-8">Set up your chronobiology profile in 3 easy steps.</p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? "gradient-blue" : "bg-muted"}`} />
              <p className={`text-xs mt-2 font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form className="glass-card p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                  <input value={form.name} onChange={set("name")} placeholder="John Doe" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Age</label>
                  <input type="number" value={form.age} onChange={set("age")} placeholder="28" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Gender</label>
                <select value={form.gender} onChange={set("gender")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={set("phone")} placeholder="+1 234 567 8900" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Disease / Condition</label>
                <input value={form.condition} onChange={set("condition")} placeholder="e.g., Hypertension, Diabetes" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Current Medications</label>
                <textarea rows={3} value={form.currentMedications} onChange={set("currentMedications")} placeholder="List your current medications..." className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Allergies</label>
                <input value={form.allergies} onChange={set("allergies")} placeholder="Any known allergies?" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Wake Time</label>
                  <input type="time" value={form.wakeTime} onChange={set("wakeTime")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Sleep Time</label>
                  <input type="time" value={form.sleepTime} onChange={set("sleepTime")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Breakfast</label>
                  <input type="time" value={form.breakfastTime} onChange={set("breakfastTime")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Lunch</label>
                  <input type="time" value={form.lunchTime} onChange={set("lunchTime")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Dinner</label>
                  <input type="time" value={form.dinnerTime} onChange={set("dinnerTime")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Activity Level</label>
                <select value={form.activityLevel} onChange={set("activityLevel")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                  <option>Sedentary</option><option>Light</option><option>Moderate</option><option>Active</option><option>Very Active</option>
                </select>
              </div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl bg-muted text-sm font-medium hover:bg-accent transition-colors">
                Back
              </button>
            )}
            {step < 2 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="flex-1 py-3 rounded-xl gradient-blue text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl gradient-blue text-primary-foreground text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account…" : "Create Account"}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </PageTransition>
  );
};

export default RegisterPage;
