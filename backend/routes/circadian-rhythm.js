import express from 'express';
import CircadianRhythmData from '../models/CircadianRhythmData.js';

const router = express.Router();

// Record circadian rhythm data
router.post('/', async (req, res) => {
  try {
    const data = new CircadianRhythmData(req.body);
    await data.save();
    res.status(201).json({ message: 'Circadian rhythm data recorded', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get circadian data by user and date
router.get('/user/:userId/date/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const data = await CircadianRhythmData.findOne({
      userId,
      date: targetDate,
    });

    if (!data) {
      return res.status(404).json({ error: 'No circadian data for this date' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest circadian data
router.get('/user/:userId/latest', async (req, res) => {
  try {
    const data = await CircadianRhythmData.findOne({ userId: req.params.userId }).sort({
      date: -1,
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly circadian trends
router.get('/user/:userId/week/:startDate', async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const data = await CircadianRhythmData.find({
      userId: req.params.userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get optimal medication times
router.get('/user/:userId/optimal-times/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const data = await CircadianRhythmData.findOne({
      userId,
      date: targetDate,
    });

    if (!data) {
      return res.status(404).json({ error: 'No circadian data for this date' });
    }

    res.json({
      optimalMedicationTimes: data.optimalMedicationTimes,
      recommendedBedTime: data.recommendedBedTime,
      recommendedWakeTime: data.recommendedWakeTime,
      sleepScore: data.sleepScore,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update circadian data
router.put('/:id', async (req, res) => {
  try {
    const data = await CircadianRhythmData.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!data) {
      return res.status(404).json({ error: 'Circadian data not found' });
    }

    res.json({ message: 'Circadian data updated', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete circadian data
router.delete('/:id', async (req, res) => {
  try {
    const data = await CircadianRhythmData.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'Circadian data not found' });
    }
    res.json({ message: 'Circadian data deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
