import express from 'express';
import mongoose from 'mongoose';
import Medication from '../models/Medication.js';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import { sendMedicationAlert } from '../services/whatsappService.js';

const router = express.Router();

// Default reminder times derived from frequency
const defaultReminderTimes = {
  'once daily': ['08:00'],
  'twice daily': ['08:00', '20:00'],
  'three times daily': ['08:00', '14:00', '20:00'],
  'as needed': [],
};

// Create a new medication
router.post('/', async (req, res) => {
  try {
    const { frequency, reminderTimes: providedTimes, ...rest } = req.body;

    // Compute reminder times: use provided times or fall back to frequency defaults
    const reminderTimes =
      Array.isArray(providedTimes) && providedTimes.length > 0
        ? providedTimes
        : (defaultReminderTimes[frequency] ?? []);

    const medication = new Medication({ ...rest, frequency, reminderTimes });
    await medication.save();

    // Auto-create one Reminder doc per reminder time
    if (medication.userId && reminderTimes.length > 0) {
      const reminderDocs = reminderTimes.map((time) => ({
        userId: medication.userId,
        medicationId: medication._id,
        time,
        status: 'active',
      }));
      await Reminder.insertMany(reminderDocs);

      // Send WhatsApp alert — fire-and-forget, don't block the response
      const user = await User.findById(medication.userId).select('name').lean();
      sendMedicationAlert({
        medicineName: medication.name,
        dosage: medication.dosage,
        times: reminderTimes,
        userName: user?.name || '',
      });
    }

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
