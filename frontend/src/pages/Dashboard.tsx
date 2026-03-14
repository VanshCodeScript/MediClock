import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import StatCard from "@/components/StatCard";
import {
  Droplets,
  Heart,
  Moon,
  Pill,
  HeartPulse,
  Clock,
  Brain,
  Bell,
  BedDouble,
  CheckCircle2,
  Loader2,
  Activity,
  Sunrise,
  Sunset,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { getOrCreateCurrentUserId } from "@/lib/userSession";

type TimelineReminder = {
  medicationName: string;
  dosage?: string;
  medicationTime: string;
  reminderTime: string;
  displayMedicationTime: string;
  displayReminderTime: string;
  status: "pending" | "due" | "sent" | "missed" | "failed";
};

type CircadianProfile = {
  wakeTime: string;
  sleepTime: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  chronotype?: string;
};

type DashboardData = {
  timeline: TimelineReminder[];
  healthLatest: any;
  adherenceRate: number;
  sleepAverageHours: number;
  sleepSeries: { day: string; value: number }[];
  caloriesToday: number | null;
  profile: CircadianProfile;
};

type HoverInfo = {
  title: string;
  time: string;
  category: "biological" | "profile" | "medication";
  detail: string;
};

const DEFAULT_PROFILE: CircadianProfile = {
  wakeTime: "07:00",
  sleepTime: "23:00",
  breakfastTime: "08:00",
  lunchTime: "13:00",
  dinnerTime: "20:00",
  chronotype: "intermediate",
};

const parseTime = (t: string) => {
  const [h, m] = String(t || "00:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const format12h = (time: string) => {
  const [h, m] = String(time || "00:00").split(":").map(Number);
  const hour = Number.isFinite(h) ? h : 0;
  const minute = Number.isFinite(m) ? m : 0;
  const period = hour >= 12 ? "PM" : "AM";
  const hh = hour % 12 === 0 ? 12 : hour % 12;
  return `${hh}:${String(minute).padStart(2, "0")} ${period}`;
};

const toHourLabel = (i: number) => `${String(i).padStart(2, "0")}:00`;

const gaussian = (x: number, mean: number, sigma: number) => Math.exp(-((x - mean) ** 2) / (2 * sigma * sigma));

const generateHormoneSeries = (profile: CircadianProfile) => {
  const wakeHr = parseTime(profile.wakeTime) / 60;
  const sleepHr = parseTime(profile.sleepTime) / 60;
  const cortisolPeak = (wakeHr + 1) % 24;
  const melatoninPeak = (sleepHr + 2) % 24;

  return Array.from({ length: 24 }, (_, i) => {
    const x = i;
    const cortisol = 18 + 82 * gaussian(x, cortisolPeak, 3.2);
    const melatonin = 15 + 85 * gaussian(x, melatoninPeak, 3.5);
    return {
      hour: toHourLabel(i),
      cortisol: Math.round(Math.max(0, Math.min(100, cortisol))),
      melatonin: Math.round(Math.max(0, Math.min(100, melatonin))),
    };
  });
};

const statusBadge: Record<string, string> = {
  sent: "status-green",
  due: "status-yellow",
  pending: "status-yellow",
  missed: "status-red",
  failed: "status-red",
};

const riskFromThreshold = (value: number, low: number, high: number): "green" | "yellow" | "red" => {
  if (!Number.isFinite(value)) return "yellow";
  if (value < low || value > high) return "red";
  if (value < low + 2 || value > high - 2) return "yellow";
  return "green";
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const CircadianWheel = ({
  profile,
  reminders,
}: {
  profile: CircadianProfile;
  reminders: TimelineReminder[];
}) => {
  const size = 620;
  const viewPadding = 110;
  const center = size / 2;
  const radius = 166;

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentAngle = (currentHour / 24) * 360 - 90;
  const [hovered, setHovered] = useState<HoverInfo | null>(null);

  const polar = (r: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };

  const eventNodes = [
    { time: "21:00", label: "Melatonin starts", icon: "🌙", category: "biological" as const, detail: "Body prepares for sleep onset." },
    { time: "02:00", label: "Deepest sleep", icon: "🛌", category: "biological" as const, detail: "Peak restorative slow-wave sleep window." },
    { time: "04:30", label: "Lowest temp", icon: "🌡️", category: "biological" as const, detail: "Core body temperature reaches daily minimum." },
    { time: "06:45", label: "BP surge", icon: "❤️", category: "biological" as const, detail: "Morning cardiovascular activation period." },
    { time: "07:30", label: "Melatonin stops", icon: "🧠", category: "biological" as const, detail: "Wake signaling becomes dominant." },
    { time: "10:00", label: "Highest alertness", icon: "💡", category: "biological" as const, detail: "Cognitive alertness is typically strongest." },
    { time: "14:30", label: "Best coordination", icon: "🎯", category: "biological" as const, detail: "Neuromotor coordination often improves." },
    { time: "15:30", label: "Fastest reaction", icon: "⏱️", category: "biological" as const, detail: "Reaction speed usually peaks." },
    { time: "17:00", label: "Best performance", icon: "💪", category: "biological" as const, detail: "Muscular performance trend high." },
    { time: "18:30", label: "Highest BP", icon: "🫀", category: "biological" as const, detail: "Blood pressure tends to be elevated." },
    { time: "19:00", label: "Highest temp", icon: "🌡️", category: "biological" as const, detail: "Core body temperature reaches daily maximum." },
  ];

  const profileNodes = [
    { time: profile.wakeTime, label: "Wake", icon: <Sunrise className="w-3.5 h-3.5" />, category: "profile" as const, detail: "Configured wake time from circadian profile." },
    { time: profile.sleepTime, label: "Sleep", icon: <Sunset className="w-3.5 h-3.5" />, category: "profile" as const, detail: "Configured sleep time from circadian profile." },
    { time: profile.breakfastTime, label: "Breakfast", icon: "🍳", category: "profile" as const, detail: "Meal anchor used for timing recommendations." },
    { time: profile.lunchTime, label: "Lunch", icon: "🍽️", category: "profile" as const, detail: "Meal anchor used for daytime dosing windows." },
    { time: profile.dinnerTime, label: "Dinner", icon: "🥗", category: "profile" as const, detail: "Meal anchor used for evening dosing windows." },
  ];

  const medicationNodes = reminders.slice(0, 4).map((r) => ({
    time: r.medicationTime,
    label: r.medicationName.length > 14 ? `${r.medicationName.slice(0, 12)}..` : r.medicationName,
    icon: "💊",
    category: "medication" as const,
    detail: `${r.medicationName}${r.dosage ? ` ${r.dosage}` : ""} scheduled at ${r.displayMedicationTime}`,
  }));

  const circularMinuteDiff = (a: string, b: string) => {
    const da = parseTime(a);
    const db = parseTime(b);
    const diff = Math.abs(da - db);
    return Math.min(diff, 1440 - diff);
  };

  // Keep biological labels readable by skipping event labels that sit too close to profile labels.
  const visibleEventNodes = eventNodes.filter(
    (e) => !profileNodes.some((p) => circularMinuteDiff(e.time, p.time) <= 45)
  );

  type WheelNode = {
    time: string;
    label: string;
    icon: ReactNode;
    category: "biological" | "profile" | "medication";
    detail: string;
  };

  type PlacedNode = WheelNode & {
    angle: number;
    iconRadius: number;
    tangentShift: number;
    timeDy: number;
    labelDy: number;
  };

  const placeNodes = (
    nodes: WheelNode[],
    baseRadius: number,
    minGapDeg: number,
    radialStep: number,
    tangentStep: number
  ): PlacedNode[] => {
    const sorted = [...nodes]
      .map((n) => ({ ...n, angle: ((parseTime(n.time) / 1440) * 360 - 90 + 360) % 360 }))
      .sort((a, b) => a.angle - b.angle);

    let prevAngle: number | null = null;
    let clusterIndex = 0;

    const placed = sorted.map((n) => {
      const gap = prevAngle == null ? Number.POSITIVE_INFINITY : n.angle - prevAngle;
      clusterIndex = gap < minGapDeg ? clusterIndex + 1 : 0;
      prevAngle = n.angle;

      const step = Math.min(clusterIndex, 4);
      const direction = step % 2 === 0 ? 1 : -1;
      const ringTier = step === 0 ? 0 : Math.floor((step + 1) / 2);
      const tangentShift = step === 0 ? 0 : direction * (tangentStep * ringTier);
      const iconRadius = baseRadius + ringTier * radialStep;

      return {
        ...n,
        iconRadius,
        tangentShift,
        timeDy: 30 + ringTier * 4,
        labelDy: 44 + ringTier * 5,
      };
    });

    if (placed.length > 1) {
      const first = placed[0];
      const last = placed[placed.length - 1];
      const wrapGap = first.angle + 360 - last.angle;
      if (wrapGap < minGapDeg) {
        first.iconRadius += radialStep;
        first.tangentShift += tangentStep;
        first.timeDy += 4;
        first.labelDy += 5;
      }
    }

    return placed;
  };

  const eventPlaced = placeNodes(visibleEventNodes, radius + 95, 14, 14, 11);
  const profilePlaced = placeNodes(profileNodes, radius + 64, 30, 24, 16);
  const medicationPlaced = placeNodes(medicationNodes, radius + 28, 20, 14, 10);

  const node = (
    n: PlacedNode,
    colorClass: string,
    textClass = "text-muted-foreground",
    options?: { compact?: boolean; hideTime?: boolean; hideLabel?: boolean }
  ) => {
    const rad = (n.angle * Math.PI) / 180;
    const p0 = polar(n.iconRadius, n.angle);
    const tx = -Math.sin(rad);
    const ty = Math.cos(rad);
    const p = {
      x: p0.x + tx * n.tangentShift,
      y: p0.y + ty * n.tangentShift,
    };

    const compact = Boolean(options?.compact);
    const hideTime = Boolean(options?.hideTime);
    const hideLabel = Boolean(options?.hideLabel);
    const ux = (p.x - center) / Math.max(1, n.iconRadius);
    const uy = (p.y - center) / Math.max(1, n.iconRadius);
    const textOffset = compact ? 28 : 34;
    const textX = p.x + ux * textOffset;
    const textY = p.y + uy * textOffset;
    const anchor: "start" | "end" | "middle" = Math.abs(ux) < 0.3 ? "middle" : ux > 0 ? "start" : "end";
    const lineGap = compact ? 12 : 14;
    const topZone = uy < -0.35;
    const timeY = topZone ? textY - lineGap : textY;
    const labelY = topZone ? textY : textY + lineGap;
    const timeFont = compact ? "text-[13px]" : "text-[14px]";
    const labelFont = compact ? "text-[13px]" : "text-[14px]";

    return (
      <g
        key={`${n.label}-${n.time}`}
        className="cursor-pointer"
        onMouseEnter={() =>
          setHovered({
            title: n.label,
            time: n.time,
            category: n.category,
            detail: n.detail,
          })
        }
        onMouseLeave={() => setHovered(null)}
      >
        <title>{`${n.label} (${n.time}) - ${n.detail}`}</title>
        <foreignObject x={p.x - 20} y={p.y - 20} width="40" height="40">
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center bg-white ${colorClass}`}>
            {typeof n.icon === "string" ? <span className="text-base">{n.icon}</span> : n.icon}
          </div>
        </foreignObject>
        {!hideTime && (
          <text
            x={textX}
            y={timeY}
            textAnchor={anchor}
            className={`${timeFont} font-semibold ${textClass}`}
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {n.time}
          </text>
        )}
        {!hideLabel && (
          <text
            x={textX}
            y={hideTime ? textY : labelY}
            textAnchor={anchor}
            className={`${labelFont} font-medium ${textClass}`}
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {n.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <motion.div
      className="flex flex-col xl:flex-row items-stretch xl:items-center justify-center gap-4 overflow-x-auto py-4"
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox={`${-viewPadding} ${-viewPadding} ${size + viewPadding * 2} ${size + viewPadding * 2}`}
        className="w-full max-w-[980px] h-auto overflow-visible"
        animate={{ scale: [1, 1.01, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx={center} cy={center} r={radius + 92} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
        <circle cx={center} cy={center} r={radius + 28} fill="none" stroke="rgba(14,116,144,0.20)" strokeWidth="34" strokeLinecap="round" />
        <circle cx={center} cy={center} r={radius + 10} fill="none" stroke="rgba(56,189,248,0.10)" strokeWidth="10" />
        <circle
          cx={center}
          cy={center}
          r={radius + 44}
          fill="none"
          stroke="rgba(14,116,144,0.18)"
          strokeWidth="1.4"
          strokeDasharray="4 10"
        >
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from={`0 ${center} ${center}`}
            to={`360 ${center} ${center}`}
            dur="42s"
            repeatCount="indefinite"
          />
        </circle>

        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * 360 - 90;
          const a = polar(radius + 8, angle);
          const b = polar(radius + (i % 6 === 0 ? 18 : 12), angle);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--muted-foreground))" opacity={i % 6 === 0 ? 0.6 : 0.25} />;
        })}

        {[0, 6, 12, 18].map((h) => {
          const angle = (h / 24) * 360 - 90;
          const p = polar(radius + 42, angle);
          const label = h === 0 ? "MIDNIGHT" : h === 12 ? "NOON" : `${h}:00`;
          return (
            <text
              key={h}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              className="text-[18px] font-semibold fill-slate-600"
              stroke="rgba(255,255,255,0.92)"
              strokeWidth="3"
              paintOrder="stroke"
            >
              {label}
            </text>
          );
        })}

        <circle cx={center} cy={center} r="112" fill="rgba(14,116,144,0.05)" stroke="rgba(14,116,144,0.2)" />
        <text x={center} y={center - 12} textAnchor="middle" className="text-[42px] font-bold fill-sky-900">CIRCADIAN</text>
        <text x={center} y={center + 34} textAnchor="middle" className="text-[42px] font-bold fill-sky-900">RHYTHM</text>

        <line x1={center} y1={center} x2={polar(radius - 10, currentAngle).x} y2={polar(radius - 10, currentAngle).y} stroke="#0369a1" strokeWidth="2.8">
          <animate attributeName="opacity" values="0.9;1;0.9" dur="2.4s" repeatCount="indefinite" />
        </line>
        <circle cx={polar(radius - 10, currentAngle).x} cy={polar(radius - 10, currentAngle).y} r="5" fill="#0369a1">
          <animate attributeName="r" values="4.2;5.6;4.2" dur="2.4s" repeatCount="indefinite" />
        </circle>

        {eventPlaced.map((e) => node(e, "border-sky-100", "fill-slate-600"))}
        {profilePlaced.map((e) => node(e, "border-emerald-200 bg-emerald-50", "fill-emerald-700", { compact: false }))}
        {medicationPlaced.map((e) => node(e, "border-indigo-200 bg-indigo-50", "fill-indigo-700", { compact: true, hideTime: true, hideLabel: true }))}
      </motion.svg>

      <div className="w-full xl:w-[320px] xl:min-w-[320px] xl:self-center">
        <div className="rounded-xl border bg-white/70 backdrop-blur-sm px-4 py-3 text-sm h-full">
          {hovered ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-slate-800">{hovered.title}</span>
              <span className="text-slate-600">{hovered.time}</span>
              <span className="uppercase tracking-wide text-[11px] font-semibold text-slate-500">{hovered.category}</span>
              <span className="text-slate-700">{hovered.detail}</span>
            </div>
          ) : (
            <span className="text-slate-600">Hover over any clock marker to view details here.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    timeline: [],
    healthLatest: null,
    adherenceRate: 0,
    sleepAverageHours: 0,
    sleepSeries: [],
    caloriesToday: null,
    profile: DEFAULT_PROFILE,
  });

  const fetchDashboard = async () => {
    const uid = await getOrCreateCurrentUserId();
    const today = new Date().toISOString().slice(0, 10);

    const [timelineRes, healthLatest, adherenceRateRes, sleepAnalytics, sleepWeek, mealSummary, profileRes] =
      await Promise.all([
        api.reminders.getTimeline(uid),
        api.healthMetrics.getLatest(uid),
        api.medicationAdherence.getRate(uid),
        api.sleep.getAnalytics(uid),
        api.sleep.getByUserId(uid),
        api.meals.getSummary(uid, today),
        api.circadianProfile.getByUserId(uid).catch(() => null),
      ]);

    const timeline = Array.isArray(timelineRes?.timeline) ? timelineRes.timeline : [];
    const sleepRows = Array.isArray(sleepWeek) ? sleepWeek.slice(0, 7).reverse() : [];
    const sleepSeries = sleepRows.map((s: any) => ({
      day: new Date(s.date).toLocaleDateString("en-US", { weekday: "short" }),
      value: Number(s.hours || 0),
    }));

    setData({
      timeline,
      healthLatest,
      adherenceRate: Number(adherenceRateRes?.adherenceRate || 0),
      sleepAverageHours: Number(sleepAnalytics?.averageHours || 0),
      sleepSeries,
      caloriesToday:
        typeof mealSummary?.totalCalories === "number"
          ? mealSummary.totalCalories
          : typeof mealSummary?.calories === "number"
            ? mealSummary.calories
            : null,
      profile: profileRes || DEFAULT_PROFILE,
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchDashboard();
      } catch (e: any) {
        setError(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const hormoneData = generateHormoneSeries(data.profile);
  const nextMedication = data.timeline
    .filter((r) => r.status === "pending" || r.status === "due")
    .sort((a, b) => parseTime(a.medicationTime) - parseTime(b.medicationTime))[0];

  const bpSys = Number(data.healthLatest?.bloodPressure?.systolic || 0);
  const bpDia = Number(data.healthLatest?.bloodPressure?.diastolic || 0);
  const sugar = Number(data.healthLatest?.bloodSugar?.value || 0);
  const heartRate = Number(data.healthLatest?.heartRate || 0);
  const spO2 = Number(data.healthLatest?.spO2 || 0);

  const circadianScore = Math.round(
    Math.min(
      100,
      Math.max(
        40,
        data.adherenceRate * 0.55 +
          Math.min(100, (data.sleepAverageHours / 8) * 100) * 0.25 +
          (nextMedication ? 10 : 20)
      )
    )
  );

  return (
    <PageTransition>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {error && <div className="glass-card p-4 border-l-4 border-red-400 text-sm text-red-700 bg-red-50/40">{error}</div>}
        {loading && (
          <div className="glass-card p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading dashboard from DB models...
          </div>
        )}

      {/* Top Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Circadian Health Score"
          value={String(circadianScore)}
          unit="/100"
          icon={<Brain className="w-5 h-5" />}
          trend={data.profile.chronotype || "intermediate"}
          status={riskFromThreshold(circadianScore, 70, 100)}
        />
        <StatCard
          title="Next Medication"
          value={nextMedication ? format12h(nextMedication.medicationTime) : "-"}
          icon={<Bell className="w-5 h-5" />}
          trend={nextMedication ? nextMedication.medicationName : "No pending dose"}
          status={nextMedication ? "yellow" : "green"}
        />
        <StatCard
          title="Sleep Rhythm"
          value={data.sleepAverageHours ? data.sleepAverageHours.toFixed(1) : "0.0"}
          unit="hrs"
          icon={<BedDouble className="w-5 h-5" />}
          trend={`${format12h(data.profile.wakeTime)} wake`}
          status={riskFromThreshold(data.sleepAverageHours, 6.5, 9)}
        />
        <StatCard
          title="Med Adherence"
          value={data.adherenceRate ? data.adherenceRate.toFixed(1) : "0.0"}
          unit="%"
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={`${data.timeline.filter((r) => r.status === "sent").length} sent reminders`}
          status={riskFromThreshold(data.adherenceRate, 75, 100)}
        />
      </motion.div>

      {/* Circadian Rhythm Wheel Visualization */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Circadian Rhythm Wheel
        </h3>
        <CircadianWheel profile={data.profile} reminders={data.timeline} />
        <div className="flex flex-wrap items-center justify-center gap-5 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-sky-100 border border-sky-200 inline-block" /> Biological events</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-200 inline-block" /> Profile timings</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-50 border border-indigo-200 inline-block" /> Medication doses</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Medicine Schedule */}
        <motion.div variants={fadeUp} className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" /> Today's Medication Schedule
          </h3>
          <div className="space-y-3">
            {data.timeline.length === 0 && <div className="text-sm text-muted-foreground">No medication reminders available.</div>}
            {data.timeline.map((m) => (
              <div key={`${m.medicationName}-${m.medicationTime}-${m.reminderTime}`} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <Clock className="w-4 h-4 text-muted-foreground mb-0.5" />
                    <span className="text-xs text-muted-foreground font-medium">{m.displayMedicationTime}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.medicationName} {m.dosage || ""}</p>
                    <p className="text-xs text-muted-foreground">Reminder at {m.displayReminderTime}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${statusBadge[m.status] || "status-yellow"}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Circadian Rhythm Chart */}
        <motion.div variants={fadeUp} className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Circadian Rhythm (24h)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={hormoneData}>
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
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="cortisol" stroke="#0000FF" fill="url(#cortisol)" strokeWidth={2} name="Cortisol" />
              <Area type="monotone" dataKey="melatonin" stroke="#22C55E" fill="url(#melatonin)" strokeWidth={2} name="Melatonin" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Health Stats Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Blood Pressure"
          value={bpSys && bpDia ? `${bpSys}/${bpDia}` : "-"}
          icon={<Heart className="w-5 h-5" />}
          trend="HealthMetrics model"
          status={riskFromThreshold(bpSys || 0, 90, 135)}
        />
        <StatCard
          title="Blood Sugar"
          value={sugar ? String(sugar) : "-"}
          unit={data.healthLatest?.bloodSugar?.unit || "mg/dL"}
          icon={<Droplets className="w-5 h-5" />}
          trend="HealthMetrics model"
          status={riskFromThreshold(sugar || 0, 75, 140)}
        />
        <StatCard
          title="Heart Rate"
          value={heartRate ? String(heartRate) : "-"}
          unit="bpm"
          icon={<HeartPulse className="w-5 h-5" />}
          trend="HealthMetrics model"
          status={riskFromThreshold(heartRate || 0, 55, 105)}
        />
        <StatCard
          title="Sleep Quality"
          value={data.sleepAverageHours ? Math.round((data.sleepAverageHours / 8) * 100).toString() : "0"}
          unit="%"
          icon={<Moon className="w-5 h-5" />}
          trend="SleepData model"
          status={riskFromThreshold(data.sleepAverageHours, 6.5, 9)}
        />
        <StatCard
          title="Calories"
          value={typeof data.caloriesToday === "number" ? data.caloriesToday.toLocaleString() : "-"}
          unit="kcal"
          icon={<Activity className="w-5 h-5" />}
          trend="Meals model"
          status={typeof data.caloriesToday === "number" ? "green" : "yellow"}
        />
      </motion.div>

      {/* DB-Driven Trend Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-accent">
            <Pill className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Today's Doses</p>
            <p className="text-2xl font-bold font-display">{data.timeline.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-accent border">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">SpO2</p>
            <p className="text-2xl font-bold font-display">{spO2 ? `${spO2}%` : "-"}</p>
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-muted-foreground mb-3">Weekly Sleep Hours</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={data.sleepSeries}>
              <XAxis dataKey="day" hide />
              <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      </motion.div>
    </PageTransition>
  );
};

export default Dashboard;
