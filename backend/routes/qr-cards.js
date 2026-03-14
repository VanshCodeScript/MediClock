import express from 'express';
import QRCard from '../models/QRCard.js';

const router = express.Router();

// Generate/Create QR card
router.post('/', async (req, res) => {
  try {
    const qrCard = new QRCard(req.body);
    await qrCard.save();
    res.status(201).json({ message: 'QR card generated', qrCard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get QR card for user
router.get('/user/:userId', async (req, res) => {
  try {
    const qrCard = await QRCard.findOne({ userId: req.params.userId });
    if (!qrCard) {
      return res.status(404).json({ error: 'QR card not found' });
    }
    res.json(qrCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get public QR card by URL
router.get('/public/:qrUrl', async (req, res) => {
  try {
    const qrCard = await QRCard.findOne({
      qrUrl: req.params.qrUrl,
      isPublic: true,
    }).select('-userId');

    if (!qrCard) {
      return res.status(404).json({ error: 'QR card not found' });
    }

    res.json(qrCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update QR card
router.put('/:id', async (req, res) => {
  try {
    const qrCard = await QRCard.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!qrCard) {
      return res.status(404).json({ error: 'QR card not found' });
    }

    res.json({ message: 'QR card updated', qrCard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle public/private
router.patch('/:id/toggle-public', async (req, res) => {
  try {
    const qrCard = await QRCard.findById(req.params.id);

    if (!qrCard) {
      return res.status(404).json({ error: 'QR card not found' });
    }

    qrCard.isPublic = !qrCard.isPublic;
    await qrCard.save();

    res.json({ message: `QR card is now ${qrCard.isPublic ? 'public' : 'private'}`, qrCard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete QR card
router.delete('/:id', async (req, res) => {
  try {
    const qrCard = await QRCard.findByIdAndDelete(req.params.id);
    if (!qrCard) {
      return res.status(404).json({ error: 'QR card not found' });
    }
    res.json({ message: 'QR card deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
