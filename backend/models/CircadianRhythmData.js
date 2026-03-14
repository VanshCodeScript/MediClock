import mongoose from 'mongoose';

const circadianRhythmDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hourlyReadings: [
      {
        hour: {
          type: Number, // 0-23
          required: true,
        },
        cortisol: Number, // Hormone level (0-100 scale)
        melatonin: Number, // Hormone level (0-100 scale)
        temperature: Number, // Core body temperature
        alertness: Number, // Subjective rating 0-10
      },
    ],
    sleepScore: Number, // Predicted sleep quality 0-100
    optimalMedicationTimes: [
      {
        hour: Number,
        medication: String,
        reason: String,
      },
    ],
    recommendedBedTime: String, // HH:MM
    recommendedWakeTime: String, // HH:MM
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
circadianRhythmDataSchema.index({ userId: 1, date: -1 });

export default mongoose.model('CircadianRhythmData', circadianRhythmDataSchema);
