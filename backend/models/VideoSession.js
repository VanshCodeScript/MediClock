import mongoose from 'mongoose';

const videoSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: String,
    description: String,
    scheduledTime: {
      type: Date,
      required: true,
    },
    startTime: Date,
    endTime: Date,
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    roomId: String, // Video conference room ID
    notes: String,
    prescription: String, // Doctor's prescription/notes
    recordingUrl: String, // Link to recorded session (if enabled)
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
videoSessionSchema.index({ userId: 1, scheduledTime: -1 });
videoSessionSchema.index({ doctorId: 1, scheduledTime: -1 });

export default mongoose.model('VideoSession', videoSessionSchema);
