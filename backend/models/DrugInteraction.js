import mongoose from 'mongoose';

const drugInteractionSchema = new mongoose.Schema(
  {
    drugA: {
      type: String,
      required: true,
      lowercase: true,
    },
    drugB: {
      type: String,
      required: true,
      lowercase: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    spacing: {
      type: String,
      required: true, // e.g., "4 hours apart", "No spacing needed", "Avoid"
    },
    note: {
      type: String,
      required: true, // Description of interaction
    },
    source: String, // Source of information
  },
  {
    timestamps: true,
  }
);

// Compound index for drug pair lookups
drugInteractionSchema.index({ drugA: 1, drugB: 1 });

export default mongoose.model('DrugInteraction', drugInteractionSchema);
