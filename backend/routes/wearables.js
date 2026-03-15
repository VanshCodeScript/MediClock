import express from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/authMiddleware.js';
import WearableData from '../models/WearableData.js';

const router = express.Router();
const ACTIVITY_LEVELS = new Set(['idle', 'walking', 'running']);
const MAX_MOVEMENT_SCORE = 20;

const classifyActivityLevel = (movementScore) => {
  if (movementScore < 1.5) return 'idle';
  if (movementScore <= 4) return 'walking';
  return 'running';
};

const normalizePayload = (body = {}, authenticatedUserId = '') => {
  const incomingUserId = String(body.userId || '').trim();
  if (!incomingUserId) {
    return { error: 'userId is required' };
  }

  if (incomingUserId !== String(authenticatedUserId || '').trim()) {
    return { error: 'userId does not match authenticated user' };
  }

  const parsedSteps = Number(body.steps);
  const parsedMovementScore = Number(body.movementScore);

  if (!Number.isFinite(parsedSteps) || parsedSteps < 0) {
    return { error: 'steps must be a non-negative number' };
  }

  if (
    !Number.isFinite(parsedMovementScore) ||
    parsedMovementScore < 0 ||
    parsedMovementScore > MAX_MOVEMENT_SCORE
  ) {
    return { error: `movementScore must be between 0 and ${MAX_MOVEMENT_SCORE}` };
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
    userId: incomingUserId,
    steps: Math.round(parsedSteps),
    activityLevel,
    movementScore: Number(parsedMovementScore.toFixed(2)),
    recordedAt: timestamp,
  };
};

const buildWearableResponse = (record) => ({
  steps: record?.steps ?? 0,
  activityLevel: record?.activityLevel ?? 'idle',
  movementScore: Number(record?.movementScore ?? 0),
  recordedAt: record?.recordedAt ?? null,
});

const validateWearablePayload = (req, res, next) => {
  const normalized = normalizePayload(req.body, req.user?.id);
  if (normalized.error) {
    const isForbidden = normalized.error === 'userId does not match authenticated user';
    return res.status(isForbidden ? 403 : 400).json({ error: normalized.error });
  }

  req.normalizedWearablePayload = normalized;
  return next();
};

router.post('/update', protect, validateWearablePayload, async (req, res) => {
  try {
    const normalized = req.normalizedWearablePayload;


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
