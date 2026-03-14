import { api } from '@/lib/api';

export type ActivityLevel = 'resting' | 'walking' | 'running';

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
const MIN_STEP_INTERVAL_MS = 280;
const MAX_STEP_INTERVAL_MS = 1600;
const MIN_STEP_THRESHOLD = 0.35;
const STEP_RELEASE_RATIO = 0.58;
const GRAVITY_SMOOTHING_ALPHA = 0.92;
const MOVEMENT_SMOOTHING_ALPHA = 0.7;
const DYNAMIC_THRESHOLD_MULTIPLIER = 1.45;
const EARTH_GRAVITY = 9.81;
const MOTION_WINDOW_SIZE = 24;

const classifyActivityLevel = (movementScore: number): ActivityLevel => {
  if (movementScore < 5) return 'resting';
  if (movementScore < 15) return 'walking';
  return 'running';
};

class WearableSensorsService {
  private steps = 0;
  private movementScore = 0;
  private activityLevel: ActivityLevel = 'resting';
  private lastStepTimestamp = 0;
  private lastCadenceStepTimestamp = 0;
  private gravityBaseline = EARTH_GRAVITY;
  private smoothedLinearMovement = 0;
  private peakArmed = false;
  private motionSamples: number[] = [];
  private transmitIntervalId: number | null = null;
  private running = false;
  private permissionState: MotionPermissionState = 'default';
  private onUpdate: ((snapshot: WearableSnapshot) => void) | null = null;
  private onError: ((message: string) => void) | null = null;

  private readonly handleMotionEvent = (event: DeviceMotionEvent) => {
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

    this.motionSamples.push(this.smoothedLinearMovement);
    if (this.motionSamples.length > MOTION_WINDOW_SIZE) {
      this.motionSamples.shift();
    }

    const averageMovement =
      this.motionSamples.reduce((sum, value) => sum + value, 0) /
      Math.max(this.motionSamples.length, 1);

    this.movementScore = Number((averageMovement * 12).toFixed(2));
    this.activityLevel = classifyActivityLevel(this.movementScore);

    const dynamicThreshold = Math.max(MIN_STEP_THRESHOLD, averageMovement * DYNAMIC_THRESHOLD_MULTIPLIER);
    const now = Date.now();
    const deltaSinceLastStep = now - this.lastStepTimestamp;

    if (!this.peakArmed && this.smoothedLinearMovement >= dynamicThreshold) {
      this.peakArmed = true;
    }

    if (this.peakArmed && this.smoothedLinearMovement <= dynamicThreshold * STEP_RELEASE_RATIO) {
      const isFirstStep = this.lastStepTimestamp === 0;
      if (
        isFirstStep ||
        (deltaSinceLastStep >= MIN_STEP_INTERVAL_MS && deltaSinceLastStep <= MAX_STEP_INTERVAL_MS)
      ) {
        this.steps += 1;
        this.lastStepTimestamp = now;
        this.lastCadenceStepTimestamp = now;
      }
      this.peakArmed = false;
    }

    // Fallback for devices where devicemotion peaks do not cross/release reliably.
    const cadenceIntervalMs = this.activityLevel === 'running' ? 360 : 560;
    const cadenceMovementGate = this.activityLevel === 'running' ? 1.2 : 0.7;
    const noRecentStep = now - this.lastStepTimestamp > 1800;
    const cadenceEligible =
      this.activityLevel !== 'resting' &&
      this.smoothedLinearMovement >= cadenceMovementGate &&
      now - this.lastCadenceStepTimestamp >= cadenceIntervalMs;

    if (noRecentStep && cadenceEligible) {
      this.steps += 1;
      this.lastStepTimestamp = now;
      this.lastCadenceStepTimestamp = now;
    }

    if (this.peakArmed && deltaSinceLastStep > MAX_STEP_INTERVAL_MS * 2) {
      this.peakArmed = false;
    }

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
    this.peakArmed = false;
    this.lastCadenceStepTimestamp = 0;
    this.gravityBaseline = EARTH_GRAVITY;
    this.smoothedLinearMovement = 0;
    this.motionSamples = [];
  }

  private beginListeners() {
    this.peakArmed = false;
    this.lastCadenceStepTimestamp = 0;
    this.gravityBaseline = EARTH_GRAVITY;
    this.smoothedLinearMovement = 0;
    this.motionSamples = [];

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
      await api.wearables.update({
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

  private isMobileDevice() {
    const ua = navigator.userAgent || navigator.vendor || '';
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
      return true;
    }

    // iPadOS sometimes reports desktop-class UA; touch capability is a better signal.
    return Number(navigator.maxTouchPoints || 0) > 1;
  }
}

export const wearableSensorsService = new WearableSensorsService();
