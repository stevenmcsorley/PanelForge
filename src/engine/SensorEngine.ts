/**
 * SensorEngine
 * Handles sensor value simulation with multiple modes:
 * - static: Fixed value
 * - sine: Sine wave oscillation
 * - random_walk: Random walk with momentum
 * - manual: User-controlled via slider
 */

import { SensorKey, DEFAULT_SENSORS } from '@/types';
import { useSensorStore } from '@/stores';

class SensorEngine {
  private intervalId: number | null = null;
  private time: number = 0;
  private lastValues: Map<SensorKey, number> = new Map();
  private walkMomentum: Map<SensorKey, number> = new Map();

  constructor() {
    // Initialize last values for random walk
    for (const config of DEFAULT_SENSORS) {
      this.lastValues.set(config.key, config.defaultValue);
      this.walkMomentum.set(config.key, 0);
    }
  }

  /**
   * Start the simulation engine
   */
  start(): void {
    const store = useSensorStore.getState();
    if (this.intervalId !== null) return;

    store.setIsRunning(true);
    this.tick(); // Immediate first tick
    this.intervalId = window.setInterval(() => this.tick(), store.updateInterval);
  }

  /**
   * Stop the simulation engine
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    useSensorStore.getState().setIsRunning(false);
  }

  /**
   * Update the tick interval
   */
  setInterval(ms: number): void {
    const store = useSensorStore.getState();
    store.setUpdateInterval(ms);

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = window.setInterval(() => this.tick(), ms);
    }
  }

  /**
   * Main simulation tick
   */
  private tick(): void {
    const store = useSensorStore.getState();
    this.time += store.updateInterval / 1000;

    // Update hardware sensors
    for (const config of DEFAULT_SENSORS) {
      const sensorState = store.sensors[config.key];
      let newValue: number;

      switch (sensorState.mode) {
        case 'static':
          newValue = sensorState.staticValue;
          break;

        case 'sine':
          newValue = this.calculateSineValue(sensorState, config);
          break;

        case 'random_walk':
          newValue = this.calculateRandomWalkValue(sensorState, config);
          break;

        case 'manual':
          // Manual mode: value is set directly by user, don't update
          continue;

        default:
          newValue = sensorState.value;
      }

      // Update store
      store.setSensorValue(config.key, newValue);
      this.lastValues.set(config.key, newValue);
    }

    // Update time sensors from system clock
    this.updateTimeSensors(store);
  }

  /**
   * Update time sensor from system clock
   * Time is represented as seconds since midnight (0-86399)
   */
  private updateTimeSensors(store: ReturnType<typeof useSensorStore.getState>): void {
    const now = new Date();
    const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    store.setSensorValue('time', secondsSinceMidnight);
  }

  /**
   * Calculate sine wave value
   */
  private calculateSineValue(
    state: typeof useSensorStore.getState extends () => { sensors: Record<SensorKey, infer T> } ? T : never,
    config: typeof DEFAULT_SENSORS[0]
  ): number {
    const { sineAmplitude, sineOffset, sineFrequency } = state;
    const value = sineOffset + sineAmplitude * Math.sin(this.time * sineFrequency * 2 * Math.PI);
    return Math.min(Math.max(value, config.min), config.max);
  }

  /**
   * Calculate random walk value with momentum
   */
  private calculateRandomWalkValue(
    state: typeof useSensorStore.getState extends () => { sensors: Record<SensorKey, infer T> } ? T : never,
    config: typeof DEFAULT_SENSORS[0]
  ): number {
    const { key, walkStep } = state;
    const lastValue = this.lastValues.get(key) ?? config.defaultValue;
    let momentum = this.walkMomentum.get(key) ?? 0;

    // Random impulse
    const impulse = (Math.random() - 0.5) * walkStep * 2;

    // Apply momentum with decay
    momentum = momentum * 0.7 + impulse * 0.3;
    this.walkMomentum.set(key, momentum);

    // Calculate new value
    let newValue = lastValue + momentum;

    // Soft bounce at boundaries
    if (newValue < config.min) {
      newValue = config.min + Math.abs(newValue - config.min) * 0.5;
      this.walkMomentum.set(key, Math.abs(momentum) * 0.5);
    } else if (newValue > config.max) {
      newValue = config.max - Math.abs(newValue - config.max) * 0.5;
      this.walkMomentum.set(key, -Math.abs(momentum) * 0.5);
    }

    return Math.min(Math.max(newValue, config.min), config.max);
  }

  /**
   * Reset simulation time
   */
  resetTime(): void {
    this.time = 0;
  }

  /**
   * Get current simulation time
   */
  getTime(): number {
    return this.time;
  }
}

// Singleton instance
export const sensorEngine = new SensorEngine();
