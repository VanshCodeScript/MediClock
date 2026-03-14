import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity, Brain, CalendarClock, Smartphone, AlertTriangle,
  Bot, ShieldAlert, ArrowRight, Clock, Pill, QrCode,
  Sun, Moon, Timer, Zap, Heart
} from "lucide-react";

const features = [
  { icon: Brain, title: "Circadian Rhythm Analysis", desc: "AI analyzes your body clock to find peak drug absorption windows and optimal timing." },
  { icon: CalendarClock, title: "Smart Medication Scheduling", desc: "Automatically generate optimal medication timing based on your lifestyle and biology." },
  { icon: AlertTriangle, title: "Drug Interaction Detection", desc: "Instant alerts when medications may conflict or require spacing adjustments." },
  { icon: Smartphone, title: "Wearable Integration", desc: "Connect fitness trackers and smartwatches for real-time health data integration." },
  { icon: Bot, title: "AI Health Assistant", desc: "Voice-powered assistant for medication queries, health insights, and reminders." },
  { icon: QrCode, title: "Emergency QR Health Card", desc: "Generate a scannable QR code with your complete medical profile for emergencies." },
];

const steps = [
  { num: "01", icon: Heart, title: "Enter Lifestyle & Health Data", desc: "Provide your sleep patterns, meal times, health conditions, and daily routines." },
  { num: "02", icon: Pill, title: "Add Your Medications", desc: "Input your current medications with dosage, frequency, and meal requirements." },
  { num: "03", icon: Zap, title: "AI Generates Optimal Schedule", desc: "Our chronobiology AI creates your personalized medication timeline for maximum effectiveness." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// SVG circadian clock illustration for hero
const CircadianClockSVG = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Outer ring */}
    <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
    <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

    {/* Sleep arc (10PM - 6AM) */}
    <path d="M 200 20 A 180 180 0 0 1 380 200" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="8" strokeLinecap="round" />

    {/* Active arc (6AM - 10PM) */}
    <path d="M 380 200 A 180 180 0 0 1 200 20" fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="8" strokeLinecap="round" />

    {/* Hour markers */}
    {Array.from({ length: 24 }, (_, i) => {
      const angle = (i * 15 - 90) * (Math.PI / 180);
      const x1 = 200 + 170 * Math.cos(angle);
      const y1 = 200 + 170 * Math.sin(angle);
      const x2 = 200 + (i % 6 === 0 ? 150 : 160) * Math.cos(angle);
      const y2 = 200 + (i % 6 === 0 ? 150 : 160) * Math.sin(angle);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth={i % 6 === 0 ? 2 : 1} />;
    })}

    {/* Hour labels */}
    {[0, 6, 12, 18].map((h) => {
      const angle = (h * 15 - 90) * (Math.PI / 180);
      const x = 200 + 140 * Math.cos(angle);
      const y = 200 + 140 * Math.sin(angle);
      const label = h === 0 ? "12AM" : h === 6 ? "6AM" : h === 12 ? "12PM" : "6PM";
      return <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.7)" fontSize="12" fontWeight="600">{label}</text>;
    })}

    {/* Medication markers */}
    {[
      { hour: 8, color: "#22C55E", label: "💊" },
      { hour: 13, color: "#FACC15", label: "💊" },
      { hour: 21, color: "#3B82F6", label: "💊" },
    ].map((med) => {
      const angle = (med.hour * 15 - 90) * (Math.PI / 180);
      const x = 200 + 120 * Math.cos(angle);
      const y = 200 + 120 * Math.sin(angle);
      return (
        <g key={med.hour}>
          <circle cx={x} cy={y} r="14" fill={med.color} opacity="0.9" />
          <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10">{med.label}</text>
        </g>
      );
    })}

    {/* Center */}
    <circle cx="200" cy="200" r="45" fill="rgba(0,0,255,0.3)" />
    <circle cx="200" cy="200" r="35" fill="rgba(0,0,255,0.5)" />
    <Sun x="188" y="188" width="24" height="24" className="text-white" />
    <text x="200" y="200" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="11" fontWeight="700">24H</text>

    {/* Sun/Moon icons at positions */}
    <g transform="translate(195,30)">
      <Moon size={14} className="text-purple-300" />
      <text x="5" y="0" textAnchor="middle" dominantBaseline="central" fill="rgba(196,181,253,0.9)" fontSize="16">🌙</text>
    </g>
    <g transform="translate(195,360)">
      <text x="5" y="0" textAnchor="middle" dominantBaseline="central" fill="rgba(253,224,71,0.9)" fontSize="16">☀️</text>
    </g>
  </svg>
);

const LandingPage = () => (
  <div className="min-h-screen bg-white">
    {/* Navbar - matches Doctr X template */}
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gray-900">MediClock</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">About</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Login
          </Link>
          <Link to="/register" className="px-6 py-2.5 text-sm font-medium bg-[#1a1a2e] text-white rounded-full hover:bg-[#16162a] transition-colors">
            Start Health Setup
          </Link>
        </div>
      </div>
    </nav>

    {/* Hero Section - Left text + Right visual, matching Doctr X template */}
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background curved shapes - matching template */}
      <div className="absolute top-0 right-0 w-[55%] h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-bl-[80px]" />
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-300 rounded-full opacity-60" />
        <div className="absolute bottom-0 -left-10 w-48 h-96 bg-cyan-400 rounded-tr-[60px] rounded-tl-[60px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side text block */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-4">Welcome to MediClock</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
            Optimize Your Medication With Your{" "}
            <span className="gradient-text">Body Clock</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mb-8 leading-relaxed">
            MediClock uses circadian biology to determine the best time to take your medications for maximum effectiveness.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(0,0,255,0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 gradient-blue text-white rounded-full font-semibold text-base flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Timer className="w-4 h-4" /> Start Health Setup
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-white border border-gray-200 rounded-full font-semibold text-base flex items-center gap-2 text-gray-700 hover:border-gray-300 transition-colors"
              >
                <Clock className="w-4 h-4" /> Login
              </motion.button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex items-center gap-8">
            <div>
              <p className="text-2xl font-bold font-display text-gray-900">10K+</p>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-2xl font-bold font-display text-gray-900">98%</p>
              <p className="text-sm text-gray-500">Adherence Rate</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-2xl font-bold font-display text-gray-900">4.9★</p>
              <p className="text-sm text-gray-500">User Rating</p>
            </div>
          </div>
        </motion.div>

        {/* Right side - Circadian clock visualization with curved background */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="relative flex items-center justify-center"
        >
          {/* Floating medicine icons */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 left-8 z-20 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Pill className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">8:00 AM</p>
                <p className="text-[10px] text-gray-500">Metformin</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-12 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <Moon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">9:00 PM</p>
                <p className="text-[10px] text-gray-500">Amlodipine</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-20 right-0 z-20 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sun className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">1:00 PM</p>
                <p className="text-[10px] text-gray-500">Vitamin D</p>
              </div>
            </div>
          </motion.div>

          {/* Main circadian clock */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96"
          >
            <CircadianClockSVG />
          </motion.div>
        </motion.div>
      </div>
    </section>

    {/* About Section - matching template's image+text layout */}
    <section id="about" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left side - visual with curved background */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-100 to-blue-50 p-8">
            {/* Curved shape behind */}
            <div className="absolute bottom-0 left-0 w-40 h-60 bg-cyan-300 rounded-tr-[60px] opacity-40" />
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-400 rounded-br-[40px] opacity-30" />

            {/* Content visual - health metrics preview */}
            <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Circadian Health Score</p>
                  <p className="text-xs text-gray-500">Updated just now</p>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold font-display text-gray-900">87</span>
                <span className="text-emerald-500 text-sm font-medium mb-1">↑ 12%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-[87%] gradient-blue rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">7.5h</p>
                  <p className="text-xs text-gray-500">Sleep</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">96%</p>
                  <p className="text-xs text-gray-500">Adherence</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating stat card */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 z-20"
          >
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold font-display text-primary">24h</p>
                <p className="text-xs text-gray-500">Rhythm Tracked</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold font-display text-emerald-500">98%</p>
                <p className="text-xs text-gray-500">On Time</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right side - text with feature list */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">About MediClock</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Your body's clock holds the key to better health
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            Chronobiology research shows that medication effectiveness varies by up to 50% depending on when you take it. MediClock harnesses this science to optimize your health outcomes.
          </p>

          <div className="space-y-6">
            {[
              { icon: Brain, title: "Circadian-Aware Scheduling", desc: "Medications timed to your body's natural hormone and enzyme cycles." },
              { icon: ShieldAlert, title: "Smart Safety Alerts", desc: "Real-time drug interaction detection and spacing recommendations." },
              { icon: Activity, title: "Continuous Monitoring", desc: "Track your health metrics and medication adherence around the clock." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 gradient-blue text-white rounded-full font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Timer className="w-4 h-4" /> Start Health Setup
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Features Section */}
    <section id="features" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Features</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-gray-900">
            Everything You Need for <span className="gradient-text">Smarter Health</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
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
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="bg-white rounded-2xl p-6 group cursor-pointer border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <f.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-gray-900">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* How It Works Section - Three horizontal cards */}
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">How It Works</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
          <p className="text-gray-500 text-lg">Three simple steps to optimized medication timing</p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((s) => (
            <motion.div
              key={s.num}
              variants={fadeUp}
              className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 text-center group"
            >
              <div className="w-16 h-16 rounded-full gradient-blue flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
                <s.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-4xl font-display font-black gradient-text">{s.num}</span>
              <h3 className="font-display font-semibold text-lg mt-3 mb-2 text-gray-900">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* CTA Section - Blue gradient matching template */}
    <section className="relative overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-bl-[80px] rounded-tl-[0px]">
        {/* Curved shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-400 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-400 rounded-full opacity-20 translate-x-1/4 translate-y-1/4" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Take control of your medication schedule today
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-lg leading-relaxed">
              Join thousands of users who have improved their medication effectiveness by timing doses with their body's natural rhythms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 bg-white text-blue-700 rounded-full font-semibold flex items-center gap-2 shadow-lg"
                >
                  Start Health Setup <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 border border-white/30 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  Login
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Right side rounded image card area */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Meds Optimized", value: "50K+", icon: Pill },
                  { label: "Health Score Avg", value: "87%", icon: Heart },
                  { label: "Interactions Found", value: "12K+", icon: AlertTriangle },
                  { label: "Reminders Sent", value: "1M+", icon: CalendarClock },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
                    <stat.icon className="w-6 h-6 text-cyan-300 mx-auto mb-2" />
                    <p className="text-2xl font-bold font-display text-white">{stat.value}</p>
                    <p className="text-xs text-blue-200">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="py-12 px-6 border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-gray-900">MediClock</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">How It Works</a>
          <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">About</a>
        </div>
        <p className="text-sm text-gray-500">© 2026 MediClock. Chronobiology-powered health platform.</p>
      </div>
    </footer>
  </div>
);

export default LandingPage;
