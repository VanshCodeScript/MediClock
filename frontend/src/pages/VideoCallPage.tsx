import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Video, MessageSquare, Upload, Phone, PhoneOff } from "lucide-react";
import { useState } from "react";

const VideoCallPage = () => {
  const [inCall, setInCall] = useState(false);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {!inCall ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
            <Video className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl mb-2">Video Call with Doctor</h2>
            <p className="text-sm text-muted-foreground mb-6">Connect with your healthcare provider instantly</p>
            <div className="glass-card p-4 flex items-center gap-4 max-w-sm mx-auto mb-6">
              <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center text-primary-foreground font-bold">SJ</div>
              <div className="text-left">
                <p className="font-medium text-sm">Dr. Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">Cardiologist · Available</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-success ml-auto" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setInCall(true)} className="px-8 py-3 gradient-blue text-primary-foreground rounded-xl font-semibold text-sm inline-flex items-center gap-2">
              <Phone className="w-4 h-4" /> Start Call
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card aspect-video flex items-center justify-center bg-foreground/5 relative overflow-hidden">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full gradient-blue flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-3">SJ</div>
                <p className="font-medium">Dr. Sarah Johnson</p>
                <p className="text-sm text-muted-foreground animate-pulse-soft">Connected · 02:34</p>
              </div>
              <div className="absolute bottom-4 right-4 w-32 h-24 glass-card flex items-center justify-center text-sm text-muted-foreground">You</div>
            </motion.div>
            <div className="flex items-center justify-center gap-4">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setInCall(false)} className="p-4 rounded-full bg-destructive text-destructive-foreground">
                <PhoneOff className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Chat</h3>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto scrollbar-hide">
              <div className="p-2 rounded-lg bg-muted text-xs"><span className="font-medium">Dr. Johnson:</span> How are you feeling today?</div>
              <div className="p-2 rounded-lg bg-accent text-xs"><span className="font-medium">You:</span> Much better, the new timing is helping.</div>
            </div>
            <input placeholder="Type a message..." className="w-full px-3 py-2 rounded-lg bg-muted text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Prescription Upload</h3>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default VideoCallPage;
