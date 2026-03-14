import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { HealthAvatar } from "@/components/healthAvatar/HealthAvatar";
import { useHealthMetrics } from "@/hooks/useHealthMetrics";
import { getColorHex, getStressColor, getSugarColor, getHeartRiskColor, getSleepColor, getMedicationRiskColor } from "@/utils/healthColorUtils";

const HealthVisualization3D = () => {
  const metrics = useHealthMetrics();

  const statusLegend = [
    { status: "Normal", color: "#22c55e" },
    { status: "Warning", color: "#fbbf24" },
    { status: "Critical", color: "#ef4444" },
  ];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 3D Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden rounded-2xl"
          style={{ height: "62vh" }}
        >
          <HealthAvatar className="w-full h-full" />
        </motion.div>

        {/* Health Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {/* Stress Level Card */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getColorHex(getStressColor(metrics.stress)) }}
              />
              <p className="text-sm font-medium text-muted-foreground">Stress Level</p>
            </div>
            <p className="text-2xl font-bold">{Math.round(metrics.stress)}%</p>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.stress < 40 ? "Normal" : metrics.stress < 70 ? "Elevated" : "High"}
            </p>
          </div>

          {/* Heart Rate Card */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: getColorHex(
                    getHeartRiskColor((metrics.heartRate - 40) / 80 * 100)
                  ),
                }}
              />
              <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
            </div>
            <p className="text-2xl font-bold">{Math.round(metrics.heartRate)}</p>
            <p className="text-xs text-muted-foreground mt-2">bpm</p>
          </div>

          {/* Blood Sugar Card */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getColorHex(getSugarColor(metrics.bloodSugar)) }}
              />
              <p className="text-sm font-medium text-muted-foreground">Blood Sugar</p>
            </div>
            <p className="text-2xl font-bold">{Math.round(metrics.bloodSugar)}</p>
            <p className="text-xs text-muted-foreground mt-2">mg/dL</p>
          </div>

          {/* Sleep Quality Card */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getColorHex(getSleepColor(metrics.sleepScore)) }}
              />
              <p className="text-sm font-medium text-muted-foreground">Sleep Quality</p>
            </div>
            <p className="text-2xl font-bold">{Math.round(metrics.sleepScore)}%</p>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.sleepScore >= 80 ? "Excellent" : metrics.sleepScore >= 60 ? "Fair" : "Poor"}
            </p>
          </div>

          {/* Medication Risk Card */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: getColorHex(getMedicationRiskColor(metrics.medicationRisk)),
                }}
              />
              <p className="text-sm font-medium text-muted-foreground">Med. Risk</p>
            </div>
            <p className="text-2xl font-bold">{Math.round(metrics.medicationRisk)}%</p>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.medicationRisk < 30 ? "Low" : metrics.medicationRisk < 60 ? "Moderate" : "High"}
            </p>
          </div>
        </motion.div>

        {/* Information Panels */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Legend */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="font-semibold mb-4">Status Legend</h3>
            <div className="space-y-3">
              {statusLegend.map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="font-semibold mb-4">Visualization Guide</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• <strong>Head:</strong> Changes color based on stress level</p>
              <p>• <strong>Chest:</strong> Pulses with heart rate, shows medication risk</p>
              <p>• <strong>Abdomen:</strong> Reflects blood sugar levels</p>
              <p>• <strong>Glow Effect:</strong> Indicates warning/critical zones</p>
            </div>
          </div>
        </motion.div>

        {/* Metrics Details */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="font-semibold text-lg mb-4">Detailed Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Stress Level Analysis</p>
              <p className="text-xs">
                {metrics.stress < 40
                  ? "Your stress levels are healthy. Keep up good stress management practices."
                  : metrics.stress < 70
                  ? "Moderate stress detected. Consider relaxation techniques or meditation."
                  : "High stress levels detected. Consult healthcare provider for guidance."}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Heart Rate Analysis</p>
              <p className="text-xs">
                {metrics.heartRate < 60
                  ? "Resting heart rate is good. Excellent cardiovascular health indicator."
                  : metrics.heartRate < 100
                  ? "Heart rate is within normal range. Continue healthy lifestyle habits."
                  : "Elevated heart rate. Monitor activity levels and stress."}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Blood Sugar Analysis</p>
              <p className="text-xs">
                {metrics.bloodSugar < 100
                  ? "Blood sugar levels are optimal. Maintain current dietary habits."
                  : metrics.bloodSugar < 140
                  ? "Borderline blood sugar. Monitor carbohydrate intake."
                  : "High blood sugar levels. Consult doctor for dietary adjustments."}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Sleep Quality Analysis</p>
              <p className="text-xs">
                {metrics.sleepScore >= 80
                  ? "Excellent sleep quality. Maintain your current sleep schedule."
                  : metrics.sleepScore >= 60
                  ? "Fair sleep quality. Consider improving sleep hygiene."
                  : "Poor sleep quality. Establish better sleep routine and environment."}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Medication Safety</p>
              <p className="text-xs">
                {metrics.medicationRisk < 30
                  ? "Low medication interaction risk. Current regimen is safe."
                  : metrics.medicationRisk < 60
                  ? "Moderate interaction risk. Monitor for side effects."
                  : "High interaction risk. Consult pharmacist immediately."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default HealthVisualization3D;
