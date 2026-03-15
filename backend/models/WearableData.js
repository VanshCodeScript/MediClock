import mongoose from 'mongoose';

const wearableDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    steps: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    activityLevel: {
      type: String,
      enum: ['idle', 'walking', 'running'],
      required: true,
      default: 'idle',
    },
    movementScore: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

wearableDataSchema.index({ userId: 1, recordedAt: -1 });

export default mongoose.model('WearableData', wearableDataSchema);
