import mongoose from 'mongoose';

const mealLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
      required: true,
    },
    items: {
      type: String,
      required: true,
    },
    calories: {
      type: Number,
      required: true,
    },
    macros: {
      protein: { type: Number, default: 0 }, // in grams
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
    },
    time: {
      type: String, // HH:MM format
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for quick user meal queries
mealLogSchema.index({ userId: 1, date: -1 });

export default mongoose.model('MealLog', mealLogSchema);
