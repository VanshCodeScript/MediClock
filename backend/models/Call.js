import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    callerName: {
      type: String,
      required: true,
    },
    callerRole: {
      type: String,
      default: 'patient',
    },
    calleeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    calleeRole: {
      type: String,
      default: 'doctor',
    },
    roomName: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ringing', 'accepted', 'rejected', 'ended'],
      default: 'ringing',
    },
    startedAt: Date,
    endedAt: Date,
    durationSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ calleeId: 1, createdAt: -1 });

export default mongoose.model('Call', callSchema);