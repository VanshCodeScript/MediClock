import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
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
    time: {
      type: String,
      required: true, // Format: HH:MM
    },
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    description: String,
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastTakenAt: Date,
    nextDueAt: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'snoozed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Reminder', reminderSchema);
