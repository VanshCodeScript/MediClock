import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { AlertOctagon, Phone, MapPin, Heart, User, Shield, Loader2, CheckCircle, XCircle, History } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:5001/api";

interface SOSAlert {
  id: string;
  severity: string;
  message: string;
  status: string;
  resolved: boolean;
  triggeredAt: string;
  emergencyServicesNotified: boolean;
}

const SOSPage = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [sosResult, setSosResult] = useState<any>(null);
  const [twilioReady, setTwilioReady] = useState<boolean | null>(null);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/sos/status`)
      .then((r) => r.json())
      .then((data) => setTwilioReady(data.twilioConfigured))
      .catch(() => setTwilioReady(false));
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/sos/alerts?limit=10`);
      const data = await res.json();
      if (data.success) setAlerts(data.alerts);
    } catch {
      /* ignore */
    }
  };

  const handleTriggerSOS = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch(`${API_URL}/sos/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: "Patient",
          reason: "SOS button pressed",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setSosResult(data);
        fetchAlerts();
      } else {
        setStatus("error");
        setErrorMessage(data.message || "Failed to trigger SOS");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Network error – is the server running?");
    }
  };

  const handleCancel = () => {
    setStatus("idle");
    setErrorMessage("");
    setSosResult(null);
  };

  const handleToggleHistory = () => {
    if (!showHistory) fetchAlerts();
    setShowHistory(!showHistory);
  };

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        {/* Twilio status badge */}
        {twilioReady !== null && (
          <div className={`mb-4 flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${twilioReady ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            <Shield className="w-3 h-3" />
            {twilioReady ? "Emergency calls enabled" : "Emergency calls disabled – add Twilio credentials"}
          </div>
        )}

        {status === "idle" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className="text-muted-foreground mb-8 text-sm">Press the button below in case of emergency</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTriggerSOS}
              className="w-40 h-40 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center mx-auto shadow-2xl shadow-destructive/30"
            >
              <div className="text-center">
                <AlertOctagon className="w-12 h-12 mx-auto mb-2" />
                <span className="font-display font-bold text-lg">SOS</span>
              </div>
            </motion.button>
            <p className="text-xs text-muted-foreground mt-6">Emergency contacts and your doctor will be notified immediately</p>

            <button onClick={handleToggleHistory} className="mt-6 flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors">
              <History className="w-4 h-4" />
              {showHistory ? "Hide" : "View"} Alert History
            </button>
          </motion.div>
        )}

        {status === "loading" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-6 space-y-4">
            <Loader2 className="w-16 h-16 text-destructive animate-spin" />
            <p className="text-lg font-medium">Triggering Emergency SOS...</p>
            <p className="text-sm text-muted-foreground">Contacting emergency services...</p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">
            <div className="glass-card p-5 border-l-4 border-destructive">
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon className="w-5 h-5 text-destructive animate-pulse-soft" />
                <h3 className="font-display font-semibold text-destructive">Emergency Alert Sent</h3>
              </div>
              <p className="text-sm text-muted-foreground">{sosResult?.message}</p>
            </div>
            {[
              {
                icon: Phone,
                label: "Emergency Call",
                desc: sosResult?.callMade ? "✅ Call placed to caregiver" : "⚠️ Call not placed (Twilio not configured)",
                success: sosResult?.callMade,
              },
              {
                icon: User,
                label: "Contacts Notified",
                desc: `${sosResult?.contactsNotified || 0} emergency contact(s) notified`,
                success: (sosResult?.contactsNotified || 0) > 0,
              },
              {
                icon: MapPin,
                label: "Alert Logged",
                desc: `Alert ID: ${sosResult?.alertId?.slice(-8) || "N/A"}`,
                success: true,
              },
              {
                icon: Heart,
                label: "Status",
                desc: "Emergency services have been alerted",
                success: true,
              },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${item.success ? "status-green" : "bg-yellow-50 border-yellow-200"}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleCancel} className="w-full py-3 rounded-xl bg-muted text-sm font-medium hover:bg-accent transition-colors">
              Dismiss
            </motion.button>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h3 className="text-xl font-bold text-destructive">Failed to Trigger Alert</h3>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleTriggerSOS} className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">
                Try Again
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCancel} className="flex-1 py-3 rounded-xl bg-muted text-sm font-medium hover:bg-accent transition-colors">
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Alert History */}
        {showHistory && status === "idle" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-6 space-y-3">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Alerts
            </h3>
            {alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No alerts yet</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(alert.triggeredAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${alert.resolved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {alert.resolved ? "Resolved" : alert.status}
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default SOSPage;
