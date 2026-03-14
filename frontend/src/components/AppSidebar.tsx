import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, PlusCircle, AlertTriangle, CalendarClock, Bell,
  Lightbulb, Apple, User, Mic, AlertOctagon, QrCode, Video,
  BarChart3, Settings, ChevronLeft, ChevronRight, Activity, Brain
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Add Medication", path: "/add-medication", icon: PlusCircle },
  { label: "Drug Interaction", path: "/drug-interaction", icon: AlertTriangle },
  { label: "Schedule Generator", path: "/schedule", icon: CalendarClock },
  { label: "Chronobiology Scheduler", path: "/chronobiology-scheduler", icon: Brain },
  { label: "Reminders", path: "/reminders", icon: Bell },
  { label: "Health Suggestions", path: "/suggestions", icon: Lightbulb },
  { label: "Nutrition", path: "/nutrition", icon: Apple },
  { label: "3D Health", path: "/3d-health", icon: User },
  { label: "Voice Assistant", path: "/voice", icon: Mic },
  { label: "SOS", path: "/sos", icon: AlertOctagon },
  { label: "QR Health Card", path: "/qr-card", icon: QrCode },
  { label: "Video Call", path: "/video-call", icon: Video },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-card border-r border-border flex flex-col sticky top-0 z-30 overflow-hidden"
    >
      <div className="p-4 flex items-center gap-3 border-b border-border min-h-[64px]">
        <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display font-bold text-lg whitespace-nowrap"
          >
            MediClock
          </motion.span>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-4 border-t border-border flex items-center justify-center hover:bg-accent/50 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
};

export default AppSidebar;
