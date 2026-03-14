import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { PhoneCall, QrCode, Upload, UserRound, AlertTriangle, Loader, Heart, Moon, Activity, Download, Pill } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { api } from "@/lib/api";

type PatientRecord = {
  _id?: string;
  name?: string;
  age?: number;
  email?: string;
  phone?: string;
  gender?: string;
  healthConditions?: string[];
  sleepSchedule?: {
    wakeTime?: string;
    sleepTime?: string;
  };
  medications?: Array<{
    name?: string;
    dosage?: string;
    frequency?: string;
  }>;
  emergencyContacts?: Array<{
    name?: string;
    phone?: string;
    relationship?: string;
  }>;
  healthMetrics?: {
    bloodPressure?: { systolic?: number; diastolic?: number };
    bloodSugar?: { value?: number; unit?: string };
    heartRate?: number;
    spO2?: number;
    temperature?: { value?: number; unit?: string };
    weight?: number;
    date?: string;
  };
  sleepData?: {
    hours?: number;
    quality?: string;
    bedTime?: string;
    wakeTime?: string;
    deepSleepHours?: number;
    remSleepHours?: number;
    date?: string;
  };
  circadianProfile?: {
    wakeTime?: string;
    sleepTime?: string;
    breakfastTime?: string;
    lunchTime?: string;
    dinnerTime?: string;
    chronotype?: string;
    workType?: string;
    workStartTime?: string;
    workEndTime?: string;
  };
};

declare global {
  interface Window {
    jsQR?: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
  }
}

const DoctorQRScannerPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<"initializing" | "ready" | "scanning" | "detected">("initializing");
  const [scanCount, setScanCount] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState<number>(0);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [jsqrReady, setJsqrReady] = useState(false);

  // Load jsQR from CDN
  useEffect(() => {
    console.log("🔍 Checking jsQR library...");
    if ((window as any).jsQR) {
      console.log("✅ jsQR already loaded");
      setJsqrReady(true);
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    script.async = true;
    
    script.onload = () => {
      console.log("✅ jsQR library loaded successfully");
      setJsqrReady(true);
    };
    
    script.onerror = () => {
      console.error("❌ Failed to load jsQR library from CDN");
      // Don't block camera - we can still try to scan
      setJsqrReady(true);
      console.log("📌 Continuing anyway - will attempt to scan");
    };
    
    console.log("📥 Loading jsQR from CDN...");
    document.head.appendChild(script);
    
    // Fallback: set as ready after 3 seconds regardless
    const timeout = setTimeout(() => {
      console.log("⏱️ JSQr loading timeout - proceeding anyway");
      setJsqrReady(true);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Decode QR from image using jsQR with image enhancement
  const decodeQRFromImage = (imageData: ImageData): string | null => {
    try {
      if (!(window as any).jsQR) {
        console.warn("jsQR not ready yet");
        return null;
      }

      // Try to decode directly first
      let code = (window as any).jsQR(
        imageData.data,
        imageData.width,
        imageData.height
      );
      if (code && code.data) {
        console.log("QR decoded successfully on first attempt");
        return code.data;
      }

      // If direct decode fails, try to enhance the image
      // Increase contrast to help QR detection
      const enhancedData = new Uint8ClampedArray(imageData.data);
      for (let i = 0; i < enhancedData.length; i += 4) {
        const r = enhancedData[i];
        const g = enhancedData[i + 1];
        const b = enhancedData[i + 2];

        // Convert to grayscale using standard formula
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply threshold - make it more black and white
        const threshold = gray > 127 ? 255 : 0;
        enhancedData[i] = threshold;
        enhancedData[i + 1] = threshold;
        enhancedData[i + 2] = threshold;
      }

      const enhancedImageData = new ImageData(enhancedData, imageData.width, imageData.height);
      code = (window as any).jsQR(
        enhancedImageData.data,
        enhancedImageData.width,
        enhancedImageData.height
      );
      if (code && code.data) {
        console.log("QR decoded successfully after enhancement");
        return code.data;
      }

      // Try different threshold if first enhancement fails
      const enhancedData2 = new Uint8ClampedArray(imageData.data);
      for (let i = 0; i < enhancedData2.length; i += 4) {
        const r = enhancedData2[i];
        const g = enhancedData2[i + 1];
        const b = enhancedData2[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const threshold = gray > 100 ? 255 : 0;
        enhancedData2[i] = threshold;
        enhancedData2[i + 1] = threshold;
        enhancedData2[i + 2] = threshold;
      }

      const enhancedImageData2 = new ImageData(enhancedData2, imageData.width, imageData.height);
      code = (window as any).jsQR(
        enhancedImageData2.data,
        enhancedImageData2.width,
        enhancedImageData2.height
      );
      if (code && code.data) {
        console.log("QR decoded successfully with alternative enhancement");
        return code.data;
      }

      return null;
    } catch (err) {
      console.error("QR decode error:", err);
      return null;
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setPatient(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          console.log("Image dimensions:", canvas.width, "x", canvas.height);

          const qrData = decodeQRFromImage(imageData);
          console.log("Decoded QR:", qrData);

          if (qrData) {
            try {
              const parsed = JSON.parse(qrData);
              if (parsed?._id) {
                // Fetch fresh data from database
                await processPatientData(parsed);
              } else {
                setError("Invalid QR code format. Missing patient ID.");
                setLoading(false);
              }
            } catch (parseErr) {
              console.error("Parse error:", parseErr);
              setError("Could not parse QR code data.");
              setLoading(false);
            }
          } else {
            setError("No QR code detected. Make sure the image is clear and well-lit.");
            setLoading(false);
          }
        };
        img.onerror = () => {
          setError("Failed to load image.");
          setLoading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Error processing image.");
      setLoading(false);
    }
  };

  // Process patient data from QR code and fetch fresh data from database
  const processPatientData = async (qrPayload: PatientRecord) => {
    if (!qrPayload?._id) {
      setError("Invalid patient record.");
      return;
    }

    setLoading(true);
    try {
      // Start with QR data
      let patientData: PatientRecord = { ...qrPayload };
      console.log("QR Payload:", qrPayload);

      // Fetch fresh cycle data from database
      try {
        const freshCycle = await api.circadianProfile.getByUserId(qrPayload._id);
        console.log("Fresh Cycle Data:", freshCycle);
        if (freshCycle && freshCycle._id) {
          patientData.circadianProfile = {
            wakeTime: freshCycle.wakeTime,
            sleepTime: freshCycle.sleepTime,
            breakfastTime: freshCycle.breakfastTime,
            lunchTime: freshCycle.lunchTime,
            dinnerTime: freshCycle.dinnerTime,
            chronotype: freshCycle.chronotype,
            workType: freshCycle.workType,
            workStartTime: freshCycle.workStartTime,
            workEndTime: freshCycle.workEndTime,
          };
        }
      } catch (err) {
        console.warn("Could not fetch fresh cycle data from database:", err);
        // Use QR data if database fetch fails
      }

      // Fetch fresh health metrics
      try {
        const freshMetrics = await api.healthMetrics.getLatest(qrPayload._id);
        console.log("Fresh Health Metrics:", freshMetrics);
        if (freshMetrics && freshMetrics._id) {
          patientData.healthMetrics = {
            bloodPressure: freshMetrics.bloodPressure,
            bloodSugar: freshMetrics.bloodSugar,
            heartRate: freshMetrics.heartRate,
            spO2: freshMetrics.spO2,
            temperature: freshMetrics.temperature,
            weight: freshMetrics.weight,
            date: freshMetrics.date,
          };
        }
      } catch (err) {
        console.warn("Could not fetch fresh health metrics from database:", err);
        // Use QR data if database fetch fails
      }

      // Fetch fresh sleep data
      try {
        const freshSleep = await api.sleep.getByUserId(qrPayload._id);
        console.log("Fresh Sleep Data:", freshSleep);
        const latestSleep = Array.isArray(freshSleep) ? freshSleep[0] : null;
        if (latestSleep && latestSleep._id) {
          patientData.sleepData = {
            hours: latestSleep.hours,
            quality: latestSleep.quality,
            bedTime: latestSleep.bedTime,
            wakeTime: latestSleep.wakeTime,
            deepSleepHours: latestSleep.deepSleepHours,
            remSleepHours: latestSleep.remSleepHours,
            date: latestSleep.date,
          };
        }
      } catch (err) {
        console.warn("Could not fetch fresh sleep data from database:", err);
        // Use QR data if database fetch fails
      }

      console.log("Final Patient Data:", patientData);
      setPatient(patientData);
    } catch (err) {
      console.error("Error processing patient data:", err);
      // Fallback to QR data if all else fails
      setPatient(qrPayload);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient data from API (fallback if QR doesn't have full data)
  const fetchPatientData = async (patientId: string) => {
    setLoading(true);
    try {
      const user = await api.users.getById(patientId);
      if (!user?._id) {
        setError("Patient record not found.");
        return;
      }
      setPatient(user);
    } catch {
      setError("Unable to fetch patient details.");
    } finally {
      setLoading(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      console.log("🎬 Starting camera...");
      setError("");
      setCameraStatus("initializing");
      setScanCount(0);
      const constraints = {
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      };
      
      console.log("📹 Requesting camera with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ Camera stream obtained:", stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("📺 Video source object set");
        
        // Wait for video to be ready before starting scan
        videoRef.current.onloadedmetadata = () => {
          console.log("✅ Video metadata loaded:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
          videoRef.current?.play().catch((err) => {
            console.error("❌ Play error:", err);
            setError("Failed to play video stream.");
            setCameraStatus("initializing");
          });
          setCameraActive(true);
          setScanning(true);
          setCameraStatus("ready");
          console.log("🟢 Camera ready, starting scan");
          // Start scanning after a short delay to ensure video is truly ready
          setTimeout(() => {
            console.log("🔍 Beginning QR scan");
            setCameraStatus("scanning");
            scanCamera();
          }, 500);
        };
        
        videoRef.current.onerror = (err) => {
          console.error("❌ Video element error:", err);
          setError("Video element error occurred.");
          setCameraStatus("initializing");
        };
      }
    } catch (err: any) {
      console.error("❌ Camera error:", err);
      setCameraStatus("initializing");
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access in settings.");
        console.error("User denied camera permission");
      } else if (err.name === "NotFoundError") {
        setError("No camera device found. Please check your device.");
        console.error("No camera device found");
      } else if (err.name === "NotReadableError") {
        setError("Camera is in use by another application. Please close it and try again.");
        console.error("Camera is in use by another app");
      } else {
        setError("Unable to access camera: " + err.message);
        console.error("Generic camera error:", err.message);
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    try {
      setScanning(false);
      setCameraStatus("initializing");
      setScanCount(0);
      
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => {
            console.log("🛑 Stopping camera track:", track.kind);
            track.stop();
          });
        }
        videoRef.current.srcObject = null;
      }
      
      setCameraActive(false);
      console.log("📹 Camera stopped");
    } catch (err) {
      console.error("Error stopping camera:", err);
    }
  };

  // Scan from camera continuously
  const scanCamera = () => {
    if (!videoRef.current || !scanning) return;

    const video = videoRef.current;
    
    // Make sure video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video not ready yet, retrying...");
      scanIntervalRef.current = setTimeout(scanCamera, 300);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrData = decodeQRFromImage(imageData);

      // Increment scan count
      setScanCount(prev => prev + 1);

      if (qrData) {
        try {
          const parsed = JSON.parse(qrData);
          if (parsed?._id) {
            console.log("✅ QR Code DETECTED! Patient ID:", parsed._id);
            setLastDetectionTime(Date.now());
            setCameraStatus("detected");
            setScanning(false);
            
            // Show detection feedback for 500ms before processing
            setTimeout(() => {
              stopCamera();
              // Fetch fresh data from database
              processPatientData(parsed);
            }, 500);
            return;
          }
        } catch (parseErr) {
          console.warn("Invalid QR data format:", parseErr);
          // Continue scanning
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
    }

    if (scanning) {
      scanIntervalRef.current = setTimeout(scanCamera, 300);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const openConsultation = () => {
    if (!patient?._id) return;

    navigate("/doctor/video-call", {
      state: {
        calleeId: patient._id,
        calleeName: patient.name || "Patient",
      },
    });
  };

  const downloadPatientPDF = async () => {
    if (!patient) return;

    try {
      const element = document.getElementById("patient-record-content");
      if (!element) return;

      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add header
      pdf.setFontSize(24);
      pdf.setTextColor(3, 102, 214);
      pdf.text("MediClock", 10, 15);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Patient Health & Medication Record", 10, 25);

      pdf.setDrawColor(3, 102, 214);
      pdf.line(10, 28, pageWidth - 10, 28);

      // Add patient record content
      let yPosition = 35;
      const maxHeight = pageHeight - 20;

      if (imgHeight > maxHeight) {
        // Split across multiple pages
        let remainingHeight = imgHeight;
        let yImage = 0;

        while (remainingHeight > 0) {
          const heightToPrint = Math.min(remainingHeight, maxHeight - yPosition);
          const srcY = (yImage * canvas.height) / imgHeight;
          const srcHeight = (heightToPrint * canvas.height) / imgHeight;

          const cropped = document.createElement("canvas");
          cropped.width = canvas.width;
          cropped.height = srcHeight;
          const ctx = cropped.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, 0, -srcY, canvas.width, canvas.height);
            const croppedImgData = cropped.toDataURL("image/png");
            pdf.addImage(croppedImgData, "PNG", 10, yPosition, imgWidth, heightToPrint);
          }

          remainingHeight -= heightToPrint;
          yImage += heightToPrint;
          yPosition = 0;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      } else {
        pdf.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight);
      }

      // Add footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: "center" });
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, pageHeight - 5);
      }

      // Download PDF
      pdf.save(`MediClock_${patient.name || "Patient"}_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
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
            Scan patient QR code using camera or upload image to fetch patient details.
          </p>

          {!cameraActive && !patient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  console.log("📷 Open Camera clicked");
                  startCamera();
                }}
                disabled={loading}
                className="px-4 py-3 rounded-xl gradient-blue text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-70 hover:shadow-lg transition-all"
              >
                <QrCode className="w-4 h-4" /> Open Camera
              </button>
              <button
                onClick={() => {
                  console.log("📁 Upload QR Image clicked");
                  fileInputRef.current?.click();
                }}
                disabled={loading}
                className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-70 hover:shadow-lg transition-all"
              >
                <Upload className="w-4 h-4" /> Upload QR Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {cameraActive && !patient && (
            <div className="space-y-3">
              <div className="relative w-full bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-80 object-cover"
                />
                {/* QR frame guide */}
                <div className="absolute inset-0 border-2 border-primary/50">
                  <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-primary rounded-lg"></div>
                  {/* Corner markers */}
                  <div className="absolute top-1/4 left-1/4 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute top-1/4 right-1/4 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                </div>

                {/* QR Detection Success Overlay */}
                {cameraStatus === "detected" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center bg-green-500/20 border-2 border-green-500"
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-2">✅</div>
                      <p className="text-lg font-bold text-green-300">QR Code Detected!</p>
                      <p className="text-sm text-green-200">Loading patient data...</p>
                    </div>
                  </motion.div>
                )}

                {/* Status and scan count - Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded-lg backdrop-blur">
                  {cameraStatus === "initializing" && (
                    <>
                      <Loader className="w-4 h-4 text-yellow-500 animate-spin" />
                      <span className="text-xs text-yellow-200">Initializing...</span>
                    </>
                  )}
                  {cameraStatus === "ready" && (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-200">Ready to Scan</span>
                    </>
                  )}
                  {cameraStatus === "scanning" && (
                    <>
                      <Loader className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-xs text-primary">Scanning...</span>
                    </>
                  )}
                  {cameraStatus === "detected" && (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                      <span className="text-xs text-green-300 font-bold">QR Detected!</span>
                    </>
                  )}
                </div>

                {/* Scan counter - Bottom Left */}
                {scanning && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded-lg backdrop-blur">
                    <span className="text-xs text-muted-foreground">Frames: </span>
                    <span className="text-xs font-bold text-primary">{scanCount}</span>
                  </div>
                )}

                {/* Help text - Bottom Center */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-white/70 text-center bg-black/50 px-3 py-1 rounded-lg max-w-xs">
                  {cameraStatus === "initializing" && "📷 Requesting camera access..."}
                  {cameraStatus === "ready" && "📍 Position QR code in the frame"}
                  {cameraStatus === "scanning" && "🔍 Scanning for QR code..."}
                  {cameraStatus === "detected" && "✅ QR Code found! Processing..."}
                </div>
              </div>

              {/* Info message */}
              <div className="text-center text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                <p>Point your camera at a patient QR code to scan</p>
              </div>

              <button
                onClick={stopCamera}
                className="w-full px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
              >
                Cancel Scan
              </button>
            </div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader className="w-5 h-5 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Fetching patient data...</p>
            </div>
          )}
        </motion.div>

        {patient && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <div id="patient-record-content" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <UserRound className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-lg">Patient Record</h3>
                {patient.name && <span className="text-sm text-muted-foreground">({patient.name})</span>}
              </div>

              {/* Quick Summary */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2 font-semibold">Quick Summary</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Age</p><p className="font-bold text-base">{patient.age || "—"}</p></div>
                  <div><p className="text-muted-foreground">Gender</p><p className="font-bold text-base">{patient.gender || "—"}</p></div>
                  {patient.medications && <div><p className="text-muted-foreground">Medications</p><p className="font-bold text-base">{patient.medications.length}</p></div>}
                  {patient.healthMetrics?.heartRate && <div><p className="text-muted-foreground">Heart Rate</p><p className="font-bold text-base">{patient.healthMetrics.heartRate} BPM</p></div>}
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span> {patient.name || "Unknown"}
              </p>
              <p>
                <span className="text-muted-foreground">Age:</span> {patient.age || "Not provided"}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {patient.email || "Not provided"}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span> {patient.phone || "Not provided"}
              </p>
              {patient.healthConditions && patient.healthConditions.length > 0 && (
                <p className="md:col-span-2">
                  <span className="text-muted-foreground">Conditions:</span> {patient.healthConditions.join(", ")}
                </p>
              )}
              {patient.sleepSchedule && (
                <p className="md:col-span-2">
                  <span className="text-muted-foreground">Sleep Schedule:</span> {patient.sleepSchedule.sleepTime || "—"} to {patient.sleepSchedule.wakeTime || "—"}
                </p>
              )}
              {patient.medications && patient.medications.length > 0 && (
                <p className="md:col-span-2">
                  <span className="text-muted-foreground">Medications:</span>{" "}
                  {patient.medications.map((m) => `${m.name} (${m.dosage})`).join(", ")}
                </p>
              )}
            </div>

            {/* Health Metrics Section */}
            {patient.healthMetrics && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-base">Health Metrics</h4>
                </div>
                {Object.values(patient.healthMetrics).every(v => !v) ? (
                  <p className="text-sm text-muted-foreground p-3 bg-red-50/30 rounded">No health metrics available</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-red-50/50 dark:bg-red-950/20 p-4 rounded-lg">
                    {patient.healthMetrics.bloodPressure?.systolic && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Blood Pressure</p>
                        <p className="font-bold text-base">{patient.healthMetrics.bloodPressure.systolic}/{patient.healthMetrics.bloodPressure.diastolic || "—"}</p>
                        <p className="text-xs text-muted-foreground">mmHg</p>
                      </div>
                    )}
                    {patient.healthMetrics.heartRate && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Heart Rate</p>
                        <p className="font-bold text-base">{patient.healthMetrics.heartRate}</p>
                        <p className="text-xs text-muted-foreground">BPM</p>
                      </div>
                    )}
                    {patient.healthMetrics.spO2 && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">SpO2</p>
                        <p className="font-bold text-base">{patient.healthMetrics.spO2}</p>
                        <p className="text-xs text-muted-foreground">%</p>
                      </div>
                    )}
                    {patient.healthMetrics.bloodSugar?.value && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Blood Sugar</p>
                        <p className="font-bold text-base">{patient.healthMetrics.bloodSugar.value}</p>
                        <p className="text-xs text-muted-foreground">{patient.healthMetrics.bloodSugar.unit || "mg/dL"}</p>
                      </div>
                    )}
                    {patient.healthMetrics.temperature?.value && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Temperature</p>
                        <p className="font-bold text-base">{patient.healthMetrics.temperature.value}°</p>
                        <p className="text-xs text-muted-foreground">{patient.healthMetrics.temperature.unit || "C"}</p>
                      </div>
                    )}
                    {patient.healthMetrics.weight && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Weight</p>
                        <p className="font-bold text-base">{patient.healthMetrics.weight}</p>
                        <p className="text-xs text-muted-foreground">kg</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Medications Section */}
            {patient.medications && patient.medications.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Pill className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-base">Current Medications</h4>
                </div>
                <div className="space-y-2 bg-green-50/30 p-4 rounded-lg">
                  {patient.medications.map((med, idx) => (
                    <div key={idx} className="text-sm p-2 bg-background rounded border">
                      <p className="font-semibold">{med.name || "Unknown"}</p>
                      <div className="text-xs text-muted-foreground mt-1 grid grid-cols-2 gap-2">
                        {med.dosage && <p>Dosage: {med.dosage}</p>}
                        {med.frequency && <p>Frequency: {med.frequency}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Circadian Profile Section */}
            {patient.circadianProfile && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-base">Circadian Cycle & Schedule</h4>
                </div>
                {Object.values(patient.circadianProfile).every(v => !v) ? (
                  <p className="text-sm text-muted-foreground p-3 bg-blue-50/30 rounded">No circadian data available</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg">
                    {patient.circadianProfile.chronotype && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Chronotype</p>
                        <p className="font-bold text-base capitalize">{patient.circadianProfile.chronotype}</p>
                      </div>
                    )}
                    {patient.circadianProfile.wakeTime && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Wake Time</p>
                        <p className="font-bold text-base">{patient.circadianProfile.wakeTime}</p>
                      </div>
                    )}
                    {patient.circadianProfile.sleepTime && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Sleep Time</p>
                        <p className="font-bold text-base">{patient.circadianProfile.sleepTime}</p>
                      </div>
                    )}
                    {patient.circadianProfile.workType && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Work Type</p>
                        <p className="font-bold text-base capitalize">{patient.circadianProfile.workType}</p>
                      </div>
                    )}
                    {patient.circadianProfile.workStartTime && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Work Hours</p>
                        <p className="font-bold text-base">{patient.circadianProfile.workStartTime} - {patient.circadianProfile.workEndTime || "—"}</p>
                      </div>
                    )}
                    {patient.circadianProfile.breakfastTime && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Breakfast</p>
                        <p className="font-bold text-base">{patient.circadianProfile.breakfastTime}</p>
                      </div>
                    )}
                    {patient.circadianProfile.lunchTime && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Lunch</p>
                        <p className="font-bold text-base">{patient.circadianProfile.lunchTime}</p>
                      </div>
                    )}
                    {patient.circadianProfile.dinnerTime && (
                      <div className="text-center p-3 bg-background rounded border">
                        <p className="text-muted-foreground text-xs font-semibold">Dinner</p>
                        <p className="font-bold text-base">{patient.circadianProfile.dinnerTime}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sleep Data Section */}
            {patient.sleepData && (patient.sleepData.hours || patient.sleepData.quality) && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-base">Sleep Record</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-lg">
                  {patient.sleepData.hours && (
                    <div className="text-center p-3 bg-background rounded border">
                      <p className="text-muted-foreground text-xs font-semibold">Duration</p>
                      <p className="font-bold text-base">{patient.sleepData.hours}</p>
                      <p className="text-xs text-muted-foreground">hours</p>
                    </div>
                  )}
                  {patient.sleepData.quality && (
                    <div className="text-center p-3 bg-background rounded border">
                      <p className="text-muted-foreground text-xs font-semibold">Quality</p>
                      <p className="font-bold text-base capitalize">{patient.sleepData.quality}</p>
                    </div>
                  )}
                  {patient.sleepData.deepSleepHours && (
                    <div className="text-center p-3 bg-background rounded border">
                      <p className="text-muted-foreground text-xs font-semibold">Deep Sleep</p>
                      <p className="font-bold text-base">{patient.sleepData.deepSleepHours}</p>
                      <p className="text-xs text-muted-foreground">hours</p>
                    </div>
                  )}
                  {patient.sleepData.bedTime && (
                    <div className="text-center p-3 bg-background rounded border">
                      <p className="text-muted-foreground text-xs font-semibold">Bed Time</p>
                      <p className="font-bold text-base">{patient.sleepData.bedTime}</p>
                    </div>
                  )}
                  {patient.sleepData.wakeTime && (
                    <div className="text-center p-3 bg-background rounded border">
                      <p className="text-muted-foreground text-xs font-semibold">Wake Time</p>
                      <p className="font-bold text-base">{patient.sleepData.wakeTime}</p>
                    </div>
                  )}
                  {patient.sleepData.remSleepHours && (
                    <div className="text-center p-3 bg-background rounded border">
                      <p className="text-muted-foreground text-xs font-semibold">REM Sleep</p>
                      <p className="font-bold text-base">{patient.sleepData.remSleepHours}</p>
                      <p className="text-xs text-muted-foreground">hours</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t flex-wrap">
              <button
                onClick={openConsultation}
                className="px-4 py-2.5 rounded-xl gradient-blue text-primary-foreground text-sm font-medium inline-flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" /> Open Video Consultation
              </button>
              <button
                onClick={downloadPatientPDF}
                className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-primary-foreground text-sm font-medium inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={() => {
                  setPatient(null);
                  setError("");
                }}
                className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium"
              >
                Scan Another
              </button>
            </div>
          </motion.div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </PageTransition>
  );
};

export default DoctorQRScannerPage;
