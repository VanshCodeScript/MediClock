import express from 'express';
import EmergencyContact from '../models/EmergencyContact.js';

const router = express.Router();

// Add emergency contact
router.post('/', async (req, res) => {
  try {
    const contact = new EmergencyContact(req.body);
    await contact.save();
    res.status(201).json({ message: 'Emergency contact added', contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all emergency contacts for user
router.get('/user/:userId', async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.params.userId }).sort({
      isPrimary: -1,
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get primary emergency contact
router.get('/user/:userId/primary', async (req, res) => {
  try {
    const contact = await EmergencyContact.findOne({
      userId: req.params.userId,
      isPrimary: true,
    });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update contact
router.put('/:id', async (req, res) => {
  try {
    const contact = await EmergencyContact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact updated', contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const contact = await EmergencyContact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notify all emergency contacts (for SOS)
router.post('/user/:userId/notify-all', async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.params.userId });

    // Update last notified time
    for (let contact of contacts) {
      contact.lastNotified = new Date();
      await contact.save();
    }

    res.json({ message: 'All contacts notified', contactCount: contacts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
