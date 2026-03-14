import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import StatCard from "@/components/StatCard";
import {
  Droplets, Heart, Activity, Flame, Moon, Pill,
  TrendingUp, Footprints, HeartPulse, Clock
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";

const circadianData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  cortisol: Math.sin((i - 6) * Math.PI / 12) * 50 + 50,
  melatonin: Math.sin((i - 18) * Math.PI / 12) * 50 + 50,
}));

const medicines = [
  { name: "Metformin 500mg", time: "8:00 AM", status: "taken", meal: "After Breakfast" },
  { name: "Lisinopril 10mg", time: "10:00 AM", status: "taken", meal: "With Water" },
  { name: "Atorvastatin 20mg", time: "2:00 PM", status: "pending", meal: "After Lunch" },
  { name: "Amlodipine 5mg", time: "9:00 PM", status: "missed", meal: "After Dinner" },
];

const statusBadge: Record<string, string> = {
  taken: "status-green",
  pending: "status-yellow",
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

const Dashboard = () => (
  <PageTransition>
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Blood Sugar" value="110" unit="mg/dL" icon={<Droplets className="w-5 h-5" />} trend="↓ 5%" status="green" />
        <StatCard title="Blood Pressure" value="128/82" icon={<Heart className="w-5 h-5" />} trend="Normal" status="green" />
        <StatCard title="Cholesterol" value="195" unit="mg/dL" icon={<Activity className="w-5 h-5" />} trend="↓ 3%" status="yellow" />
        <StatCard title="Hydration" value="2.1" unit="L" icon={<Droplets className="w-5 h-5" />} trend="Low" status="yellow" />
        <StatCard title="Calories" value="1,850" unit="kcal" icon={<Flame className="w-5 h-5" />} trend="On Track" status="green" />
        <StatCard title="Sleep" value="7.2" unit="hrs" icon={<Moon className="w-5 h-5" />} trend="Good" status="green" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circadian Chart */}
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

        {/* Medicine Schedule */}
        <motion.div variants={fadeUp} className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" /> Today's Medicine Schedule
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
