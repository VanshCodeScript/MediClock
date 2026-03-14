import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { AlertOctagon, Phone, MapPin, Heart, User } from "lucide-react";
import { useState } from "react";

const SOSPage = () => {
  const [triggered, setTriggered] = useState(false);

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        {!triggered ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className="text-muted-foreground mb-8 text-sm">Press the button below in case of emergency</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTriggered(true)}
              className="w-40 h-40 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center mx-auto shadow-2xl shadow-destructive/30"
            >
              <div className="text-center">
                <AlertOctagon className="w-12 h-12 mx-auto mb-2" />
                <span className="font-display font-bold text-lg">SOS</span>
              </div>
            </motion.button>
            <p className="text-xs text-muted-foreground mt-6">Emergency contacts and your doctor will be notified immediately</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">
            <div className="glass-card p-5 border-l-4 border-destructive">
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon className="w-5 h-5 text-destructive animate-pulse-soft" />
                <h3 className="font-display font-semibold text-destructive">Emergency Alert Sent</h3>
              </div>
              <p className="text-sm text-muted-foreground">All emergency contacts have been notified.</p>
            </div>
            {[
              { icon: Phone, label: "Emergency Contact Notified", desc: "Dr. Smith – +1 234 567 8900" },
              { icon: User, label: "Doctor Notification", desc: "Dr. Johnson has been alerted" },
              { icon: MapPin, label: "Location Shared", desc: "Current GPS location sent to contacts" },
              { icon: Heart, label: "Health Stats Sent", desc: "BP: 128/82, HR: 72, SpO2: 98%" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl status-green border"><item.icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setTriggered(false)} className="w-full py-3 rounded-xl bg-muted text-sm font-medium hover:bg-accent transition-colors">
              Cancel Emergency
            </motion.button>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default SOSPage;
