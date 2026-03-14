import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Settings, Moon, Clock, Pill, Bell, Smartphone, Save } from "lucide-react";

const SettingsPage = () => (
  <PageTransition>
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold text-lg">Settings</h2>
      </motion.div>

      {[
        { icon: Moon, title: "Sleep Schedule", fields: [
          { label: "Bedtime", type: "time", value: "23:00" },
          { label: "Wake Time", type: "time", value: "07:00" },
        ]},
        { icon: Clock, title: "Meal Schedule", fields: [
          { label: "Breakfast", type: "time", value: "08:00" },
          { label: "Lunch", type: "time", value: "13:00" },
          { label: "Dinner", type: "time", value: "19:00" },
        ]},
      ].map((section, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <section.icon className="w-4 h-4 text-primary" /> {section.title}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {section.fields.map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                <input type={f.type} defaultValue={f.value} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Notifications
        </h3>
        <div className="space-y-3">
          {["Medicine Reminders", "Health Insights", "Doctor Messages", "Emergency Alerts"].map((n) => (
            <div key={n} className="flex items-center justify-between py-2">
              <span className="text-sm">{n}</span>
              <label className="relative inline-flex cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-card after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
        <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" /> Connected Devices
        </h3>
        <div className="space-y-3">
          {[
            { name: "Apple Watch Series 9", status: "Connected" },
            { name: "Fitbit Charge 6", status: "Disconnected" },
          ].map((d) => (
            <div key={d.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm font-medium">{d.name}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${d.status === "Connected" ? "status-green" : "status-red"}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-3.5 gradient-blue text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> Save Settings
      </motion.button>
    </div>
  </PageTransition>
);

export default SettingsPage;
