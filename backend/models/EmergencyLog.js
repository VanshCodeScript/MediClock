import mongoose from 'mongoose';

const emergencyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    alertType: {
      type: String,
      enum: ['panic_button', 'distress_phrase', 'inactivity', 'fall', 'manual'],
      default: 'panic_button',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'critical',
    },
    message: {
      type: String,
      default: 'Emergency SOS triggered',
    },
    actionTaken: String,
    status: {
      type: String,
      enum: ['triggered', 'acknowledged', 'resolved', 'false_alarm'],
      default: 'triggered',
    },
    emergencyServicesNotified: {
      type: Boolean,
      default: false,
    },
    ambulanceRequested: {
      type: Boolean,
      default: false,
    },
    callSid: String,
    location: {
      latitude: Number,
      longitude: Number,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: Date,
    resolutionNotes: String,
    isFalseAlarm: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

emergencyLogSchema.index({ userId: 1, triggeredAt: -1 });
emergencyLogSchema.index({ status: 1 });

export default mongoose.model('EmergencyLog', emergencyLogSchema);
