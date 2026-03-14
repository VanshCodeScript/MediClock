import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { PhoneCall, QrCode, Search, UserRound, Pill, Heart, Clock, AlertTriangle, Phone as PhoneIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

interface PatientRecord {
  _id?: string;
  name?: string;
  age?: number;
  email?: string;
  phone?: string;
  bloodType?: string;
  diseases?: string[];
  gender?: string;
}

interface MedicationData {
  _id?: string;
  name?: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
}

interface HealthMetricsData {
  _id?: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  timestamp?: string;
}

interface SleepData {
  _id?: string;
  duration?: number;
  quality?: string;
  deepSleep?: number;
}

interface CircadianProfileData {
  _id?: string;
  chronotype?: string;
  wakeTime?: string;
  sleepTime?: string;
  optimalMedicationTime?: string;
}

interface PatientFullRecord extends PatientRecord {
  medications?: MedicationData[];
  healthMetrics?: HealthMetricsData;
  sleepData?: SleepData;
  circadianProfile?: CircadianProfileData;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

const DoctorQRScannerPage = () => {
  const navigate = useNavigate();
  const [qrPayload, setQrPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState<PatientFullRecord | null>(null);

  const parsePayload = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?._id) {
        return String(parsed._id);
      }
      if (parsed?.userId) {
        return String(parsed.userId);
      }
      if (parsed?.id) {
        return String(parsed.id);
      }
    } catch {
      // non-JSON payload
    }

    if (/^[a-fA-F0-9]{24}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  };

  const scanQr = async () => {
    setError("");
    setPatient(null);

    const patientId = parsePayload(qrPayload);
    if (!patientId) {
      setError("Use a valid patient QR payload or patient MongoDB ID.");
      return;
    }

    setLoading(true);
    try {
      // Fetch all patient data in parallel
      const [userRes, medsRes, metricsRes, sleepRes, circadianRes, contactsRes] = await Promise.all([
        api.users.getById(patientId),
        api.medications.getByUserId(patientId),
        api.healthMetrics.getLatest(patientId),
        api.sleep.getAnalytics(patientId),
        api.circadianProfile.getByUserId(patientId),
        api.emergencyContacts.getPrimary(patientId),
      ]);

      if (!userRes?._id) {
        setError("Patient record not found for scanned code.");
        return;
      }

      // Combine all data into comprehensive record
      const fullRecord: PatientFullRecord = {
        ...userRes,
        medications: Array.isArray(medsRes) ? medsRes : [],
        healthMetrics: metricsRes || undefined,
        sleepData: sleepRes || undefined,
        circadianProfile: circadianRes || undefined,
        emergencyContact: contactsRes || undefined,
      };

      setPatient(fullRecord);
    } catch (err) {
      console.error("Error scanning QR:", err);
      setError("Unable to fetch patient details.");
    } finally {
      setLoading(false);
    }
  };

  const openConsultation = () => {
    if (!patient?._id) {
      return;
    }

    navigate("/doctor/video-call", {
      state: {
        calleeId: patient._id,
        calleeName: patient.name || "Patient",
      },
    });
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">Patient QR Scanner</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Scan QR to fetch patient's complete health profile including medications, vitals, and circadian rhythm data.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder="Paste scanned QR payload or patient ID"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
            <button
              onClick={scanQr}
              disabled={loading}
              className="px-4 py-3 rounded-xl gradient-blue text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Search className="w-4 h-4" /> {loading ? "Scanning..." : "Scan QR"}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </motion.div>

        {patient && (
          <div className="space-y-4">
            {/* Patient Demographics */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <UserRound className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-base">Patient Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{patient.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Age</p>
                  <p className="font-medium">{patient.age || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Blood Type</p>
                  <p className="font-medium">{patient.bloodType || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Gender</p>
                  <p className="font-medium">{patient.gender || "Not provided"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground text-xs">Conditions</p>
                  <p className="font-medium">{patient.diseases?.join(", ") || "None reported"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{patient.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{patient.phone || "Not provided"}</p>
                </div>
              </div>
            </motion.div>

            {/* Current Health Metrics */}
            {patient.healthMetrics && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h3 className="font-display font-semibold text-base">Current Vitals</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Blood Pressure</p>
                    <p className="font-semibold text-base">{patient.healthMetrics.bloodPressure || "N/A"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Heart Rate</p>
                    <p className="font-semibold text-base">{patient.healthMetrics.heartRate || "N/A"} <span className="text-xs">bpm</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Temperature</p>
                    <p className="font-semibold text-base">{patient.healthMetrics.temperature || "N/A"} <span className="text-xs">°F</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Respiratory Rate</p>
                    <p className="font-semibold text-base">{patient.healthMetrics.respiratoryRate || "N/A"} <span className="text-xs">breaths/min</span></p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Medications */}
            {patient.medications && patient.medications.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-base">Current Medications</h3>
                </div>

                <div className="space-y-3">
                  {patient.medications.map((med) => (
                    <div key={med._id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Pill className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{med.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {med.dosage && `${med.dosage}`}
                          {med.frequency && ` • ${med.frequency}`}
                          {med.instructions && ` • ${med.instructions}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Circadian Rhythm Profile */}
            {patient.circadianProfile && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-base">Circadian Rhythm Profile</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Chronotype</p>
                    <p className="font-medium">{patient.circadianProfile.chronotype || "Not configured"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Sleep Time</p>
                    <p className="font-medium">{patient.circadianProfile.sleepTime || "Not configured"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Wake Time</p>
                    <p className="font-medium">{patient.circadianProfile.wakeTime || "Not configured"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Optimal Medication Time</p>
                    <p className="font-medium">{patient.circadianProfile.optimalMedicationTime || "Not configured"}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sleep Analytics */}
            {patient.sleepData && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="font-display font-semibold text-base">Sleep Analytics</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="font-semibold text-base">{patient.sleepData.duration || 0} <span className="text-xs">hrs</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Quality</p>
                    <p className="font-semibold text-base">{patient.sleepData.quality || "N/A"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Deep Sleep</p>
                    <p className="font-semibold text-base">{patient.sleepData.deepSleep || 0}%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Emergency Contact */}
            {patient.emergencyContact && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 text-orange-500" />
                  <h3 className="font-display font-semibold text-base">Emergency Contact</h3>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <PhoneIcon className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{patient.emergencyContact.name || "Not set"}</p>
                    <p className="text-xs text-muted-foreground">
                      {patient.emergencyContact.relationship && `${patient.emergencyContact.relationship} • `}
                      {patient.emergencyContact.phone || "Phone not available"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="pt-4">
              <button
                onClick={openConsultation}
                className="w-full md:w-auto px-6 py-3 rounded-xl gradient-blue text-primary-foreground font-medium inline-flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" /> Start Video Consultation
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default DoctorQRScannerPage;
