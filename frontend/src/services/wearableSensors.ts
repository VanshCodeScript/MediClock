import { api } from '@/lib/api';

export type ActivityLevel = 'idle' | 'walking' | 'running';

export type WearableSnapshot = {
  steps: number;
  activityLevel: ActivityLevel;
  movementScore: number;
  heartRate: number;
  timestamp: string;
};

export type SensorStartResult = {
  started: boolean;
  requiresPermission?: boolean;
  message?: string;
};

type MotionPermissionState = 'granted' | 'denied' | 'default';

const TRANSMIT_INTERVAL_MS = 15 * 1000;
const HEART_RATE_UPDATE_MS = 3 * 1000;
const STEP_UPDATE_MS = 5 * 1000;
const MAX_SIMULATED_STEPS = 15;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const nextStepIncrement = () => {
  const roll = Math.random();
  if (roll < 0.65) return 0;
  if (roll < 0.95) return 1;
  return 2;
};

class WearableSensorsService {
  private steps = 0;
  private movementScore = 0.8;
  private heartRate = 72;
  private activityLevel: ActivityLevel = 'walking';
  private transmitIntervalId: number | null = null;
  private heartRateIntervalId: number | null = null;
  private stepsIntervalId: number | null = null;
  private running = false;
  private permissionState: MotionPermissionState = 'default';
  private onUpdate: ((snapshot: WearableSnapshot) => void) | null = null;
  private onError: ((message: string) => void) | null = null;

  setCallbacks(callbacks: {
    onUpdate?: (snapshot: WearableSnapshot) => void;
    onError?: (message: string) => void;
  }) {
    this.onUpdate = callbacks.onUpdate || null;
    this.onError = callbacks.onError || null;
  }

  async start(): Promise<SensorStartResult> {
    if (this.running) {
      return { started: true };
    }

    this.running = true;
    this.activityLevel = 'walking';
    this.permissionState = 'granted';
    this.startSimulationLoops();
    this.startUploadLoop();
    this.emitUpdate();

    return {
      started: true,
      message: 'Wearable demo simulation is active.',
    };
  }

  async requestPermissionAndStart(): Promise<SensorStartResult> {
    return this.start();
  }

  stop() {
    if (!this.running) {
      return;
    }

    if (this.transmitIntervalId !== null) {
      window.clearInterval(this.transmitIntervalId);
      this.transmitIntervalId = null;
    }

    if (this.heartRateIntervalId !== null) {
      window.clearInterval(this.heartRateIntervalId);
      this.heartRateIntervalId = null;
    }

    if (this.stepsIntervalId !== null) {
      window.clearInterval(this.stepsIntervalId);
      this.stepsIntervalId = null;
    }

    this.running = false;
  }

  private startSimulationLoops() {
    if (this.heartRateIntervalId !== null) {
      window.clearInterval(this.heartRateIntervalId);
    }
    if (this.stepsIntervalId !== null) {
      window.clearInterval(this.stepsIntervalId);
    }

    this.heartRateIntervalId = window.setInterval(() => {
      this.heartRate = clamp(Math.round(this.heartRate + randomFloat(-2, 2)), 70, 85);
      this.emitUpdate();
    }, HEART_RATE_UPDATE_MS);

    this.stepsIntervalId = window.setInterval(() => {
      this.steps = clamp(this.steps + nextStepIncrement(), 0, MAX_SIMULATED_STEPS);
      this.activityLevel = 'walking';
      this.movementScore = Number(randomFloat(0.5, 1.2).toFixed(2));
      this.emitUpdate();
    }, STEP_UPDATE_MS);
  }

  private startUploadLoop() {
    if (this.transmitIntervalId !== null) {
      window.clearInterval(this.transmitIntervalId);
    }

    this.transmitIntervalId = window.setInterval(() => {
      void this.transmitSnapshot();
    }, TRANSMIT_INTERVAL_MS);

    void this.transmitSnapshot();
  }

  private async transmitSnapshot() {
    try {
      const snapshot = this.getSnapshot();
      const userId = localStorage.getItem('mediclock_user_id');

      if (!userId) {
        this.onError?.('User session not found. Please login again to upload wearable data.');
        return;
      }

      if (!Number.isFinite(snapshot.steps) || snapshot.steps < 0) {
        this.onError?.('Invalid step data detected. Upload skipped.');
        return;
      }

      if (!Number.isFinite(snapshot.movementScore) || snapshot.movementScore < 0 || snapshot.movementScore > 20) {
        this.onError?.('Invalid movement score detected. Upload skipped.');
        return;
      }

      await api.wearables.update({
        userId,
        steps: snapshot.steps,
        activityLevel: 'walking',
        movementScore: snapshot.movementScore,
        heartRate: snapshot.heartRate,
        timestamp: snapshot.timestamp,
      });
    } catch (error: any) {
      const fallback =
        typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : 'Unable to upload wearable motion data';
      this.onError?.(fallback);
    }
  }

  private getSnapshot(): WearableSnapshot {
    return {
      steps: this.steps,
      activityLevel: 'walking',
      movementScore: this.movementScore,
      heartRate: this.heartRate,
      timestamp: new Date().toISOString(),
    };
  }

  private emitUpdate() {
    this.onUpdate?.(this.getSnapshot());
  }
}

export const wearableSensorsService = new WearableSensorsService();
