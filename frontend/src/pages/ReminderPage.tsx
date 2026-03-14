import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Bell, Clock, Mail, MessageSquare, Smartphone } from "lucide-react";

const reminders = [
  { time: "7:45 AM", type: "15-min reminder", med: "Metformin 500mg", status: "sent", channel: "mobile" },
  { time: "8:00 AM", type: "Medicine time", med: "Metformin 500mg", status: "taken", channel: "mobile" },
  { time: "9:45 AM", type: "15-min reminder", med: "Lisinopril 10mg", status: "sent", channel: "email" },
  { time: "10:00 AM", type: "Medicine time", med: "Lisinopril 10mg", status: "taken", channel: "whatsapp" },
  { time: "1:45 PM", type: "15-min reminder", med: "Atorvastatin 20mg", status: "pending", channel: "mobile" },
  { time: "2:00 PM", type: "Medicine time", med: "Atorvastatin 20mg", status: "pending", channel: "mobile" },
  { time: "9:30 PM", type: "Missed alert", med: "Amlodipine 5mg", status: "missed", channel: "email" },
];

const channelIcons: Record<string, React.ReactNode> = {
  mobile: <Smartphone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
};

const statusStyles: Record<string, string> = {
  sent: "status-green",
  taken: "status-green",
  pending: "status-yellow",
  missed: "status-red",
};

const ReminderPage = () => (
  <PageTransition>
    <div className="max-w-3xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent"><Bell className="w-5 h-5 text-primary" /></div>
        <div>
          <h3 className="font-display font-semibold text-base">Today's Reminders</h3>
          <p className="text-sm text-muted-foreground">7 reminders scheduled · 2 pending</p>
        </div>
      </motion.div>

      <div className="relative ml-6 border-l-2 border-border pl-6 space-y-4">
        {reminders.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-hover p-4 relative"
          >
            <div className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-card border-2 border-primary" />
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">{r.time}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-medium">{r.type}</span>
                </div>
                <p className="text-sm font-medium">{r.med}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-muted text-muted-foreground">{channelIcons[r.channel]}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusStyles[r.status]}`}>{r.status}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </PageTransition>
);

export default ReminderPage;
