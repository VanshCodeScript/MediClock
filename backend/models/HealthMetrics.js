import mongoose from 'mongoose';

const healthMetricsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    bloodPressure: {
      systolic: Number, // Upper reading
      diastolic: Number, // Lower reading
    },
    bloodSugar: {
      value: Number,
      unit: { type: String, enum: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
    },
    heartRate: Number, // BPM
    spO2: Number, // Blood oxygen percentage
    temperature: {
      value: Number,
      unit: { type: String, enum: ['C', 'F'], default: 'C' },
    },
    weight: Number, // in kg
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
healthMetricsSchema.index({ userId: 1, date: -1 });

export default mongoose.model('HealthMetrics', healthMetricsSchema);
