import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { QrCode, Download, User, Pill, Phone, AlertTriangle, Clock, Heart, Droplet, Activity, Moon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface UserData {
  _id?: string;
  name?: string;
  age?: number;
  gender?: string;
  email?: string;
  phone?: string;
  healthConditions?: string[];
  sleepSchedule?: {
    wakeTime?: string;
    sleepTime?: string;
  };
}

interface MedicationData {
  _id?: string;
  name?: string;
  dosage?: string;
  frequency?: string;
  foodRule?: string;
  reminderTimes?: string[];
}

interface EmergencyContact {
  _id?: string;
  name?: string;
  phone?: string;
  relationship?: string;
  isPrimary?: boolean;
}

interface HealthMetrics {
  bloodPressure?: { systolic?: number; diastolic?: number };
  bloodSugar?: { value?: number; unit?: string };
  heartRate?: number;
  spO2?: number;
  temperature?: { value?: number; unit?: string };
  weight?: number;
  date?: string;
}

interface SleepData {
  hours?: number;
  quality?: string;
  bedTime?: string;
  wakeTime?: string;
  deepSleepHours?: number;
  remSleepHours?: number;
  date?: string;
}

interface CircadianProfile {
  wakeTime?: string;
  sleepTime?: string;
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  chronotype?: string;
  workType?: string;
  workStartTime?: string;
  workEndTime?: string;
}

const QRCardPage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [medications, setMedications] = useState<MedicationData[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [sleepData, setSleepData] = useState<SleepData | null>(null);
  const [circadianProfile, setCircadianProfile] = useState<CircadianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch current user
        const user = await api.auth.me();
        if (!user || !user._id) {
          setError("Unable to fetch user data. Please log in.");
          setLoading(false);
          return;
        }

        setUserData(user);

        // Fetch medications
        try {
          const meds = await api.medications.getByUserId(user._id);
          setMedications(Array.isArray(meds) ? meds : []);
        } catch {
          setMedications([]);
        }

        // Fetch emergency contacts
        try {
          const contacts = await api.emergencyContacts.getByUserId(user._id);
          setEmergencyContacts(Array.isArray(contacts) ? contacts : []);
        } catch {
          setEmergencyContacts([]);
        }

        // Fetch latest health metrics
        try {
          const metrics = await api.healthMetrics.getLatest(user._id);
          setHealthMetrics(metrics || null);
        } catch {
          setHealthMetrics(null);
        }

        // Fetch latest sleep data
        try {
          const sleep = await api.sleep.getByUserId(user._id);
          const latestSleep = Array.isArray(sleep) ? sleep[0] : null;
          setSleepData(latestSleep || null);
        } catch {
          setSleepData(null);
        }

        // Fetch circadian profile
        try {
          const profile = await api.circadianProfile.getByUserId(user._id);
          setCircadianProfile(profile || null);
        } catch {
          setCircadianProfile(null);
        }
      } catch (err) {
        setError("Error loading user data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;

    const svg = qrCodeRef.current.querySelector("svg");
    if (!svg) return;

    // Create canvas with high DPI
    const canvas = document.createElement("canvas");
    const scale = 2; // 2x resolution for better quality
    const size = svg.getAttribute("width");
    const numSize = parseInt(size || "200", 10);
    
    canvas.width = numSize * scale;
    canvas.height = numSize * scale;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);

    const image = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    image.onload = () => {
      ctx?.drawImage(image, 0, 0);
      const link = document.createElement("a");
      link.download = `mediclock-qr-${userData?._id || "card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      console.error("Error rendering QR code image");
      URL.revokeObjectURL(url);
    };

    image.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto text-center py-12">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <QrCode className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading your health data...</p>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-600">{error}</p>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  const qrData = JSON.stringify({
    _id: userData?._id,
    name: userData?.name,
    age: userData?.age,
    gender: userData?.gender,
    email: userData?.email,
    phone: userData?.phone,
    healthConditions: userData?.healthConditions || [],
    sleepSchedule: userData?.sleepSchedule,
    medications: medications.map((med) => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      foodRule: med.foodRule,
      reminderTimes: med.reminderTimes,
    })),
    emergencyContacts: emergencyContacts.map((contact) => ({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    })),
    healthMetrics: {
      bloodPressure: healthMetrics?.bloodPressure,
      bloodSugar: healthMetrics?.bloodSugar,
      heartRate: healthMetrics?.heartRate,
      spO2: healthMetrics?.spO2,
      temperature: healthMetrics?.temperature,
      weight: healthMetrics?.weight,
      date: healthMetrics?.date,
    },
    sleepData: {
      hours: sleepData?.hours,
      quality: sleepData?.quality,
      bedTime: sleepData?.bedTime,
      wakeTime: sleepData?.wakeTime,
      deepSleepHours: sleepData?.deepSleepHours,
      remSleepHours: sleepData?.remSleepHours,
      date: sleepData?.date,
    },
    circadianProfile: {
      wakeTime: circadianProfile?.wakeTime,
      sleepTime: circadianProfile?.sleepTime,
      breakfastTime: circadianProfile?.breakfastTime,
      lunchTime: circadianProfile?.lunchTime,
      dinnerTime: circadianProfile?.dinnerTime,
      chronotype: circadianProfile?.chronotype,
      workType: circadianProfile?.workType,
      workStartTime: circadianProfile?.workStartTime,
      workEndTime: circadianProfile?.workEndTime,
    },
    timestamp: new Date().toISOString(),
  });

  const primaryContact = emergencyContacts.find((c) => c.isPrimary) || emergencyContacts[0];

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
          <QrCode className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="font-display font-bold text-xl mb-2">Your Health QR Card</h2>
          <p className="text-sm text-muted-foreground mb-6">Scan to access comprehensive health information</p>
          <div className="inline-block p-4 bg-card rounded-2xl border border-border" ref={qrCodeRef}>
            <QRCodeSVG value={qrData} size={300} level="H" />
          </div>
          <div className="mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadQRCode}
              className="px-6 py-2.5 gradient-blue text-primary-foreground rounded-xl text-sm font-medium inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download QR
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4">Health Card Preview</h3>
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <User className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Patient Info</p>
                <p className="text-sm font-medium">
                  {userData?.name}, {userData?.age}y {userData?.gender ? `(${userData.gender})` : ""}
                </p>
              </div>
            </div>

            {/* Sleep Schedule */}
            {userData?.sleepSchedule && (userData?.sleepSchedule.wakeTime || userData?.sleepSchedule.sleepTime) && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Sleep Schedule</p>
                  <p className="text-sm font-medium">
                    {userData?.sleepSchedule.sleepTime || "—"} to {userData?.sleepSchedule.wakeTime || "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Health Conditions */}
            {userData?.healthConditions && userData?.healthConditions.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <Heart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Health Conditions</p>
                  <p className="text-sm font-medium">{userData?.healthConditions.join(", ")}</p>
                </div>
              </div>
            )}

            {/* Medications */}
            {medications.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <Pill className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Active Medications ({medications.length})</p>
                  <div className="mt-2 space-y-1">
                    {medications.slice(0, 3).map((med, idx) => (
                      <p key={idx} className="text-sm font-medium">
                        {med.name} {med.dosage ? `– ${med.dosage}` : ""} {med.frequency ? `(${med.frequency})` : ""}
                      </p>
                    ))}
                    {medications.length > 3 && <p className="text-xs text-muted-foreground">+{medications.length - 3} more medications</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {primaryContact && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Emergency Contact</p>
                  <p className="text-sm font-medium">
                    {primaryContact.name} – {primaryContact.phone} ({primaryContact.relationship})
                  </p>
                </div>
              </div>
            )}

            {/* Health Metrics */}
            {healthMetrics && (Object.keys(healthMetrics).some((key) => healthMetrics[key as keyof typeof healthMetrics])) && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <Heart className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Health Metrics</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {healthMetrics?.bloodPressure && (
                      <p className="font-medium">{healthMetrics.bloodPressure.systolic}/{healthMetrics.bloodPressure.diastolic} mmHg</p>
                    )}
                    {healthMetrics?.bloodSugar?.value && (
                      <p className="font-medium">{healthMetrics.bloodSugar.value} {healthMetrics.bloodSugar.unit || "mg/dL"}</p>
                    )}
                    {healthMetrics?.heartRate && (
                      <p className="font-medium">{healthMetrics.heartRate} BPM</p>
                    )}
                    {healthMetrics?.spO2 && (
                      <p className="font-medium">{healthMetrics.spO2}% SpO2</p>
                    )}
                    {healthMetrics?.temperature?.value && (
                      <p className="font-medium">{healthMetrics.temperature.value}°{healthMetrics.temperature.unit || "C"}</p>
                    )}
                    {healthMetrics?.weight && (
                      <p className="font-medium">{healthMetrics.weight} kg</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Circadian Profile */}
            {circadianProfile && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <Moon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Circadian Cycle</p>
                  <div className="mt-2 space-y-1 text-xs">
                    {circadianProfile?.chronotype && (
                      <p className="font-medium">Type: {circadianProfile.chronotype}</p>
                    )}
                    {circadianProfile?.wakeTime && (
                      <p className="font-medium">Wake: {circadianProfile.wakeTime}</p>
                    )}
                    {circadianProfile?.sleepTime && (
                      <p className="font-medium">Sleep: {circadianProfile.sleepTime}</p>
                    )}
                    {circadianProfile?.workType && (
                      <p className="font-medium">Work: {circadianProfile.workType} {circadianProfile.workStartTime ? `(${circadianProfile.workStartTime}-${circadianProfile.workEndTime})` : ""}</p>
                    )}
                    {circadianProfile?.breakfastTime && (
                      <p className="font-medium text-xs">Meals: {circadianProfile.breakfastTime} | {circadianProfile.lunchTime} | {circadianProfile.dinnerTime}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sleep Data */}
            {sleepData && (sleepData.hours || sleepData.quality) && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <Activity className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Sleep Record</p>
                  <div className="mt-2 space-y-1 text-xs">
                    {sleepData?.hours && (
                      <p className="font-medium">{sleepData.hours}h sleep ({sleepData.quality || "—"})</p>
                    )}
                    {sleepData?.bedTime && (
                      <p className="font-medium">{sleepData.bedTime} → {sleepData.wakeTime}</p>
                    )}
                    {sleepData?.deepSleepHours && (
                      <p className="font-medium">Deep: {sleepData.deepSleepHours}h | REM: {sleepData.remSleepHours}h</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="text-sm font-medium">
                  {userData?.email}
                  {userData?.phone && ` • ${userData.phone}`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default QRCardPage;
