import express from 'express';
import NotificationLog from '../models/NotificationLog.js';

const router = express.Router();

// Create notification log
router.post('/', async (req, res) => {
  try {
    const notification = new NotificationLog(req.body);
    await notification.save();
    res.status(201).json({ message: 'Notification logged', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for user
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await NotificationLog.find({
      userId: req.params.userId,
    }).sort({ sentAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notifications
router.get('/user/:userId/unread', async (req, res) => {
  try {
    const notifications = await NotificationLog.find({
      userId: req.params.userId,
      isRead: false,
    }).sort({ sentAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications by type
router.get('/user/:userId/type/:type', async (req, res) => {
  try {
    const notifications = await NotificationLog.find({
      userId: req.params.userId,
      type: req.params.type,
    }).sort({ sentAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await NotificationLog.findByIdAndUpdate(
      req.params.id,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as delivered
router.patch('/:id/delivered', async (req, res) => {
  try {
    const notification = await NotificationLog.findByIdAndUpdate(
      req.params.id,
      {
        isDelivered: true,
        deliveredAt: new Date(),
        status: 'delivered',
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as delivered', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const result = await NotificationLog.updateMany(
      { userId: req.params.userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await NotificationLog.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear old notifications
router.delete('/user/:userId/clear-old', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await NotificationLog.deleteMany({
      userId: req.params.userId,
      sentAt: { $lt: thirtyDaysAgo },
    });

    res.json({
      message: 'Old notifications cleared',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
