import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Activity, User, Stethoscope } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { useState } from "react";

const LoginPage = () => {
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  return (
    <PageTransition className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 gradient-blue items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary-foreground animate-float"
              style={{
                width: 60 + i * 30,
                height: 60 + i * 30,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-primary-foreground text-center">
          <Activity className="w-16 h-16 mx-auto mb-6" />
          <h2 className="font-display text-4xl font-bold mb-4">Welcome Back</h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Your personalized chronobiology-based medication schedule awaits.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">MediClock</span>
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">Sign In</h1>
          <p className="text-muted-foreground mb-8">Choose your role and log in to continue.</p>

          {/* Role toggle */}
          <div className="flex gap-3 mb-8">
            {[
              { key: "patient" as const, label: "Patient", icon: User },
              { key: "doctor" as const, label: "Doctor", icon: Stethoscope },
            ].map((r) => (
              <motion.button
                key={r.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => setRole(r.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                  role === r.key
                    ? "gradient-blue text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <r.icon className="w-4 h-4" />
                {r.label}
              </motion.button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <Link to={role === "doctor" ? "/doctor-dashboard" : "/dashboard"}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 gradient-blue text-primary-foreground rounded-xl font-semibold text-sm mt-2"
              >
                Sign In as {role === "doctor" ? "Doctor" : "Patient"}
              </motion.button>
            </Link>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default LoginPage;
