import express from 'express';
import VideoSession from '../models/VideoSession.js';

const router = express.Router();

// Schedule video session
router.post('/', async (req, res) => {
  try {
    const session = new VideoSession(req.body);
    await session.save();
    res.status(201).json({ message: 'Video session scheduled', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sessions for user
router.get('/user/:userId', async (req, res) => {
  try {
    const sessions = await VideoSession.find({ userId: req.params.userId })
      .populate('doctorId', 'name email')
      .sort({ scheduledTime: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sessions for doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const sessions = await VideoSession.find({ doctorId: req.params.doctorId })
      .populate('userId', 'name email')
      .sort({ scheduledTime: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming sessions
router.get('/user/:userId/upcoming', async (req, res) => {
  try {
    const sessions = await VideoSession.find({
      userId: req.params.userId,
      scheduledTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'ongoing'] },
    })
      .populate('doctorId', 'name email')
      .sort({ scheduledTime: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update session
router.put('/:id', async (req, res) => {
  try {
    const session = await VideoSession.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('doctorId', 'name email');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session updated', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start session
router.patch('/:id/start', async (req, res) => {
  try {
    const session = await VideoSession.findByIdAndUpdate(
      req.params.id,
      { status: 'ongoing', startTime: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session started', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End session
router.patch('/:id/end', async (req, res) => {
  try {
    const session = await VideoSession.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', endTime: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session ended', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel session
router.patch('/:id/cancel', async (req, res) => {
  try {
    const session = await VideoSession.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session cancelled', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    const session = await VideoSession.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
