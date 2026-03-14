import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity, Brain, CalendarClock, Smartphone, AlertTriangle,
  Bot, ShieldAlert, ArrowRight, Sparkles, Clock, Pill, ChevronRight
} from "lucide-react";
import { useEffect, useRef } from "react";

const features = [
  { icon: Brain, title: "Circadian Rhythm Analysis", desc: "AI analyzes your body clock for peak drug absorption windows." },
  { icon: CalendarClock, title: "Smart Scheduling", desc: "Automatically generate optimal medication timing based on your lifestyle." },
  { icon: Smartphone, title: "Wearable Integration", desc: "Connect fitness trackers for real-time health data integration." },
  { icon: AlertTriangle, title: "Drug Interaction Detection", desc: "Instant alerts when medications may conflict with each other." },
  { icon: Bot, title: "AI Health Assistant", desc: "Voice-powered assistant for medication queries and health insights." },
  { icon: ShieldAlert, title: "SOS Emergency System", desc: "One-tap emergency alerts with automatic health data sharing." },
];

const steps = [
  { num: "01", title: "Enter Health Data", desc: "Provide your lifestyle patterns, sleep schedule, and health conditions." },
  { num: "02", title: "Add Medications", desc: "Input your current medications with dosage and frequency details." },
  { num: "03", title: "AI Generates Schedule", desc: "Our chronobiology AI creates your optimal medication timeline." },
  { num: "04", title: "Get Smart Reminders", desc: "Receive personalized reminders and ongoing health insights." },
];

const FloatingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; o: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        o: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 255, ${p.o})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const LandingPage = () => (
  <div className="min-h-screen bg-background">
    {/* Navbar */}
    <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">MediClock</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Login
          </Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-medium gradient-blue text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
            Register
          </Link>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <FloatingParticles />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Chronobiology Platform
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black leading-tight mb-6">
            Smarter Medication Timing Using Your Body's{" "}
            <span className="gradient-text">Natural Clock</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered chronobiology platform that optimizes medication timing for maximum effectiveness.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 gradient-blue text-primary-foreground rounded-2xl font-semibold text-base flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-card border border-border rounded-2xl font-semibold text-base flex items-center gap-2"
              >
                <Clock className="w-4 h-4" /> Login
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Features */}
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Everything You Need for <span className="gradient-text">Smarter Health</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A comprehensive suite of tools designed around your body's natural rhythms.
          </p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp} className="glass-card-hover p-6 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* How It Works */}
    <section className="py-24 px-6 bg-accent/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg">Four simple steps to optimized medication timing</p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {steps.map((s) => (
            <motion.div key={s.num} variants={fadeUp} className="glass-card p-6 flex gap-5 items-start">
              <span className="text-3xl font-display font-black gradient-text">{s.num}</span>
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <div className="text-center mt-12">
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 gradient-blue text-primary-foreground rounded-2xl font-semibold inline-flex items-center gap-2"
            >
              <Pill className="w-5 h-5" /> Doctor Access <ChevronRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">MediClock</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 MediClock. Chronobiology-powered health platform.</p>
      </div>
    </footer>
  </div>
);

export default LandingPage;
