import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { QrCode, Download, User, Pill, Phone, AlertTriangle, Heart, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getOrCreateCurrentUserId } from "@/lib/userSession";

interface PatientRecord {
  _id?: string;
  name?: string;
  age?: number;
  gender?: string;
  bloodType?: string;
  diseases?: string[];
  phone?: string;
  email?: string;
}

interface MedicationData {
  _id?: string;
  name?: string;
  dosage?: string;
  frequency?: string;
}

interface HealthMetricsData {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
}

interface SleepData {
  duration?: number;
  quality?: string;
}

interface CircadianProfileData {
  chronotype?: string;
  wakeTime?: string;
  sleepTime?: string;
}

interface EmergencyContactData {
  name?: string;
  phone?: string;
  relationship?: string;
}

const QRCardPage = () => {
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [medications, setMedications] = useState<MedicationData[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetricsData | null>(null);
  const [sleepData, setSleepData] = useState<SleepData | null>(null);
  const [circadianProfile, setCircadianProfile] = useState<CircadianProfileData | null>(null);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrPayload, setQrPayload] = useState<{ _id: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userId = await getOrCreateCurrentUserId();
        
        // Fetch all user-related data in parallel
        const [userRes, medsRes, metricsRes, sleepRes, circadianRes, contactsRes] = await Promise.all([
          api.users.getById(userId),
          api.medications.getByUserId(userId),
          api.healthMetrics.getLatest(userId),
          api.sleep.getAnalytics(userId),
          api.circadianProfile.getByUserId(userId),
          api.emergencyContacts.getPrimary(userId),
        ]);

        setPatient(userRes);
        setMedications(Array.isArray(medsRes) ? medsRes : []);
        setHealthMetrics(metricsRes || null);
        setSleepData(sleepRes || null);
        setCircadianProfile(circadianRes || null);
        setEmergencyContact(contactsRes || null);
        
        // QR payload contains only the user ID
        setQrPayload({ _id: userId });
      } catch (err) {
        console.error("Error fetching user data for QR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading your health QR card...</p>
        </div>
      </PageTransition>
    );
  }

  const patientData = {
    name: patient?.name || "Patient",
    age: patient?.age,
    bloodType: patient?.bloodType,
    diseases: patient?.diseases || [],
    medications: medications.map(m => `${m.name || ""}${m.dosage ? ` ${m.dosage}` : ""}`).filter(Boolean),
    phone: patient?.phone,
    emergencyContact: emergencyContact?.name || "Not set",
    doctorPhone: emergencyContact?.phone || "Not set",
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
          <QrCode className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="font-display font-bold text-xl mb-2">Your Health QR Card</h2>
          <p className="text-sm text-muted-foreground mb-6">Scan to access your health information</p>
          <div className="inline-block p-4 bg-card rounded-2xl border border-border">
            {qrPayload && <QRCodeSVG value={JSON.stringify(qrPayload)} size={180} level="M" />}
          </div>
          <div className="mt-4">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="px-6 py-2.5 gradient-blue text-primary-foreground rounded-xl text-sm font-medium inline-flex items-center gap-2">
              <Download className="w-4 h-4" /> Download QR
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4">Health Card Preview</h3>
          <div className="space-y-4">
            {[
              { icon: User, label: "Patient", value: `${patientData.name}${patientData.age ? `, ${patientData.age}y` : ""}${patientData.bloodType ? `, ${patientData.bloodType}` : ""}` },
              { icon: AlertTriangle, label: "Conditions", value: patientData.diseases?.length ? patientData.diseases.join(", ") : "None reported" },
              { icon: Pill, label: "Medications", value: patientData.medications?.length ? patientData.medications.join(", ") : "None" },
              { icon: Heart, label: "Latest Vitals", value: healthMetrics ? `BP: ${healthMetrics.bloodPressure || "N/A"}, HR: ${healthMetrics.heartRate || "N/A"} bpm` : "Not available" },
              { icon: Clock, label: "Sleep Pattern", value: circadianProfile ? `${circadianProfile.chronotype || "Standard"} - Sleep: ${circadianProfile.sleepTime || "N/A"}` : "Not configured" },
              { icon: Phone, label: "Emergency Contact", value: `${patientData.emergencyContact}${patientData.doctorPhone ? ` – ${patientData.doctorPhone}` : ""}` },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default QRCardPage;
