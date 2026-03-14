import express from 'express';
import HealthMetrics from '../models/HealthMetrics.js';

const router = express.Router();

// Record health metrics
router.post('/', async (req, res) => {
  try {
    const metrics = new HealthMetrics(req.body);
    await metrics.save();
    res.status(201).json({ message: 'Health metrics recorded', metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get metrics by user (with optional date range)
router.get('/user/:userId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.params.userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const metrics = await HealthMetrics.find(filter).sort({ date: -1 });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest metrics for user
router.get('/user/:userId/latest', async (req, res) => {
  try {
    const metrics = await HealthMetrics.findOne({ userId: req.params.userId }).sort({
      date: -1,
    });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update metrics
router.put('/:id', async (req, res) => {
  try {
    const metrics = await HealthMetrics.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!metrics) {
      return res.status(404).json({ error: 'Metrics not found' });
    }
    res.json({ message: 'Metrics updated', metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete metrics
router.delete('/:id', async (req, res) => {
  try {
    const metrics = await HealthMetrics.findByIdAndDelete(req.params.id);
    if (!metrics) {
      return res.status(404).json({ error: 'Metrics not found' });
    }
    res.json({ message: 'Metrics deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
