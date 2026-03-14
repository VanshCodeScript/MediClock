import express from 'express';
import HealthInsight from '../models/HealthInsight.js';

const router = express.Router();

// Create health insight (usually by system)
router.post('/', async (req, res) => {
  try {
    const insight = new HealthInsight(req.body);
    await insight.save();
    res.status(201).json({ message: 'Health insight created', insight });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread insights for user
router.get('/user/:userId/unread', async (req, res) => {
  try {
    const insights = await HealthInsight.find({
      userId: req.params.userId,
      isRead: false,
    }).sort({ date: -1 });

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all insights for user
router.get('/user/:userId', async (req, res) => {
  try {
    const { category, severity } = req.query;
    const filter = { userId: req.params.userId };

    if (category) filter.category = category;
    if (severity) filter.severity = severity;

    const insights = await HealthInsight.find(filter).sort({ date: -1 });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark insight as read
router.patch('/:id/read', async (req, res) => {
  try {
    const insight = await HealthInsight.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json({ message: 'Insight marked as read', insight });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete insight
router.delete('/:id', async (req, res) => {
  try {
    const insight = await HealthInsight.findByIdAndDelete(req.params.id);
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    res.json({ message: 'Insight deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
