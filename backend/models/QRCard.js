import mongoose from 'mongoose';

const qrCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    healthData: {
      bloodType: String,
      allergies: [String],
      medications: [String],
      emergencyContacts: [
        {
          name: String,
          phone: String,
        },
      ],
      medicalConditions: [String],
      doctorName: String,
      doctorPhone: String,
    },
    qrCode: String, // Base64 encoded QR code image
    qrUrl: String, // Public URL to access the health card
    isPublic: {
      type: Boolean,
      default: false,
    },
    generatedDate: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: Date,
    expiryDate: Date,
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
qrCardSchema.index({ userId: 1 });
qrCardSchema.index({ qrUrl: 1 }, { sparse: true });

export default mongoose.model('QRCard', qrCardSchema);
