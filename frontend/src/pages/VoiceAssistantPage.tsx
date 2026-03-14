import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Mic, Phone, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

const VoiceAssistantPage = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the voice agent widget script
    const script = document.createElement("script");
    script.src = "https://voice.ai/app/voice-agent-widget.js";
    script.async = true;
    script.onload = () => {
      console.log("✓ Voice widget script loaded successfully");
      
      // Wait for widget to be available and initialize it
      setTimeout(() => {
        const widget = document.querySelector("voice-agent-widget") as any;
        if (widget) {
          console.log("✓ Widget element found, initializing...");
          // Set attributes after script loads
          widget.setAttribute("data-agent-id", "331a3f15-100b-4f03-ada7-745c50b22705");
          widget.setAttribute("data-api-key", import.meta.env.VITE_VOICE_API_KEY || "");
        }
      }, 500);
    };
    script.onerror = () => {
      setError("Failed to load voice widget. Please check your connection.");
      console.error("✗ Failed to load voice widget script");
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl w-full flex flex-col items-center gap-8">
          {/* Information Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-center mb-4"
          >
            <h1 className="text-4xl font-bold text-white mb-4">MediClock AI Voice Assistant</h1>
            <div className="glass-card p-6 rounded-xl backdrop-blur-lg bg-white/10 border border-white/20">
              <p className="text-gray-200 mb-4 leading-relaxed">
                Welcome to your personal AI-powered voice assistant. Get instant medication reminders, health insights, 
                and personalized medical advice powered by advanced AI technology.
              </p>
              <ul className="text-left text-gray-300 space-y-2 inline-block">
                <li>✓ Voice-activated medication reminders</li>
                <li>✓ Real-time drug interaction checks</li>
                <li>✓ Personalized health recommendations</li>
                <li>✓ 24/7 AI health consultation</li>
              </ul>
            </div>
          </motion.div>

          {/* Avatar with Ripple Effects */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative flex items-center justify-center mt-8"
          >
            {/* Ripple Layers - active when call is active */}
            {isCallActive && (
              <>
                <motion.div
                  className="absolute w-48 h-48 rounded-full border-2 border-blue-400/50"
                  animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute w-48 h-48 rounded-full border-2 border-purple-400/30"
                  animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div
                  className="absolute w-48 h-48 rounded-full border-2 border-cyan-400/20"
                  animate={{ scale: [1, 1.7], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                />
              </>
            )}

            {/* Avatar Circle */}
            <motion.div
              className="relative w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl"
              animate={isCallActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, repeat: isCallActive ? Infinity : 0 }}
            >
              <Mic className="w-20 h-20 text-white" />
            </motion.div>

            {/* Speaking Indicator */}
            {isCallActive && (
              <motion.div
                className="absolute top-0 right-0 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Status Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-lg text-gray-300 h-8">
              {isCallActive ? (
                <span className="flex items-center justify-center gap-2 text-green-400">
                  <motion.span animate={{ opacity: [0.5, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                    🎤
                  </motion.span>
                  Call Active - Speaking...
                </span>
              ) : (
                "Ready to assist you. Click the button below to start."
              )}
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md flex gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Voice Agent Widget - Embedded */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl"
          >
            <div style={{ minHeight: "240px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <voice-agent-widget 
                data-agent-id="331a3f15-100b-4f03-ada7-745c50b22705"
                data-start-text="Start Voice Call"
                data-stop-text="End Call"
                data-variant="default"
                data-show-time="true"
                data-show-mic-status="true"
                data-width="320"
                data-height="220"
                style={{ width: "100%", height: "auto" } as any}>
              </voice-agent-widget>
            </div>
            
            {/* Error message if widget fails */}
            {error && (
              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "14px" }}>
                {error}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default VoiceAssistantPage;
