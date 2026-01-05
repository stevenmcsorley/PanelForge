/**
 * Sensor Store
 * Manages sensor simulation state and values
 */

import { create } from 'zustand';
import { SensorKey, SensorState, SimulationMode, DEFAULT_SENSORS, POWER_SENSORS, STORAGE_SENSORS, NETWORK_SENSORS, TIME_SENSORS, ALL_SENSORS } from '@/types';

interface SensorStoreState {
  sensors: Record<SensorKey, SensorState>;
  updateInterval: number; // milliseconds
  isRunning: boolean;

  // Actions
  setSensorValue: (key: SensorKey, value: number) => void;
  setSensorMode: (key: SensorKey, mode: SimulationMode) => void;
  setSensorStaticValue: (key: SensorKey, value: number) => void;
  setSensorSineParams: (
    key: SensorKey,
    params: { amplitude?: number; offset?: number; frequency?: number }
  ) => void;
  setSensorWalkStep: (key: SensorKey, step: number) => void;
  setUpdateInterval: (interval: number) => void;
  setIsRunning: (running: boolean) => void;
  resetSensors: () => void;
  getSensorValue: (key: SensorKey) => number;
  getSensorConfig: (key: SensorKey) => typeof DEFAULT_SENSORS[0] | undefined;
}

function createInitialSensorState(): Record<SensorKey, SensorState> {
  const states: Partial<Record<SensorKey, SensorState>> = {};

  // Initialize hardware sensors with simulation modes
  for (const config of DEFAULT_SENSORS) {
    states[config.key] = {
      key: config.key,
      value: config.defaultValue,
      mode: 'sine',
      staticValue: config.defaultValue,
      sineAmplitude: (config.max - config.min) / 4,
      sineOffset: (config.max + config.min) / 2,
      sineFrequency: 0.5 + Math.random() * 0.5, // Slightly different freq per sensor
      walkStep: (config.max - config.min) / 20,
    };
  }

  // Initialize power & voltage sensors with simulation modes
  for (const config of POWER_SENSORS) {
    states[config.key] = {
      key: config.key,
      value: config.defaultValue,
      mode: 'sine',
      staticValue: config.defaultValue,
      sineAmplitude: (config.max - config.min) / 8, // Smaller amplitude for voltages
      sineOffset: (config.max + config.min) / 2,
      sineFrequency: 0.3 + Math.random() * 0.3, // Slower oscillation
      walkStep: (config.max - config.min) / 40,
    };
  }

  // Initialize storage sensors with random walk (bursty behavior)
  for (const config of STORAGE_SENSORS) {
    states[config.key] = {
      key: config.key,
      value: config.defaultValue,
      mode: config.key === 'disk_usage' ? 'static' : 'random_walk', // Usage is static, read/write bursty
      staticValue: config.defaultValue,
      sineAmplitude: (config.max - config.min) / 4,
      sineOffset: (config.max + config.min) / 2,
      sineFrequency: 0.5 + Math.random() * 0.5,
      walkStep: (config.max - config.min) / 10, // Larger steps for bursty I/O
    };
  }

  // Initialize network sensors with random walk (bursty behavior)
  for (const config of NETWORK_SENSORS) {
    states[config.key] = {
      key: config.key,
      value: config.defaultValue,
      mode: 'random_walk',
      staticValue: config.defaultValue,
      sineAmplitude: (config.max - config.min) / 4,
      sineOffset: (config.max + config.min) / 2,
      sineFrequency: 0.5 + Math.random() * 0.5,
      walkStep: (config.max - config.min) / 15,
    };
  }

  // Initialize time sensors with realtime mode
  for (const config of TIME_SENSORS) {
    states[config.key] = {
      key: config.key,
      value: config.defaultValue,
      mode: 'realtime',
      staticValue: config.defaultValue,
      sineAmplitude: 0,
      sineOffset: 0,
      sineFrequency: 0,
      walkStep: 0,
    };
  }

  return states as Record<SensorKey, SensorState>;
}

export const useSensorStore = create<SensorStoreState>((set, get) => ({
  sensors: createInitialSensorState(),
  updateInterval: 500,
  isRunning: true,

  setSensorValue: (key, value) => {
    set((state) => ({
      sensors: {
        ...state.sensors,
        [key]: { ...state.sensors[key], value },
      },
    }));
  },

  setSensorMode: (key, mode) => {
    set((state) => ({
      sensors: {
        ...state.sensors,
        [key]: { ...state.sensors[key], mode },
      },
    }));
  },

  setSensorStaticValue: (key, value) => {
    const config = ALL_SENSORS.find((s) => s.key === key);
    if (!config) return;

    const clampedValue = Math.min(Math.max(value, config.min), config.max);
    set((state) => ({
      sensors: {
        ...state.sensors,
        [key]: {
          ...state.sensors[key],
          staticValue: clampedValue,
          value: state.sensors[key].mode === 'static' ? clampedValue : state.sensors[key].value,
        },
      },
    }));
  },

  setSensorSineParams: (key, params) => {
    set((state) => ({
      sensors: {
        ...state.sensors,
        [key]: {
          ...state.sensors[key],
          ...(params.amplitude !== undefined && { sineAmplitude: params.amplitude }),
          ...(params.offset !== undefined && { sineOffset: params.offset }),
          ...(params.frequency !== undefined && { sineFrequency: params.frequency }),
        },
      },
    }));
  },

  setSensorWalkStep: (key, step) => {
    set((state) => ({
      sensors: {
        ...state.sensors,
        [key]: { ...state.sensors[key], walkStep: step },
      },
    }));
  },

  setUpdateInterval: (interval) => set({ updateInterval: interval }),

  setIsRunning: (isRunning) => set({ isRunning }),

  resetSensors: () => set({ sensors: createInitialSensorState() }),

  getSensorValue: (key) => get().sensors[key]?.value ?? 0,

  getSensorConfig: (key) => ALL_SENSORS.find((s) => s.key === key),
}));
