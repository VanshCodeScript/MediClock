import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Bell, Clock, MessageSquare, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrCreateCurrentUserId } from "@/lib/userSession";

const API_BASE = "http://localhost:5000/api";

interface ReminderItem {
  _id: string;
  medicineName: string;
  dosage: string;
  time: string;
  status: "pending" | "taken" | "missed";
}

const statusStyles: Record<string, string> = {
  taken: "status-green",
  pending: "status-yellow",
  missed: "status-red",
};

const ReminderPage = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = await getOrCreateCurrentUserId();
      const res = await fetch(`${API_BASE}/reminders/today/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch reminders");
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const markTaken = async (id: string) => {
    try {
      await fetch(`${API_BASE}/reminders/${id}/complete`, { method: "PATCH" });
      setReminders((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "taken" } : r))
      );
    } catch {
      // silent fail — UI already updated optimistically
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const pending = reminders.filter((r) => r.status === "pending").length;
  const total = reminders.length;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base">Today's Reminders</h3>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading…" : `${total} reminder${total !== 1 ? "s" : ""} · ${pending} pending`}
              </p>
            </div>
          </div>
          <button
            onClick={fetchReminders}
            className="p-2 rounded-xl bg-muted hover:bg-accent transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>

        {error && (
          <div className="glass-card p-4 border-l-4 border-red-400 bg-red-50/50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && reminders.length === 0 && !error && (
          <div className="glass-card p-6 text-center text-muted-foreground text-sm">
            No reminders today. Add a medication to get started.
          </div>
        )}

        {reminders.length > 0 && (
          <div className="relative ml-6 border-l-2 border-border pl-6 space-y-4">
            {reminders.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-4 relative"
              >
                <div className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-card border-2 border-primary" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">{r.time}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">WhatsApp</span>
                    </div>
                    <p className="text-sm font-medium">{r.medicineName} — {r.dosage}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === "pending" && (
                      <button
                        onClick={() => markTaken(r._id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                      >
                        Mark Taken
                      </button>
                    )}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusStyles[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default ReminderPage;
