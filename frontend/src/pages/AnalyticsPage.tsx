import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, LineChart, Line } from "recharts";

const adherenceData = [
  { week: "W1", rate: 78 }, { week: "W2", rate: 82 }, { week: "W3", rate: 85 },
  { week: "W4", rate: 79 }, { week: "W5", rate: 88 }, { week: "W6", rate: 92 },
];
const sleepData = [
  { day: "Mon", hours: 7.2 }, { day: "Tue", hours: 6.5 }, { day: "Wed", hours: 8.1 },
  { day: "Thu", hours: 7.0 }, { day: "Fri", hours: 6.8 }, { day: "Sat", hours: 8.5 }, { day: "Sun", hours: 7.8 },
];
const healthTrends = [
  { month: "Jan", bp: 135, sugar: 125 }, { month: "Feb", bp: 130, sugar: 118 },
  { month: "Mar", bp: 128, sugar: 112 }, { month: "Apr", bp: 125, sugar: 110 },
  { month: "May", bp: 122, sugar: 108 }, { month: "Jun", bp: 120, sugar: 105 },
];

const AnalyticsPage = () => (
  <PageTransition>
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Health Analytics</h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-sm mb-4">Medication Adherence</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={adherenceData}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="rate" fill="#0000FF" radius={[6, 6, 0, 0]} opacity={0.8} name="Adherence %" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-sm mb-4">Sleep Cycle</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sleepData}>
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0000FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0000FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="hours" stroke="#0000FF" fill="url(#sleepGrad)" strokeWidth={2} name="Hours" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-sm mb-4">Health Trends (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={healthTrends}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="bp" stroke="#0000FF" strokeWidth={2} dot={{ r: 4 }} name="Blood Pressure" />
              <Line type="monotone" dataKey="sugar" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} name="Blood Sugar" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  </PageTransition>
);

export default AnalyticsPage;
