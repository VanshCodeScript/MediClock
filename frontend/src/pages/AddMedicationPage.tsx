import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Camera, Clock, Loader2, Pill, Plus, Sparkles, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getOrCreateCurrentUserId } from "@/lib/userSession";

const DEFAULT_TIMES: Record<string, string[]> = {
  "once daily": ["08:00"],
  "twice daily": ["08:00", "20:00"],
  "three times daily": ["08:00", "14:00", "20:00"],
  "as needed": [],
};

type MedicationFrequency = "once daily" | "twice daily" | "three times daily" | "as needed";
type MedicationFoodRule = "before food" | "after food" | "with food" | "empty stomach" | "none";

interface OcrMedication {
  name: string;
  dosage: string;
  frequency: string;
  foodRule: string;
  reason: string;
}

const normalizeFrequency = (value: string): MedicationFrequency => {
  const v = String(value || "").toLowerCase();
  if (v.includes("three") || v.includes("thrice") || v.includes("3")) return "three times daily";
  if (v.includes("twice") || v.includes("2")) return "twice daily";
  if (v.includes("need") || v.includes("prn")) return "as needed";
  return "once daily";
};

const normalizeFoodRule = (value: string): MedicationFoodRule => {
  const v = String(value || "").toLowerCase();
  if (v.includes("before")) return "before food";
  if (v.includes("after")) return "after food";
  if (v.includes("with")) return "with food";
  if (v.includes("empty")) return "empty stomach";
  return "none";
};

const AddMedicationPage = () => {
  const [userId, setUserId] = useState<string>("");
  const [meds, setMeds] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "once daily",
    meal: "after food",
    disease: "",
  });
  const [reminderTimes, setReminderTimes] = useState<string[]>(["08:00"]);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrNotes, setOcrNotes] = useState<string>("");
  const [ocrMeds, setOcrMeds] = useState<OcrMedication[]>([]);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const foodRuleLabelMap: Record<string, string> = {
    "before food": "Before Meal",
    "after food": "After Meal",
    "with food": "With Meal",
    "empty stomach": "Empty Stomach",
    none: "No food restriction",
  };

  // Sync reminder time slots when frequency changes
  const handleFrequencyChange = (freq: string) => {
    setForm((f) => ({ ...f, frequency: freq }));
    setReminderTimes(DEFAULT_TIMES[freq] ?? []);
  };

  const fillFormFromOcr = useCallback((med: OcrMedication) => {
    const frequency = normalizeFrequency(med.frequency);
    const foodRule = normalizeFoodRule(med.foodRule);

    setForm((f) => ({
      ...f,
      name: String(med.name || "").trim(),
      dosage: String(med.dosage || "").trim(),
      frequency,
      meal: foodRule,
      disease: String(med.reason || "").trim(),
    }));
    setReminderTimes(DEFAULT_TIMES[frequency] ?? []);
  }, []);

  const updateTime = (index: number, value: string) => {
    setReminderTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const loadMeds = async (uid: string) => {
    const response = await api.medications.getByUserId(uid);
    if (Array.isArray(response)) {
      setMeds(response);
      return;
    }
    throw new Error(response?.error || "Failed to load medications");
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const uid = await getOrCreateCurrentUserId();
        setUserId(uid);
        await loadMeds(uid);
      } catch (err: any) {
        setError(err?.message || "Failed to initialize medication page");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const openCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported in this browser.");
      return;
    }

    try {
      setCameraStarting(true);
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setShowCamera(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError("Unable to access camera. Please allow permission or upload image.");
      stopCamera();
    } finally {
      setCameraStarting(false);
    }
  }, [stopCamera]);

  const closeCamera = useCallback(() => {
    setShowCamera(false);
    stopCamera();
  }, [stopCamera]);

  const handlePrescriptionSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPrescriptionFile(file);
    setOcrError(null);
    setOcrNotes("");
    setOcrMeds([]);
    const reader = new FileReader();
    reader.onload = (ev) => setPrescriptionPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const capturePrescriptionFromCamera = useCallback(async () => {
    if (!videoRef.current) {
      setCameraError("Camera preview is not ready.");
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Failed to capture image. Try again.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setCameraError("Failed to process captured image.");
      return;
    }

    const file = new File([blob], `prescription-${Date.now()}.jpg`, { type: "image/jpeg" });
    setPrescriptionFile(file);
    setPrescriptionPreview(canvas.toDataURL("image/jpeg", 0.92));
    setOcrError(null);
    setOcrNotes("");
    setOcrMeds([]);
    closeCamera();
  }, [closeCamera]);

  const clearPrescription = useCallback(() => {
    setPrescriptionPreview(null);
    setPrescriptionFile(null);
    setOcrError(null);
    setOcrNotes("");
    setOcrMeds([]);
  }, []);

  const analyzePrescription = useCallback(async () => {
    if (!prescriptionFile) return;

    try {
      setOcrLoading(true);
      setOcrError(null);
      const data = await api.nutrition.analyzePrescription(prescriptionFile);

      if (data?.error) {
        throw new Error(data.error || "Prescription OCR failed");
      }

      const meds = Array.isArray(data?.medications) ? data.medications : [];
      setOcrMeds(meds);
      setOcrNotes(String(data?.notes || "").trim());

      if (meds.length > 0) {
        fillFormFromOcr(meds[0]);
      } else {
        setOcrError("No medications could be extracted from this image.");
      }
    } catch (err: any) {
      setOcrError(err?.message || "Failed to analyze prescription image.");
    } finally {
      setOcrLoading(false);
    }
  }, [prescriptionFile, fillFormFromOcr]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("User session not ready");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        userId,
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        foodRule: form.meal,
        reason: form.disease.trim() || form.meal,
        reminderTimes: reminderTimes.filter(Boolean),
      };

      const response = await api.medications.create(payload);
      if (response?.error) {
        throw new Error(response.error);
      }

      setForm({
        name: "",
        dosage: "",
        frequency: "once daily",
        meal: "after food",
        disease: "",
      });
      setReminderTimes(DEFAULT_TIMES["once daily"]);

      await loadMeds(userId);
    } catch (err: any) {
      setError(err?.message || "Failed to add medication");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="glass-card p-4 border-l-4 border-red-400 bg-red-50/50 text-red-700 text-sm">{error}</div>
        )}

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Prescription OCR Auto-Fill
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload or click a prescription image. AI will extract medicine details and auto-fill the form below.
          </p>

          {!prescriptionPreview ? (
            <div className="border-2 border-dashed border-border rounded-2xl p-6 bg-muted/30 flex flex-col items-center gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 gradient-blue text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload Prescription
                </button>
                <button
                  type="button"
                  onClick={openCamera}
                  disabled={cameraStarting}
                  className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium flex items-center gap-2 hover:border-primary/30"
                >
                  <Camera className="w-4 h-4" /> {cameraStarting ? "Opening..." : "Click Picture"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">JPG/PNG up to 10MB</p>
              {cameraError && <p className="text-xs text-red-600">{cameraError}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-muted">
                <img src={prescriptionPreview} alt="Prescription preview" className="w-full max-h-[260px] object-contain" />
                <button
                  type="button"
                  onClick={clearPrescription}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                onClick={analyzePrescription}
                disabled={ocrLoading}
                className="w-full py-3 gradient-blue text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {ocrLoading ? "Analyzing Prescription..." : "Analyze & Auto-Fill"}
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePrescriptionSelect} />

          {ocrError && <p className="text-sm text-red-600 mt-3">{ocrError}</p>}
          {ocrNotes && <p className="text-xs text-muted-foreground mt-2">LLM note: {ocrNotes}</p>}

          {ocrMeds.length > 1 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">Multiple medicines detected. Click one to fill form:</p>
              <div className="flex flex-wrap gap-2">
                {ocrMeds.map((m, idx) => (
                  <button
                    key={`${m.name}-${idx}`}
                    type="button"
                    onClick={() => fillFormFromOcr(m)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card hover:border-primary/40"
                  >
                    {m.name || `Medication ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showCamera && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl overflow-hidden bg-black/80">
                <video ref={videoRef} className="w-full max-h-[300px] object-contain" playsInline muted />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={capturePrescriptionFromCamera}
                  className="flex-1 py-2.5 rounded-xl gradient-blue text-primary-foreground text-sm font-semibold"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Add New Medication
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Medicine Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g., Aspirin"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Dosage</label>
              <input
                value={form.dosage}
                onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                required
                placeholder="e.g., 500mg"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                <option value="once daily">Once daily</option>
                <option value="twice daily">Twice daily</option>
                <option value="three times daily">Three times daily</option>
                <option value="as needed">As needed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Before/After Meal</label>
              <select
                value={form.meal}
                onChange={(e) => setForm((f) => ({ ...f, meal: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                <option value="before food">Before Meal</option>
                <option value="after food">After Meal</option>
                <option value="with food">With Meal</option>
                <option value="empty stomach">Empty Stomach</option>
                <option value="none">No food restriction</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Disease Treated</label>
              <input
                value={form.disease}
                onChange={(e) => setForm((f) => ({ ...f, disease: e.target.value }))}
                placeholder="e.g., Hypertension"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>

            {/* Reminder Times */}
            {reminderTimes.length > 0 && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> Reminder Times
                </label>
                <div className="flex flex-wrap gap-3">
                  {reminderTimes.map((t, i) => (
                    <input
                      key={i}
                      type="time"
                      value={t}
                      onChange={(e) => updateTime(i, e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  WhatsApp alert will be sent immediately when medication is added.
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <motion.button
                disabled={submitting || loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 gradient-blue text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add Medication"}
              </motion.button>
            </div>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-display font-semibold text-base mb-4">Current Medications</h3>
          <div className="grid gap-3">
            {loading && <div className="text-sm text-muted-foreground">Loading medications...</div>}
            {!loading && meds.length === 0 && <div className="text-sm text-muted-foreground">No medications in DB yet.</div>}
            {meds.map((m) => (
              <div key={m._id || `${m.name}-${m.dosage}`} className="glass-card-hover p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent"><Pill className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium">{m.name} - {m.dosage}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.frequency} · {foodRuleLabelMap[m.foodRule || "none"] || "No food restriction"} · {m.reason || "General"}
                    </p>
                    {Array.isArray(m.reminderTimes) && m.reminderTimes.length > 0 && (
                      <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {m.reminderTimes.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AddMedicationPage;
