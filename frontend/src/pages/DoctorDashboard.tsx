import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Users, TrendingUp, AlertTriangle, Send, Eye } from "lucide-react";

const patients = [
  { name: "John Doe", disease: "Hypertension", adherence: 92, risk: "low" },
  { name: "Jane Smith", disease: "Type 2 Diabetes", adherence: 78, risk: "medium" },
  { name: "Bob Wilson", disease: "Heart Disease", adherence: 45, risk: "high" },
  { name: "Alice Brown", disease: "Asthma", adherence: 88, risk: "low" },
  { name: "Charlie Davis", disease: "Epilepsy", adherence: 65, risk: "medium" },
];

const riskBadge: Record<string, string> = { low: "status-green", medium: "status-yellow", high: "status-red" };

const DoctorDashboard = () => (
  <PageTransition>
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Patients", value: "127", icon: Users, color: "bg-accent text-primary" },
          { label: "Avg Adherence", value: "82%", icon: TrendingUp, color: "status-green" },
          { label: "High Risk", value: "8", icon: AlertTriangle, color: "status-red" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl border ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold font-display">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-display font-semibold text-base">Patient List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disease</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adherence</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium">{p.name}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{p.disease}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full gradient-blue" style={{ width: `${p.adherence}%` }} />
                      </div>
                      <span className="text-xs font-medium">{p.adherence}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${riskBadge[p.risk]}`}>{p.risk}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Send className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  </PageTransition>
);

export default DoctorDashboard;
