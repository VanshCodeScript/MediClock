import express from 'express';
import CircadianProfile from '../models/CircadianProfile.js';

const router = express.Router();

// Create/Update circadian profile
router.post('/', async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if profile exists
    let profile = await CircadianProfile.findOne({ userId });

    if (profile) {
      // Update existing
      profile = await CircadianProfile.findOneAndUpdate({ userId }, req.body, {
        new: true,
        runValidators: true,
      });
    } else {
      // Create new
      profile = new CircadianProfile(req.body);
      await profile.save();
    }

    res.status(201).json({ message: 'Circadian profile saved', profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get circadian profile for user
router.get('/user/:userId', async (req, res) => {
  try {
    const profile = await CircadianProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update circadian profile
router.put('/:id', async (req, res) => {
  try {
    const profile = await CircadianProfile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ message: 'Profile updated', profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete circadian profile
router.delete('/:id', async (req, res) => {
  try {
    const profile = await CircadianProfile.findByIdAndDelete(req.params.id);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ message: 'Profile deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
