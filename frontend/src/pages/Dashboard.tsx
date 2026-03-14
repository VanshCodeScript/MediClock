import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import StatCard from "@/components/StatCard";
import {
  Droplets, Heart, Activity, Flame, Moon, Pill,
  TrendingUp, Footprints, HeartPulse, Clock, Brain, Bell, BedDouble, CheckCircle2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { useEffect, useState } from "react";

const circadianData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  cortisol: Math.sin((i - 6) * Math.PI / 12) * 50 + 50,
  melatonin: Math.sin((i - 18) * Math.PI / 12) * 50 + 50,
}));

const medicines = [
  { name: "Metformin 500mg", time: "8:00 AM", status: "taken", meal: "After Breakfast" },
  { name: "Vitamin D 1000IU", time: "1:00 PM", status: "taken", meal: "After Lunch" },
  { name: "Atorvastatin 20mg", time: "2:00 PM", status: "pending", meal: "After Lunch" },
  { name: "Amlodipine 5mg", time: "9:00 PM", status: "upcoming", meal: "After Dinner" },
];

const statusBadge: Record<string, string> = {
  taken: "status-green",
  pending: "status-yellow",
  upcoming: "bg-blue-50 text-blue-600 border-blue-200",
  missed: "status-red",
};

const weeklySteps = [
  { day: "Mon", steps: 8200 }, { day: "Tue", steps: 6500 },
  { day: "Wed", steps: 9800 }, { day: "Thu", steps: 7200 },
  { day: "Fri", steps: 11000 }, { day: "Sat", steps: 5600 },
  { day: "Sun", steps: 4200 },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

// Circadian Rhythm Clock Visualization
const CircadianClock = () => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.05) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const size = 280;
  const center = size / 2;
  const radius = 120;

  // Current hour marker
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentAngle = (currentHour / 24) * 360 - 90;

  // Medication markers
  const medMarkers = [
    { hour: 8, label: "Metformin", color: "#22C55E" },
    { hour: 13, label: "Vitamin D", color: "#FACC15" },
    { hour: 21, label: "Amlodipine", color: "#3B82F6" },
  ];

  // Sleep period (11PM - 7AM)
  const sleepStart = (23 / 24) * 360 - 90;
  const sleepEnd = (7 / 24) * 360 - 90;

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer ring */}
        <circle cx={center} cy={center} r={radius + 10} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />

        {/* Sleep arc */}
        <path d={describeArc(center, center, radius, sleepStart, sleepStart + 120)} fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="20" strokeLinecap="round" />

        {/* Active arc */}
        <path d={describeArc(center, center, radius, sleepEnd, sleepStart)} fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="20" strokeLinecap="round" />

        {/* Hour ticks */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * 360 - 90;
          const inner = polarToCartesian(center, center, radius - 14, angle);
          const outer = polarToCartesian(center, center, radius + (i % 6 === 0 ? 22 : 14), angle);
          return (
            <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={i % 6 === 0 ? "hsl(var(--foreground))" : "hsl(var(--border))"}
              strokeWidth={i % 6 === 0 ? 2 : 1} opacity={i % 6 === 0 ? 0.6 : 0.4} />
          );
        })}

        {/* Hour labels */}
        {[0, 6, 12, 18].map((h) => {
          const angle = (h / 24) * 360 - 90;
          const pos = polarToCartesian(center, center, radius + 32, angle);
          const label = h === 0 ? "12AM" : h === 6 ? "6AM" : h === 12 ? "12PM" : "6PM";
          return <text key={h} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill="hsl(var(--muted-foreground))" fontSize="10" fontWeight="600">{label}</text>;
        })}

        {/* Medication markers */}
        {medMarkers.map((med) => {
          const angle = (med.hour / 24) * 360 - 90;
          const pos = polarToCartesian(center, center, radius, angle);
          return (
            <g key={med.hour}>
              <circle cx={pos.x} cy={pos.y} r="10" fill={med.color} opacity="0.9" />
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="8" fontWeight="700">💊</text>
            </g>
          );
        })}

        {/* Current time indicator */}
        {(() => {
          const pos = polarToCartesian(center, center, radius - 30, currentAngle);
          return (
            <>
              <line x1={center} y1={center} x2={pos.x} y2={pos.y} stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={pos.x} cy={pos.y} r="4" fill="hsl(var(--primary))" />
            </>
          );
        })()}

        {/* Center circle */}
        <circle cx={center} cy={center} r="24" fill="hsl(var(--primary))" opacity="0.1" />
        <circle cx={center} cy={center} r="18" fill="hsl(var(--primary))" opacity="0.2" />
        <text x={center} y={center} textAnchor="middle" dominantBaseline="central" fill="hsl(var(--primary))" fontSize="9" fontWeight="800">24H</text>

        {/* Subtle rotation indicator ring */}
        <circle cx={center} cy={center} r={radius + 6} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 8"
          transform={`rotate(${rotation} ${center} ${center})`} opacity="0.3" />
      </svg>
    </div>
  );
};

const Dashboard = () => (
  <PageTransition>
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Top Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Circadian Health Score" value="87" unit="/100" icon={<Brain className="w-5 h-5" />} trend="↑ 12%" status="green" />
        <StatCard title="Next Medication" value="2:00 PM" icon={<Bell className="w-5 h-5" />} trend="Atorvastatin" status="yellow" />
        <StatCard title="Sleep Rhythm" value="7.5" unit="hrs" icon={<BedDouble className="w-5 h-5" />} trend="Good" status="green" />
        <StatCard title="Med Adherence" value="96" unit="%" icon={<CheckCircle2 className="w-5 h-5" />} trend="↑ 3%" status="green" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circadian Rhythm Clock Visualization */}
        <motion.div variants={fadeUp} className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Circadian Rhythm Clock
          </h3>
          <CircadianClock />
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-400/50 inline-block" /> Sleep Period</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400/30 inline-block" /> Active Period</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Medications</span>
          </div>
        </motion.div>

        {/* Medicine Schedule */}
        <motion.div variants={fadeUp} className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" /> Today's Medication Schedule
          </h3>
          <div className="space-y-3">
            {medicines.map((m) => (
              <div key={m.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <Clock className="w-4 h-4 text-muted-foreground mb-0.5" />
                    <span className="text-xs text-muted-foreground font-medium">{m.time}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.meal}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${statusBadge[m.status]}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Circadian Rhythm Chart */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <h3 className="font-display font-semibold text-base mb-4">Circadian Rhythm (24h)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={circadianData}>
            <defs>
              <linearGradient id="cortisol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0000FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0000FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="melatonin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={3} />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="cortisol" stroke="#0000FF" fill="url(#cortisol)" strokeWidth={2} name="Cortisol" />
            <Area type="monotone" dataKey="melatonin" stroke="#22C55E" fill="url(#melatonin)" strokeWidth={2} name="Melatonin" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Health Stats Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Blood Pressure" value="128/82" icon={<Heart className="w-5 h-5" />} trend="Normal" status="green" />
        <StatCard title="Blood Sugar" value="110" unit="mg/dL" icon={<Droplets className="w-5 h-5" />} trend="↓ 5%" status="green" />
        <StatCard title="Heart Rate" value="72" unit="bpm" icon={<HeartPulse className="w-5 h-5" />} trend="Normal" status="green" />
        <StatCard title="Sleep Quality" value="85" unit="%" icon={<Moon className="w-5 h-5" />} trend="Good" status="green" />
        <StatCard title="Calories" value="1,850" unit="kcal" icon={<Flame className="w-5 h-5" />} trend="On Track" status="green" />
      </motion.div>

      {/* Wearable data */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-accent">
            <Footprints className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Steps Today</p>
            <p className="text-2xl font-bold font-display">8,432</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl status-red border">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Heart Rate</p>
            <p className="text-2xl font-bold font-display">72 <span className="text-sm font-normal text-muted-foreground">bpm</span></p>
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-muted-foreground mb-3">Weekly Steps</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={weeklySteps}>
              <Bar dataKey="steps" fill="#0000FF" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  </PageTransition>
);

export default Dashboard;
