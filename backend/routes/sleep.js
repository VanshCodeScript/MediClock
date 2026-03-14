import express from 'express';
import SleepData from '../models/SleepData.js';

const router = express.Router();

// Record sleep data
router.post('/', async (req, res) => {
  try {
    const sleepData = new SleepData(req.body);
    await sleepData.save();
    res.status(201).json({ message: 'Sleep data recorded', sleepData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sleep data by user
router.get('/user/:userId', async (req, res) => {
  try {
    const sleepData = await SleepData.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sleep data for a week
router.get('/user/:userId/week/:startDate', async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const sleepData = await SleepData.find({
      userId: req.params.userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sleep analytics
router.get('/user/:userId/analytics', async (req, res) => {
  try {
    const sleepData = await SleepData.find({ userId: req.params.userId }).sort({ date: -1 }).limit(30);

    const analytics = {
      averageHours: (sleepData.reduce((sum, s) => sum + s.hours, 0) / sleepData.length).toFixed(1),
      bestNight: Math.max(...sleepData.map((s) => s.hours)),
      worstNight: Math.min(...sleepData.map((s) => s.hours)),
      qualityBreakdown: {
        excellent: sleepData.filter((s) => s.quality === 'excellent').length,
        good: sleepData.filter((s) => s.quality === 'good').length,
        fair: sleepData.filter((s) => s.quality === 'fair').length,
        poor: sleepData.filter((s) => s.quality === 'poor').length,
      },
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sleep data
router.put('/:id', async (req, res) => {
  try {
    const sleepData = await SleepData.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!sleepData) {
      return res.status(404).json({ error: 'Sleep data not found' });
    }
    res.json({ message: 'Sleep data updated', sleepData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete sleep data
router.delete('/:id', async (req, res) => {
  try {
    const sleepData = await SleepData.findByIdAndDelete(req.params.id);
    if (!sleepData) {
      return res.status(404).json({ error: 'Sleep data not found' });
    }
    res.json({ message: 'Sleep data deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
