import { api } from '@/lib/api';

export type ActivityLevel = 'idle' | 'walking' | 'running';

export type WearableSnapshot = {
  steps: number;
  activityLevel: ActivityLevel;
  movementScore: number;
  timestamp: string;
};

export type SensorStartResult = {
  started: boolean;
  requiresPermission?: boolean;
  message?: string;
};

type MotionPermissionState = 'granted' | 'denied' | 'default';

type IOSDeviceMotionEvent = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const TRANSMIT_INTERVAL_MS = 30 * 1000;
const PROCESS_INTERVAL_MS = 200;
const STEP_THRESHOLD = 11.5;
const STEP_DEBOUNCE_MS = 300;
const IDLE_THRESHOLD = 10.2;
const GRAVITY_SMOOTHING_ALPHA = 0.9;
const MOVEMENT_SMOOTHING_ALPHA = 0.75;
const EARTH_GRAVITY = 9.81;
const MAX_MOVEMENT_SCORE = 20;

const classifyActivityLevel = (movementScore: number): ActivityLevel => {
  if (movementScore < 1.5) return 'idle';
  if (movementScore <= 4) return 'walking';
  return 'running';
};

class WearableSensorsService {
  private steps = 0;
  private movementScore = 0;
  private activityLevel: ActivityLevel = 'idle';
  private lastProcessTimestamp = 0;
  private lastStepTimestamp = 0;
  private previousMagnitude = EARTH_GRAVITY;
  private gravityBaseline = EARTH_GRAVITY;
  private smoothedLinearMovement = 0;
  private transmitIntervalId: number | null = null;
  private running = false;
  private permissionState: MotionPermissionState = 'default';
  private onUpdate: ((snapshot: WearableSnapshot) => void) | null = null;
  private onError: ((message: string) => void) | null = null;

  private readonly handleMotionEvent = (event: DeviceMotionEvent) => {
    const now = Date.now();
    if (now - this.lastProcessTimestamp < PROCESS_INTERVAL_MS) {
      return;
    }
    this.lastProcessTimestamp = now;

    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) {
      return;
    }

    const x = Number(acceleration.x ?? 0);
    const y = Number(acceleration.y ?? 0);
    const z = Number(acceleration.z ?? 0);

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    this.gravityBaseline =
      GRAVITY_SMOOTHING_ALPHA * this.gravityBaseline + (1 - GRAVITY_SMOOTHING_ALPHA) * magnitude;

    const linearMovement = Math.abs(magnitude - this.gravityBaseline);
    this.smoothedLinearMovement =
      MOVEMENT_SMOOTHING_ALPHA * this.smoothedLinearMovement +
      (1 - MOVEMENT_SMOOTHING_ALPHA) * linearMovement;

    this.movementScore = Number(
      Math.min(MAX_MOVEMENT_SCORE, this.smoothedLinearMovement * 10).toFixed(2)
    );
    this.activityLevel = classifyActivityLevel(this.movementScore);

    const crossedThreshold = this.previousMagnitude <= STEP_THRESHOLD && magnitude > STEP_THRESHOLD;
    const notIdle = magnitude >= IDLE_THRESHOLD;
    const stepDebounced = now - this.lastStepTimestamp > STEP_DEBOUNCE_MS;

    if (notIdle && crossedThreshold && stepDebounced) {
      this.steps += 1;
      this.lastStepTimestamp = now;
    }

    this.previousMagnitude = magnitude;

    this.emitUpdate();
  };

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

    if (typeof window === 'undefined') {
      return { started: false, message: 'Motion sensors not available on this device.' };
    }

    if (!window.isSecureContext) {
      return {
        started: false,
        message: 'Motion sensors require HTTPS on mobile browsers. Open Mediclock over HTTPS to enable live motion tracking.',
      };
    }

    if (typeof DeviceMotionEvent === 'undefined' && !('ondevicemotion' in window)) {
      return { started: false, message: 'Motion sensors not available on this device.' };
    }

    if (this.needsExplicitPermission() && this.permissionState !== 'granted') {
      return {
        started: false,
        requiresPermission: true,
        message: 'Motion permission is required to start wearable tracking.',
      };
    }

    this.beginListeners();
    return { started: true };
  }

  async requestPermissionAndStart(): Promise<SensorStartResult> {
    if (!this.needsExplicitPermission()) {
      return this.start();
    }

    try {
      const motionEvent = DeviceMotionEvent as IOSDeviceMotionEvent;
      const permission = await motionEvent.requestPermission?.();

      if (permission !== 'granted') {
        this.permissionState = 'denied';
        return {
          started: false,
          message: 'Motion permission denied. Motion sensors not available on this device.',
        };
      }

      this.permissionState = 'granted';
      return this.start();
    } catch {
      this.permissionState = 'denied';
      return {
        started: false,
        message: 'Motion permission denied. Motion sensors not available on this device.',
      };
    }
  }

  stop() {
    if (!this.running) {
      return;
    }

    window.removeEventListener('devicemotion', this.handleMotionEvent);
    if (this.transmitIntervalId !== null) {
      window.clearInterval(this.transmitIntervalId);
      this.transmitIntervalId = null;
    }

    this.running = false;
    this.lastProcessTimestamp = 0;
    this.lastStepTimestamp = 0;
    this.previousMagnitude = EARTH_GRAVITY;
    this.gravityBaseline = EARTH_GRAVITY;
    this.smoothedLinearMovement = 0;
  }

  private beginListeners() {
    this.lastProcessTimestamp = 0;
    this.lastStepTimestamp = 0;
    this.previousMagnitude = EARTH_GRAVITY;
    this.gravityBaseline = EARTH_GRAVITY;
    this.smoothedLinearMovement = 0;

    window.addEventListener('devicemotion', this.handleMotionEvent, { passive: true });

    this.running = true;
    this.emitUpdate();

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

      if (
        !Number.isFinite(snapshot.movementScore) ||
        snapshot.movementScore < 0 ||
        snapshot.movementScore > MAX_MOVEMENT_SCORE
      ) {
        this.onError?.('Invalid movement score detected. Upload skipped.');
        return;
      }

      await api.wearables.update({
        userId,
        steps: snapshot.steps,
        activityLevel: snapshot.activityLevel,
        movementScore: snapshot.movementScore,
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
      activityLevel: this.activityLevel,
      movementScore: this.movementScore,
      timestamp: new Date().toISOString(),
    };
  }

  private emitUpdate() {
    this.onUpdate?.(this.getSnapshot());
  }

  private needsExplicitPermission() {
    const motionEvent = DeviceMotionEvent as IOSDeviceMotionEvent;
    return typeof motionEvent.requestPermission === 'function';
  }
}

export const wearableSensorsService = new WearableSensorsService();
