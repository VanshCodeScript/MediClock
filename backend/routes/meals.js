import express from 'express';
import MealLog from '../models/MealLog.js';

const router = express.Router();

// Create meal log
router.post('/', async (req, res) => {
  try {
    const mealLog = new MealLog(req.body);
    await mealLog.save();
    res.status(201).json({ message: 'Meal logged successfully', mealLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get meals by user and date
router.get('/user/:userId/date/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const meals = await MealLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ time: 1 });

    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all meals for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const meals = await MealLog.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update meal
router.put('/:id', async (req, res) => {
  try {
    const mealLog = await MealLog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!mealLog) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    res.json({ message: 'Meal updated successfully', mealLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete meal
router.delete('/:id', async (req, res) => {
  try {
    const mealLog = await MealLog.findByIdAndDelete(req.params.id);
    if (!mealLog) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nutrition summary for a date
router.get('/user/:userId/summary/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const meals = await MealLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const summary = {
      totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
      totalProtein: meals.reduce((sum, m) => sum + (m.macros?.protein || 0), 0),
      totalCarbs: meals.reduce((sum, m) => sum + (m.macros?.carbs || 0), 0),
      totalFat: meals.reduce((sum, m) => sum + (m.macros?.fat || 0), 0),
      totalSugar: meals.reduce((sum, m) => sum + (m.macros?.sugar || 0), 0),
      mealCount: meals.length,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
