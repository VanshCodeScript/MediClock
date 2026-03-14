import mongoose from 'mongoose';

const medicationScheduleRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    circadianProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CircadianProfile',
      required: true,
    },
    
    // Input medications
    medicationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medication',
      },
    ],
    
    // Recommended schedule
    recommendedSchedule: [
      {
        drugName: String,
        dosage: String,
        recommendedTime: String, // HH:MM format
        frequency: String,
        reason: String, // Why this time was chosen
        circadianWindow: String, // morning/afternoon/evening/night
        relatedMealTime: String, // if applicable
        mealRelation: String, // before/after/with food
        conflictResolution: String, // if there was a conflict, how it was resolved
      },
    ],
    
    // Analysis
    conflicts: [
      {
        drug1: String,
        drug2: String,
        conflict: String,
        resolution: String,
      },
    ],
    
    // Overall assessment
    optimization: {
      score: Number, // 0-100
      notes: String,
    },
    
    // Metadata
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userFeedback: {
      isEffective: Boolean,
      notes: String,
      updatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
medicationScheduleRecommendationSchema.index({ userId: 1, generatedAt: -1 });

export default mongoose.model('MedicationScheduleRecommendation', medicationScheduleRecommendationSchema);
