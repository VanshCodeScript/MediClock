import mongoose from 'mongoose';

const sleepDataSchema = new mongoose.Schema(
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
    hours: {
      type: Number,
      required: true, // Total hours slept
    },
    quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'fair',
    },
    bedTime: String, // HH:MM format
    wakeTime: String, // HH:MM format
    interruptions: {
      type: Number,
      default: 0, // Number of times woke up
    },
    deepSleepHours: Number,
    remSleepHours: Number,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
sleepDataSchema.index({ userId: 1, date: -1 });

export default mongoose.model('SleepData', sleepDataSchema);
