import mongoose from 'mongoose';

const circadianProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,  // Changed from ObjectId ref to String for flexibility with demo data
      required: true,
      // Note: In production, consider using ObjectId ref to User model
      index: true,
    },
    // Time schedule
    wakeTime: {
      type: String, // HH:MM format
      required: true,
    },
    sleepTime: {
      type: String,
      required: true,
    },
    breakfastTime: {
      type: String,
      required: true,
    },
    lunchTime: {
      type: String,
      required: true,
    },
    dinnerTime: {
      type: String,
      required: true,
    },
    
    // Work schedule
    workType: {
      type: String,
      enum: ['day shift', 'night shift', 'flexible'],
      default: 'day shift',
    },
    workStartTime: String,
    workEndTime: String,
    
    // Exercise
    exerciseTime: String,
    exerciseDuration: Number, // in minutes
    
    // Chronotype
    chronotype: {
      type: String,
      enum: ['morning person', 'night owl', 'intermediate'],
      default: 'intermediate',
    },
    
    // Timezone
    timezone: {
      type: String,
      default: 'UTC',
    },
    
    // Additional notes
    notes: String,
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick user lookups
circadianProfileSchema.index({ userId: 1 });

export default mongoose.model('CircadianProfile', circadianProfileSchema);
