import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema(
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
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['once daily', 'twice daily', 'three times daily', 'as needed'],
      required: true,
    },
    foodRule: {
      type: String,
      enum: ['none', 'before food', 'after food', 'with food', 'empty stomach'],
      default: 'none',
    },
    reason: String,
    sideEffects: [String],
    interactions: [String],
    prescribedDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active',
    },
    reminderTimes: {
      type: [String], // Array of "HH:MM" strings, e.g. ["08:00", "20:00"]
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Medication', medicationSchema);
