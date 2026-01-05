/**
 * SensorPanel
 * Controls sensor simulation modes and values
 */

import React from 'react';
import { useSensorStore } from '@/stores';
import { DEFAULT_SENSORS, TIME_SENSORS, SimulationMode, SensorConfig } from '@/types';
import { Select, Slider, Button } from '@/components/ui';
import { sensorEngine } from '@/engine';

export const SensorPanel: React.FC = () => {
  const { sensors, updateInterval, isRunning, setUpdateInterval } =
    useSensorStore();

  const handleToggleSimulation = () => {
    if (isRunning) {
      sensorEngine.stop();
    } else {
      sensorEngine.start();
    }
  };

  const handleIntervalChange = (value: number) => {
    setUpdateInterval(value);
    sensorEngine.setInterval(value);
  };

  return (
    <div className="panel">
      <div className="panel-header">Sensor Simulation</div>

      <div className="button-row" style={{ marginBottom: 12 }}>
        <Button
          variant={isRunning ? 'danger' : 'primary'}
          onClick={handleToggleSimulation}
          fullWidth
        >
          {isRunning ? 'Stop Simulation' : 'Start Simulation'}
        </Button>
      </div>

      <Slider
        label="Update Interval (ms)"
        value={updateInterval}
        onChange={handleIntervalChange}
        min={100}
        max={2000}
        step={100}
      />

      {/* Hardware Sensors */}
      <div className="panel-header" style={{ marginTop: 16, fontSize: 11, color: '#666' }}>
        Hardware Sensors
      </div>
      <div>
        {DEFAULT_SENSORS.map((config) => (
          <SensorControl key={config.key} config={config} state={sensors[config.key]} />
        ))}
      </div>

      {/* Time Sensors */}
      <div className="panel-header" style={{ marginTop: 16, fontSize: 11, color: '#666' }}>
        Time Sensors (Realtime)
      </div>
      <div>
        {TIME_SENSORS.map((config) => (
          <TimeSensorDisplay key={config.key} config={config} state={sensors[config.key]} />
        ))}
      </div>
    </div>
  );
};

interface SensorControlProps {
  config: SensorConfig;
  state: ReturnType<typeof useSensorStore.getState>['sensors'][keyof ReturnType<typeof useSensorStore.getState>['sensors']];
}

// Simple display for time sensor (read-only, always realtime)
const TimeSensorDisplay: React.FC<SensorControlProps> = ({ config, state }) => {
  // Convert seconds since midnight to HH:MM:SS format
  const formatTime = (secondsSinceMidnight: number): string => {
    const hours = Math.floor(secondsSinceMidnight / 3600);
    const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
    const seconds = Math.floor(secondsSinceMidnight % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
    }}>
      <span style={{ color: '#888', fontSize: 12 }}>{config.label}</span>
      <span style={{
        color: '#00cc66',
        fontFamily: 'monospace',
        fontSize: 18,
        fontWeight: 'bold'
      }}>
        {formatTime(state.value)}
      </span>
    </div>
  );
};

const SensorControl: React.FC<SensorControlProps> = ({ config, state }) => {
  const {
    setSensorMode,
    setSensorStaticValue,
    setSensorSineParams,
    setSensorWalkStep,
    setSensorValue,
  } = useSensorStore();

  const modeOptions = [
    { value: 'static', label: 'Static' },
    { value: 'sine', label: 'Sine Wave' },
    { value: 'random_walk', label: 'Random Walk' },
    { value: 'manual', label: 'Manual Slider' },
  ];

  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: '#aaa', fontSize: 12 }}>{config.label}</span>
        <span style={{ color: '#0088ff', fontFamily: 'monospace', fontSize: 14 }}>
          {state.value.toFixed(1)} {config.unit}
        </span>
      </div>

      <Select
        label="Mode"
        value={state.mode}
        options={modeOptions}
        onChange={(v) => setSensorMode(config.key, v as SimulationMode)}
      />

      {state.mode === 'static' && (
        <Slider
          label="Value"
          value={state.staticValue}
          onChange={(v) => setSensorStaticValue(config.key, v)}
          min={config.min}
          max={config.max}
        />
      )}

      {state.mode === 'manual' && (
        <Slider
          label="Value"
          value={state.value}
          onChange={(v) => setSensorValue(config.key, v)}
          min={config.min}
          max={config.max}
        />
      )}

      {state.mode === 'sine' && (
        <>
          <Slider
            label="Amplitude"
            value={state.sineAmplitude}
            onChange={(v) => setSensorSineParams(config.key, { amplitude: v })}
            min={0}
            max={(config.max - config.min) / 2}
          />
          <Slider
            label="Offset"
            value={state.sineOffset}
            onChange={(v) => setSensorSineParams(config.key, { offset: v })}
            min={config.min}
            max={config.max}
          />
          <Slider
            label="Frequency"
            value={state.sineFrequency}
            onChange={(v) => setSensorSineParams(config.key, { frequency: v })}
            min={0.1}
            max={2}
            step={0.1}
          />
        </>
      )}

      {state.mode === 'random_walk' && (
        <Slider
          label="Step Size"
          value={state.walkStep}
          onChange={(v) => setSensorWalkStep(config.key, v)}
          min={0.1}
          max={(config.max - config.min) / 5}
          step={0.1}
        />
      )}
    </div>
  );
};
