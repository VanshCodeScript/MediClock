import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { HealthAvatar } from '@/components/healthAvatar/HealthAvatar';
import { 
  Activity, 
  Heart, 
  Wind, 
  Zap, 
  Info,
  ShieldCheck,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import StatCard from '@/components/StatCard';

const HealthVisualization3D = () => {
  const metrics = useHealthMetrics();

  // Helper to get status color based on metrics
  const getStatusColor = (val: number, type: 'stress' | 'heart' | 'sugar' | 'sleep') => {
    if (type === 'stress') {
      return val < 40 ? 'text-emerald-500' : val < 70 ? 'text-amber-500' : 'text-rose-500';
    }
    if (type === 'heart') {
      return val < 60 || val > 100 ? 'text-rose-500' : val < 90 ? 'text-emerald-500' : 'text-amber-500';
    }
    if (type === 'sugar') {
      return val < 100 ? 'text-emerald-500' : val < 140 ? 'text-amber-500' : 'text-rose-500';
    }
    if (type === 'sleep') {
      return val >= 80 ? 'text-emerald-500' : val >= 60 ? 'text-amber-500' : 'text-rose-500';
    }
    return 'text-primary';
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-display font-bold text-foreground flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center">
                <Activity className="text-white w-6 h-6" />
              </div>
              3D Health Visualization
            </motion.h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              An interactive digital twin reflecting your physiological state. Rotate and zoom to explore how your metrics affect different body systems.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium flex items-center gap-2">
              <ShieldCheck size={16} /> Live Sync Active
            </div>
            <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-sm font-medium flex items-center gap-2">
              <Clock size={16} /> Real-time Data
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main 3D Model Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            <div className="glass-card relative h-[650px] overflow-hidden group">
              {/* Overlay controls hint */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3 text-white text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Drag to rotate • Scroll to zoom
                </div>
              </div>

              <HealthAvatar className="w-full h-full" />
              
              {/* Bottom attribution/status */}
              <div className="absolute bottom-6 right-6 z-20">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-white/80 text-[10px] uppercase tracking-widest font-bold">
                  Bio-Holographic Engine v2.4
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                title="Stress" 
                value={String(Math.round(metrics.stress))} 
                unit="%" 
                icon={<Activity className="w-5 h-5" />}
                status={metrics.stress < 40 ? 'green' : metrics.stress < 70 ? 'yellow' : 'red'}
              />
              <StatCard 
                title="Heart Rate" 
                value={String(metrics.heartRate)} 
                unit="bpm" 
                icon={<Heart className="w-5 h-5" />}
                status={metrics.heartRate < 60 || metrics.heartRate > 100 ? 'red' : metrics.heartRate < 90 ? 'green' : 'yellow'}
              />
              <StatCard 
                title="Blood Sugar" 
                value={String(metrics.bloodSugar)} 
                unit="mg/dL" 
                icon={<Wind className="w-5 h-5" />}
                status={metrics.bloodSugar < 100 ? 'green' : metrics.bloodSugar < 140 ? 'yellow' : 'red'}
              />
              <StatCard 
                title="Sleep Score" 
                value={String(metrics.sleepScore)} 
                unit="%" 
                icon={<Clock className="w-5 h-5" />}
                status={metrics.sleepScore >= 80 ? 'green' : metrics.sleepScore >= 60 ? 'yellow' : 'red'}
              />
            </div>
          </motion.div>

          {/* Sidebar Insights Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Legend & Summary */}
            <div className="glass-card p-6 space-y-6">
              <h2 className="font-display font-bold text-xl flex items-center gap-2">
                <Zap className="text-amber-500 w-5 h-5" /> Biological Insights
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" /> Cardiovascular
                    </span>
                    <span className={`text-xs font-bold ${getStatusColor(metrics.heartRate, 'heart')}`}>
                      {metrics.heartRate < 90 ? 'OPTIMAL' : 'MONITOR'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Heart rate is currently {metrics.heartRate} bpm. The model's chest cavity glows to represent cardiovascular intensity.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Wind className="w-4 h-4 text-blue-500" /> Metabolic State
                    </span>
                    <span className={`text-xs font-bold ${getStatusColor(metrics.bloodSugar, 'sugar')}`}>
                      {metrics.bloodSugar < 100 ? 'STABLE' : 'ELEVATED'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Blood sugar levels are at {metrics.bloodSugar} mg/dL. Metabolic activity is visualized in the abdominal region.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Stress Response
                    </span>
                    <span className={`text-xs font-bold ${getStatusColor(metrics.stress, 'stress')}`}>
                      {metrics.stress < 40 ? 'LOW' : 'HIGH'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Detected stress levels: {Math.round(metrics.stress)}%. Neural load is represented by the intensity of the cranial glow.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-primary bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <Info size={16} className="shrink-0" />
                  <p className="text-[11px] font-medium leading-tight">
                    This visualization is powered by real-time telemetry from your wearable devices and latest clinical logs.
                  </p>
                </div>
              </div>
            </div>

            {/* Health Narrative/Status */}
            <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <h3 className="font-display font-semibold text-lg mb-3">Today's Outlook</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Based on your digital twin, your overall physical stability is <span className="text-emerald-500 font-bold italic">Excellent</span>. 
                We recommend maintaining your current activity level but keeping an eye on your evening hydration.
              </p>
              <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                View Detailed Analytics
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default HealthVisualization3D;