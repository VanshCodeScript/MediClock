import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Activity, CalendarClock, Eye, PhoneCall, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type PatientCard = {
  id: string;
  name: string;
  age?: number;
  condition?: string;
  lastConsultation: string;
  adherenceRate: number;
  takenCount: number;
  totalLogs: number;
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientCard | null>(null);

  useEffect(() => {
    const loadDoctorPatients = async () => {
      setLoading(true);

      try {
        const users = await api.users.getAll();
        if (!Array.isArray(users)) {
          setPatients([]);
          return;
        }

        const patientUsers = users.filter((u: any) => (u?.role || "user") !== "doctor");

        const cards = await Promise.all(
          patientUsers.map(async (patient: any) => {
            const [adherenceRate, sessions] = await Promise.all([
              api.medicationAdherence.getRate(patient._id).catch(() => null),
              api.videoSessions.getByUserId(patient._id).catch(() => []),
            ]);

            const latestSession = Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;
            const condition = Array.isArray(patient.healthConditions) ? patient.healthConditions[0] : undefined;
            const rateValue = Number(adherenceRate?.adherenceRate || 0);

            return {
              id: String(patient._id),
              name: String(patient.name || "Unknown patient"),
              age: patient.age,
              condition: condition || "Not provided",
              lastConsultation: latestSession?.scheduledTime
                ? new Date(latestSession.scheduledTime).toLocaleDateString()
                : "Not yet consulted",
              adherenceRate: Number.isFinite(rateValue) ? rateValue : 0,
              takenCount: Number(adherenceRate?.taken || 0),
              totalLogs: Number(adherenceRate?.total || 0),
            } as PatientCard;
          })
        );

        setPatients(cards);
      } finally {
        setLoading(false);
      }
    };

    loadDoctorPatients();
  }, []);

  const averageAdherence = useMemo(() => {
    if (!patients.length) {
      return 0;
    }

    const total = patients.reduce((sum, patient) => sum + patient.adherenceRate, 0);
    return Math.round(total / patients.length);
  }, [patients]);

  const openVideoConsultation = (patient: PatientCard) => {
    navigate("/doctor/video-call", {
      state: {
        calleeId: patient.id,
        calleeName: patient.name,
      },
    });
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Patients", value: String(patients.length), icon: Users, color: "bg-accent text-primary" },
            { label: "Avg Adherence", value: `${averageAdherence}%`, icon: TrendingUp, color: "status-green" },
            { label: "Logs Recorded", value: String(patients.reduce((sum, p) => sum + p.totalLogs, 0)), icon: Activity, color: "bg-accent text-primary" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl border ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold font-display">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedPatient && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="font-display font-semibold text-base mb-2">Patient Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {selectedPatient.name}</p>
              <p><span className="text-muted-foreground">Age:</span> {selectedPatient.age || "Not provided"}</p>
              <p><span className="text-muted-foreground">Condition:</span> {selectedPatient.condition || "Not provided"}</p>
              <p><span className="text-muted-foreground">Last Consultation:</span> {selectedPatient.lastConsultation}</p>
              <p><span className="text-muted-foreground">Adherence:</span> {selectedPatient.adherenceRate}%</p>
              <p><span className="text-muted-foreground">Medication Logs:</span> {selectedPatient.takenCount} taken of {selectedPatient.totalLogs}</p>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 space-y-4">
          <h3 className="font-display font-semibold text-base">Patient List And Logs</h3>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading patient records...</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No patients found yet.</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {patients.map((patient, index) => (
                <motion.div key={patient.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border border-border rounded-2xl p-4 bg-card/70 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-display font-semibold">{patient.name}</h4>
                      <p className="text-xs text-muted-foreground">Age: {patient.age || "Not provided"}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border status-green">
                      {patient.adherenceRate}% adherence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p><span className="text-muted-foreground">Condition:</span> {patient.condition}</p>
                    <p className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5 text-muted-foreground" /> {patient.lastConsultation}</p>
                    <p><span className="text-muted-foreground">Logs:</span> {patient.totalLogs}</p>
                    <p><span className="text-muted-foreground">Taken:</span> {patient.takenCount}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => setSelectedPatient(patient)} className="px-3 py-2 rounded-xl bg-muted text-sm font-medium hover:bg-accent transition-colors inline-flex items-center gap-1.5">
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button onClick={() => openVideoConsultation(patient)} className="px-3 py-2 rounded-xl gradient-blue text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4" /> Open Consultation
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DoctorDashboard;
