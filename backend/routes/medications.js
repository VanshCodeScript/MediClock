import express from 'express';
import mongoose from 'mongoose';
import Medication from '../models/Medication.js';

const router = express.Router();

// Create a new medication
router.post('/', async (req, res) => {
  try {
    const medication = new Medication(req.body);
    await medication.save();
    res.status(201).json({ message: 'Medication added successfully', medication });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all medications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.json([]);
    }
    const medications = await Medication.find({ userId: req.params.userId });
    res.json(medications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medication by ID
router.get('/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    res.json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update medication
router.put('/:id', async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json({ message: 'Medication updated successfully', medication });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete medication
router.delete('/:id', async (req, res) => {
  try {
    const medication = await Medication.findByIdAndDelete(req.params.id);

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
