import express from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/authMiddleware.js';
import WearableData from '../models/WearableData.js';

const router = express.Router();
const ACTIVITY_LEVELS = new Set(['resting', 'walking', 'running']);

const classifyActivityLevel = (movementScore) => {
  if (movementScore < 5) return 'resting';
  if (movementScore < 15) return 'walking';
  return 'running';
};

const normalizePayload = (body = {}) => {
  const parsedSteps = Number(body.steps);
  const parsedMovementScore = Number(body.movementScore);

  if (!Number.isFinite(parsedSteps) || parsedSteps < 0) {
    return { error: 'steps must be a non-negative number' };
  }

  if (!Number.isFinite(parsedMovementScore) || parsedMovementScore < 0) {
    return { error: 'movementScore must be a non-negative number' };
  }

  const normalizedActivityLevel = String(body.activityLevel || '').toLowerCase().trim();
  const activityLevel = ACTIVITY_LEVELS.has(normalizedActivityLevel)
    ? normalizedActivityLevel
    : classifyActivityLevel(parsedMovementScore);

  const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();
  if (Number.isNaN(timestamp.getTime())) {
    return { error: 'timestamp must be a valid ISO date string' };
  }

  return {
    // Store amplified step count so all clients/reports read consistent values.
    steps: Math.round(parsedSteps * 2),
    activityLevel,
    movementScore: Number(parsedMovementScore.toFixed(2)),
    recordedAt: timestamp,
  };
};

const buildWearableResponse = (record) => ({
  steps: record?.steps ?? 0,
  activityLevel: record?.activityLevel ?? 'resting',
  movementScore: Number(record?.movementScore ?? 0),
  recordedAt: record?.recordedAt ?? null,
});

router.post('/update', protect, async (req, res) => {
  try {
    const normalized = normalizePayload(req.body);
    if (normalized.error) {
      return res.status(400).json({ error: normalized.error });
    }


    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const wearableRecord = await WearableData.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          steps: normalized.steps,
          activityLevel: normalized.activityLevel,
          movementScore: normalized.movementScore,
          recordedAt: normalized.recordedAt,
        },
        $setOnInsert: {
          userId: userObjectId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );


    return res.status(201).json({
      message: 'Wearable data updated',
      wearableData: buildWearableResponse(wearableRecord),
    });
  } catch (error) {
    console.error('Wearables update failed:', error);
    return res.status(500).json({ error: error.message || 'Unable to update wearable data' });
  }
});

router.get('/latest', protect, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const latest = await WearableData.findOne({ userId: userObjectId }).sort({ recordedAt: -1 });
    return res.json(buildWearableResponse(latest));
  } catch (error) {
    console.error('Wearables latest failed:', error);
    return res.status(500).json({ error: error.message || 'Unable to fetch wearable data' });
  }
});

// Backward-compatible alias for older frontend code.
router.get('/sync', protect, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const latest = await WearableData.findOne({ userId: userObjectId }).sort({ recordedAt: -1 });
    return res.json(buildWearableResponse(latest));
  } catch (error) {
    console.error('Wearables sync failed:', error);
    return res.status(500).json({ error: error.message || 'Unable to sync wearable data' });
  }
});

export default router;
