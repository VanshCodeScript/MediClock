import express from 'express';
import MedicationAdherence from '../models/MedicationAdherence.js';

const router = express.Router();

// Record adherence
router.post('/', async (req, res) => {
  try {
    const adherence = new MedicationAdherence(req.body);
    await adherence.save();
    res.status(201).json({ message: 'Adherence recorded', adherence });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adherence for user
router.get('/user/:userId', async (req, res) => {
  try {
    const adherence = await MedicationAdherence.find({
      userId: req.params.userId,
    }).sort({ date: -1 });
    res.json(adherence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adherence for medication
router.get('/medication/:medicationId', async (req, res) => {
  try {
    const adherence = await MedicationAdherence.find({
      medicationId: req.params.medicationId,
    }).sort({ date: -1 });
    res.json(adherence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adherence rate for user (percentage)
router.get('/user/:userId/rate', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { startDate, endDate } = req.query;

    const filter = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const adherence = await MedicationAdherence.find(filter);

    const taken = adherence.filter((a) => a.status === 'taken').length;
    const total = adherence.length;
    const rate = total > 0 ? ((taken / total) * 100).toFixed(1) : 0;

    res.json({
      adherenceRate: rate,
      taken,
      missed: adherence.filter((a) => a.status === 'missed').length,
      skipped: adherence.filter((a) => a.status === 'skipped').length,
      pending: adherence.filter((a) => a.status === 'pending').length,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adherence for specific date
router.get('/user/:userId/date/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const adherence = await MedicationAdherence.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ timeScheduled: 1 });

    res.json(adherence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update adherence
router.put('/:id', async (req, res) => {
  try {
    const adherence = await MedicationAdherence.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!adherence) {
      return res.status(404).json({ error: 'Adherence record not found' });
    }

    res.json({ message: 'Adherence updated', adherence });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete adherence
router.delete('/:id', async (req, res) => {
  try {
    const adherence = await MedicationAdherence.findByIdAndDelete(req.params.id);
    if (!adherence) {
      return res.status(404).json({ error: 'Adherence record not found' });
    }
    res.json({ message: 'Adherence deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
