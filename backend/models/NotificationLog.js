import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
    },
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
    },
    type: {
      type: String,
      enum: ['reminder', 'alert', 'insight', 'emergency'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['mobile', 'email', 'sms', 'whatsapp', 'push'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    readAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for notification tracking
notificationLogSchema.index({ userId: 1, sentAt: -1 });
notificationLogSchema.index({ userId: 1, isRead: 1 });
notificationLogSchema.index({ status: 1 });

export default mongoose.model('NotificationLog', notificationLogSchema);
