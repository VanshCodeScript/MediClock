import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { useState } from "react";

const steps = ["Personal Info", "Health Details", "Lifestyle"];

const RegisterPage = () => {
  const [step, setStep] = useState(0);

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

        <form className="glass-card p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                  <input placeholder="John Doe" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Age</label>
                  <input type="number" placeholder="28" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Gender</label>
                <select className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input type="email" placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone</label>
                <input placeholder="+1 234 567 8900" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Disease / Condition</label>
                <input placeholder="e.g., Hypertension, Diabetes" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Current Medications</label>
                <textarea rows={3} placeholder="List your current medications..." className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Allergies</label>
                <input placeholder="Any known allergies?" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Wake Time</label>
                  <input type="time" defaultValue="07:00" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Sleep Time</label>
                  <input type="time" defaultValue="23:00" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Breakfast</label>
                  <input type="time" defaultValue="08:00" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Lunch</label>
                  <input type="time" defaultValue="13:00" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Dinner</label>
                  <input type="time" defaultValue="19:00" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Activity Level</label>
                <select className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                  <option>Sedentary</option><option>Light</option><option>Moderate</option><option>Active</option><option>Very Active</option>
                </select>
              </div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl bg-muted text-sm font-medium hover:bg-accent transition-colors">
                Back
              </button>
            )}
            {step < 2 ? (
              <button onClick={() => setStep(step + 1)} className="flex-1 py-3 rounded-xl gradient-blue text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link to="/dashboard" className="flex-1">
                <button className="w-full py-3 rounded-xl gradient-blue text-primary-foreground text-sm font-medium">
                  Create Account
                </button>
              </Link>
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
