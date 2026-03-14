import mongoose from 'mongoose';

const healthInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['medication', 'nutrition', 'sleep', 'exercise', 'health', 'warning'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionUrl: String, // Link to related page/feature
    relatedData: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel',
    },
    relatedModel: {
      type: String,
      enum: ['Medication', 'MealLog', 'SleepData', 'HealthMetrics'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for insight queries
healthInsightSchema.index({ userId: 1, date: -1 });
healthInsightSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model('HealthInsight', healthInsightSchema);
