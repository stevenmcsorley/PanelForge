/**
 * Export utilities for PNG and JSON export
 */

import Konva from 'konva';
import { PanelConfig, SensorKey, SensorState } from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';
import { useWidgetStore } from '@/stores/widgetStore';
import { useSensorStore } from '@/stores/sensorStore';

/**
 * Export the canvas stage as a PNG image
 */
export function exportCanvasToPng(stage: Konva.Stage, filename: string = 'panel.png'): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 1 });
  downloadDataUrl(dataUrl, filename);
}

/**
 * Export the current panel configuration as JSON
 */
export function exportPanelConfig(filename: string = 'panel-config.json'): void {
  const canvasState = useCanvasStore.getState();
  const widgetState = useWidgetStore.getState();
  const sensorState = useSensorStore.getState();

  // Build sensor states without runtime values
  const sensorStates: Record<SensorKey, Omit<SensorState, 'key' | 'value'>> = {} as Record<SensorKey, Omit<SensorState, 'key' | 'value'>>;

  for (const key of Object.keys(sensorState.sensors) as SensorKey[]) {
    const sensor = sensorState.sensors[key];
    sensorStates[key] = {
      mode: sensor.mode,
      staticValue: sensor.staticValue,
      sineAmplitude: sensor.sineAmplitude,
      sineOffset: sensor.sineOffset,
      sineFrequency: sensor.sineFrequency,
      walkStep: sensor.walkStep,
    };
  }

  const config: PanelConfig = {
    version: '1.0.0',
    name: 'Untitled Panel',
    resolution: canvasState.resolution,
    backgroundColor: canvasState.backgroundColor,
    backgroundImage: canvasState.backgroundImage,
    showGrid: canvasState.showGrid,
    gridSize: canvasState.gridSize,
    widgets: widgetState.widgets,
    sensorStates,
  };

  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}

/**
 * Import a panel configuration from JSON
 */
export function importPanelConfig(json: string): boolean {
  try {
    const config: PanelConfig = JSON.parse(json);

    // Validate version
    if (!config.version) {
      console.error('Invalid config: missing version');
      return false;
    }

    // Apply canvas settings
    const canvasStore = useCanvasStore.getState();
    canvasStore.setResolution(config.resolution);
    canvasStore.setBackgroundColor(config.backgroundColor);
    canvasStore.setBackgroundImage(config.backgroundImage);
    if (config.showGrid !== undefined) {
      if (canvasStore.showGrid !== config.showGrid) {
        canvasStore.toggleGrid();
      }
    }
    canvasStore.setGridSize(config.gridSize);

    // Apply widgets
    const widgetStore = useWidgetStore.getState();
    widgetStore.setWidgets(config.widgets);

    // Apply sensor settings
    const sensorStore = useSensorStore.getState();
    for (const key of Object.keys(config.sensorStates) as SensorKey[]) {
      const sensorConfig = config.sensorStates[key];
      sensorStore.setSensorMode(key, sensorConfig.mode);
      sensorStore.setSensorStaticValue(key, sensorConfig.staticValue);
      sensorStore.setSensorSineParams(key, {
        amplitude: sensorConfig.sineAmplitude,
        offset: sensorConfig.sineOffset,
        frequency: sensorConfig.sineFrequency,
      });
      sensorStore.setSensorWalkStep(key, sensorConfig.walkStep);
    }

    return true;
  } catch (error) {
    console.error('Failed to import config:', error);
    return false;
  }
}

/**
 * Helper to download a data URL as a file
 */
function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
