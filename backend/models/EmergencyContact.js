import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    relationship: {
      type: String,
      enum: ['Family', 'Doctor', 'Friend', 'Spouse', 'Other'],
      required: true,
    },
    email: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
    lastNotified: Date,
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
emergencyContactSchema.index({ userId: 1, isPrimary: -1 });

export default mongoose.model('EmergencyContact', emergencyContactSchema);
