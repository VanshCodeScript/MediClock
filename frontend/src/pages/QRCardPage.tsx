import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { QrCode, Download, User, Pill, Phone, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const patientData = {
  name: "John Doe",
  age: 45,
  bloodType: "O+",
  diseases: ["Hypertension", "Type 2 Diabetes"],
  medications: ["Metformin 500mg", "Lisinopril 10mg", "Atorvastatin 20mg"],
  allergies: ["Penicillin", "Sulfa drugs"],
  doctor: "Dr. Sarah Johnson",
  doctorPhone: "+1 234 567 8900",
  emergencyContact: "Jane Doe – +1 987 654 3210",
};

const QRCardPage = () => (
  <PageTransition>
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
        <QrCode className="w-8 h-8 text-primary mx-auto mb-3" />
        <h2 className="font-display font-bold text-xl mb-2">Your Health QR Card</h2>
        <p className="text-sm text-muted-foreground mb-6">Scan to access emergency health information</p>
        <div className="inline-block p-4 bg-card rounded-2xl border border-border">
          <QRCodeSVG value={JSON.stringify(patientData)} size={180} level="M" />
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
            { icon: User, label: "Patient", value: `${patientData.name}, ${patientData.age}y, ${patientData.bloodType}` },
            { icon: AlertTriangle, label: "Conditions", value: patientData.diseases.join(", ") },
            { icon: Pill, label: "Medications", value: patientData.medications.join(", ") },
            { icon: AlertTriangle, label: "Allergies", value: patientData.allergies.join(", ") },
            { icon: Phone, label: "Doctor", value: `${patientData.doctor} – ${patientData.doctorPhone}` },
            { icon: Phone, label: "Emergency", value: patientData.emergencyContact },
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

export default QRCardPage;
