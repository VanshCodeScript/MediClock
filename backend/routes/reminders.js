import express from 'express';
import Reminder from '../models/Reminder.js';
import {
  buildMedicationTimelineForUser,
  sendDueWhatsAppRemindersForUser,
} from '../services/reminderService.js';

const router = express.Router();

// Create a new reminder
router.post('/', async (req, res) => {
  try {
    const reminder = new Reminder(req.body);
    await reminder.save();
    res.status(201).json({ message: 'Reminder created successfully', reminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reminders/today/:userId
 * Returns today's reminders as a flat list with status derived from the
 * current time (pending / taken / missed).
 */
router.get('/today/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Daily rollover: completed reminders from previous days should be pending again today.
    await Reminder.updateMany(
      {
        userId,
        status: 'active',
        isCompleted: true,
        $or: [{ lastTakenAt: { $lt: startOfDay } }, { lastTakenAt: { $exists: false } }],
      },
      { $set: { isCompleted: false } }
    );

    const { timeline } = await buildMedicationTimelineForUser(userId, new Date());

    const existingReminders = await Reminder.find({
      userId,
      status: 'active',
    })
      .select('_id medicationId time')
      .lean();

    const reminderByMedAndTime = new Map(
      existingReminders.map((r) => [
        `${String(r.medicationId)}|${String(r.time || '')}`,
        r,
      ])
    );

    const rows = [];
    for (const item of timeline) {
      const medicationId = item.medicationId ? String(item.medicationId) : '';
      const medicationTime = String(item.medicationTime || '00:00');
      const key = `${medicationId}|${medicationTime}`;

      let reminder = reminderByMedAndTime.get(key);
      if (!reminder && medicationId) {
        // Ensure schedule-derived medications are visible/trackable in reminder UI.
        reminder = await Reminder.findOneAndUpdate(
          { userId, medicationId, time: medicationTime, status: 'active' },
          {
            $setOnInsert: {
              userId,
              medicationId,
              time: medicationTime,
              status: 'active',
            },
          },
          { new: true, upsert: true }
        )
          .select('_id medicationId time')
          .lean();

        if (reminder) {
          reminderByMedAndTime.set(key, reminder);
        }
      }

      rows.push({
        _id: reminder?._id || `${medicationId}-${medicationTime}`,
        medicineName: item.medicationName || 'Unknown',
        dosage: item.dosage || '',
        time: medicationTime,
        status:
          item.status === 'taken'
            ? 'taken'
            : item.status === 'missed'
              ? 'missed'
              : 'pending',
      });
    }

    const mapped = rows;

    // Sort earliest first
    mapped.sort((a, b) => a.time.localeCompare(b.time));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reminders for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.params.userId })
      .populate('medicationId');
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedule-derived reminder timeline (sorted by reminder time)
router.get('/user/:userId/timeline', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await buildMedicationTimelineForUser(userId, new Date());

    res.json({
      userId,
      timeline: result.timeline,
      whatsappConfigured: result.whatsappConfigured,
      total: result.timeline.length,
      pending: result.timeline.filter((r) => r.status === 'pending' || r.status === 'due').length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger due WhatsApp sends (useful for page-trigger + testing)
router.post('/user/:userId/send-due-whatsapp', async (req, res) => {
  try {
    const { userId } = req.params;
    const force = Boolean(req.body?.force);
    const resendSent = Boolean(req.body?.resendSent);
    const sendResult = await sendDueWhatsAppRemindersForUser(userId, new Date(), { force, resendSent });
    const timelineResult = await buildMedicationTimelineForUser(userId, new Date());

    res.json({
      message: force ? 'Force WhatsApp reminder check completed' : 'Due WhatsApp reminder check completed',
      sendResult,
      timeline: timelineResult.timeline,
      whatsappConfigured: timelineResult.whatsappConfigured,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reminder by ID
router.get('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id).populate('medicationId');
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reminder
router.put('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('medicationId');

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder updated successfully', reminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark reminder as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      {
        isCompleted: true,
        lastTakenAt: new Date(),
      },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder marked as completed', reminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
