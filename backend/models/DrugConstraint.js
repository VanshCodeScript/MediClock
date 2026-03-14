import mongoose from 'mongoose';

const drugConstraintSchema = new mongoose.Schema(
  {
    drugName: {
      type: String,
      required: true,
      lowercase: true,
    },
    generic: String,
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['once daily', 'twice daily', 'three times daily', 'four times daily', 'as needed'],
      required: true,
    },
    
    // Food constraints
    foodRule: {
      type: String,
      enum: ['before food', 'after food', 'with food', 'with full meal', 'empty stomach', 'none'],
      default: 'none',
    },
    foodBuffer: {
      type: Number,
      default: 0, // minutes before/after food
    },
    
    // Circadian preferences
    preferredCircadianWindow: {
      type: [String],
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: ['morning'],
    },
    avoidTimes: [String], // HH:MM format - times to avoid
    
    // Spacing between doses
    spacingHours: {
      type: Number,
      default: null, // for multiple daily doses
    },
    
    // Drug interactions
    incompatibleDrugs: [String], // drug names that shouldn't be taken together
    minimumSpacingHours: {
      type: Number,
      default: 0, // minimum hours between this and incompatible drugs
    },
    
    // Scientific rationale
    explanation: {
      type: String,
      required: true,
    },
    evidence: String,
    
    // Metabolism info
    peakAbsorptionTime: Number, // hours after taking
    halfLife: Number, // hours
    
    // Metadata
    therapeutic: String,
    sideEffects: [String],
    isGeneral: {
      type: Boolean,
      default: false, // System drug vs user-specific
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
drugConstraintSchema.index({ drugName: 1 });
drugConstraintSchema.index({ frequency: 1 });

export default mongoose.model('DrugConstraint', drugConstraintSchema);
