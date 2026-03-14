import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { PhoneCall, QrCode, Search, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type PatientRecord = {
  _id?: string;
  name?: string;
  age?: number;
  email?: string;
  phone?: string;
  bloodType?: string;
  diseases?: string[];
};

const DoctorQRScannerPage = () => {
  const navigate = useNavigate();
  const [qrPayload, setQrPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState<PatientRecord | null>(null);

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
      const user = await api.users.getById(patientId);
      if (!user?._id) {
        setError("Patient record not found for scanned code.");
        return;
      }
      setPatient(user);
    } catch {
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
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">Patient QR Scanner</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Scan QR, fetch patient details, then open patient record or video call.
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-base">Patient Record</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {patient.name || "Unknown"}</p>
              <p><span className="text-muted-foreground">Age:</span> {patient.age || "Not provided"}</p>
              <p><span className="text-muted-foreground">Email:</span> {patient.email || "Not provided"}</p>
              <p><span className="text-muted-foreground">Phone:</span> {patient.phone || "Not provided"}</p>
              <p className="md:col-span-2"><span className="text-muted-foreground">Condition:</span> {patient.diseases?.join(", ") || "Not provided"}</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={openConsultation}
                className="px-4 py-2.5 rounded-xl gradient-blue text-primary-foreground text-sm font-medium inline-flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" /> Open Video Consultation
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default DoctorQRScannerPage;
