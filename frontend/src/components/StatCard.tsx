import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  trend?: string;
  status?: "green" | "yellow" | "red";
}

const statusColors = {
  green: "status-green",
  yellow: "status-yellow",
  red: "status-red",
};

const StatCard = ({ title, value, unit, icon, trend, status = "green" }: StatCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="glass-card-hover p-5"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${statusColors[status]}`}>{icon}</div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[status]}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-sm text-muted-foreground font-medium">{title}</p>
    <p className="text-2xl font-bold font-display mt-1">
      {value}
      {unit && <span className="text-sm text-muted-foreground ml-1 font-normal">{unit}</span>}
    </p>
  </motion.div>
);

export default StatCard;
