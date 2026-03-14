import express from 'express';
import EmergencyLog from '../models/EmergencyLog.js';
import EmergencyContact from '../models/EmergencyContact.js';
import twilioSOS from '../services/TwilioSOSService.js';

const router = express.Router();

// POST /api/sos/trigger - Trigger SOS emergency
router.post('/trigger', async (req, res) => {
  try {
    const { userId, userName, reason, location } = req.body;

    if (!userName) {
      return res.status(400).json({ success: false, message: 'userName is required' });
    }

    console.log(`🚨 SOS triggered by ${userName}`);

    // 1. Make emergency call via Twilio
    const callResult = await twilioSOS.triggerEmergencyCall(userName, reason || 'SOS button pressed');

    // 2. Notify all emergency contacts (update lastNotified)
    let contactsNotified = 0;
    if (userId) {
      try {
        const contacts = await EmergencyContact.find({ userId });
        for (const contact of contacts) {
          contact.lastNotified = new Date();
          await contact.save();
        }
        contactsNotified = contacts.length;
      } catch (err) {
        console.error('[SOS] Failed to notify contacts:', err.message);
      }
    }

    // 3. Log to database
    const log = await EmergencyLog.create({
      userId: userId || undefined,
      alertType: 'panic_button',
      severity: 'critical',
      message: reason || `SOS triggered by ${userName}`,
      status: 'triggered',
      emergencyServicesNotified: callResult.success,
      callSid: callResult.callSid || undefined,
      triggeredAt: new Date(),
      ...(location ? { location: { latitude: location.lat, longitude: location.lng } } : {}),
    });

    return res.json({
      success: true,
      callMade: callResult.success,
      callMessage: callResult.message,
      callSid: callResult.callSid,
      callStatus: callResult.callStatus || null,
      callErrorCode: callResult.callErrorCode || null,
      callErrorMessage: callResult.callErrorMessage || null,
      contactsNotified,
      alertId: log._id,
      message: callResult.success
        ? `🚨 Emergency call placed & ${contactsNotified} contacts notified`
        : `⚠️ Call failed (${callResult.message}) but alert logged. ${contactsNotified} contacts notified.`,
    });
  } catch (error) {
    console.error('[SOS] Trigger error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/sos/alerts - Get all SOS alerts
router.get('/alerts', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;

    const alerts = await EmergencyLog.find(filter)
      .sort({ triggeredAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      total: alerts.length,
      alerts: alerts.map((a) => ({
        id: a._id,
        alertType: a.alertType,
        severity: a.severity,
        message: a.message || '',
        status: a.status,
        resolved: ['resolved', 'false_alarm', 'acknowledged'].includes(a.status),
        triggeredAt: a.triggeredAt,
        resolvedAt: a.resolvedAt,
        emergencyServicesNotified: !!a.emergencyServicesNotified,
        location: a.location || null,
      })),
    });
  } catch (error) {
    console.error('[SOS] Get alerts error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/sos/alerts/:id/resolve - Resolve an alert
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const { notes, falseAlarm } = req.body;

    const updated = await EmergencyLog.findByIdAndUpdate(
      req.params.id,
      {
        status: falseAlarm ? 'false_alarm' : 'resolved',
        resolvedAt: new Date(),
        resolutionNotes: notes || undefined,
        isFalseAlarm: !!falseAlarm,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, error: 'Alert not found' });

    return res.json({ success: true, alert: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sos/status - Check Twilio configuration status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    twilioConfigured: twilioSOS.isConfigured(),
    message: twilioSOS.isConfigured()
      ? 'Twilio is configured and ready'
      : 'Twilio is not configured. Add credentials to .env',
  });
});

// GET /api/sos/calls/:sid - Inspect Twilio call diagnostic details
router.get('/calls/:sid', async (req, res) => {
  try {
    if (!twilioSOS.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Twilio is not configured. Add credentials to .env',
      });
    }

    const details = await twilioSOS.getCallDetails(req.params.sid);
    if (!details) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    return res.json({ success: true, call: details });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
