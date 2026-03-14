import mongoose from 'mongoose';

const medicationAdherenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
    },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['taken', 'missed', 'skipped', 'pending'],
      required: true,
    },
    timeScheduled: String, // HH:MM
    timeTaken: String, // HH:MM (if taken)
    dosageTaken: String, // Actual dosage taken
    notes: String,
    reason: String, // Reason for missing/skipping
  },
  {
    timestamps: true,
  }
);

// Indexes for adherence tracking
medicationAdherenceSchema.index({ userId: 1, date: -1 });
medicationAdherenceSchema.index({ medicationId: 1, date: -1 });

export default mongoose.model('MedicationAdherence', medicationAdherenceSchema);
