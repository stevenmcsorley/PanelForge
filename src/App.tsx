/**
 * PanelForge - AIDA64 SensorPanel Designer
 * Main application component
 */

import React, { useRef, useEffect } from 'react';
import Konva from 'konva';
import { PanelCanvas } from '@/components/canvas';
import {
  CanvasSettingsPanel,
  WidgetListPanel,
  WidgetPropertiesPanel,
  SensorPanel,
  ExportPanel,
} from '@/components/editor';
import { GaugeFoundry } from '@/components/foundry';
import { useKeyboardShortcuts } from '@/hooks';
import { sensorEngine } from '@/engine';
import { useCanvasStore, useFoundryStore } from '@/stores';
import './App.css';

const App: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const { resolution, zoom, setZoom, resetView } = useCanvasStore();
  const { openFoundry } = useFoundryStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Start sensor engine on mount
  useEffect(() => {
    sensorEngine.start();
    return () => sensorEngine.stop();
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    }
  };

  return (
    <div className="app">
      {/* Gauge Foundry Modal */}
      <GaugeFoundry />

      {/* Header */}
      <header className="app-header">
        <div className="app-title">
          <span className="app-logo">PF</span>
          <span>PanelForge</span>
        </div>
        <div className="app-subtitle">AIDA64 SensorPanel Designer</div>

        {/* Tools Menu */}
        <div className="app-tools">
          <button className="app-tool-btn" onClick={openFoundry} title="Vector Gauge Foundry">
            ⚙️ Gauge Foundry
          </button>
        </div>

        <div className="app-zoom">
          <button onClick={() => setZoom(zoom - 0.25)} disabled={zoom <= 0.25}>
            -
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.25)} disabled={zoom >= 4}>
            +
          </button>
          <button onClick={resetView} style={{ marginLeft: 8 }}>
            Reset
          </button>
        </div>
      </header>

      <div className="app-layout">
        {/* Left sidebar */}
        <aside className="sidebar sidebar-left">
          <CanvasSettingsPanel />
          <SensorPanel />
        </aside>

        {/* Canvas area */}
        <main className="canvas-area" onWheel={handleWheel}>
          <div className="canvas-wrapper">
            <div
              className="canvas-frame"
              style={{
                width: resolution.width * zoom,
                height: resolution.height * zoom,
              }}
            >
              <PanelCanvas stageRef={stageRef} />
            </div>
            <div className="canvas-info">
              {resolution.width} x {resolution.height}
            </div>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="sidebar sidebar-right">
          <WidgetListPanel />
          <WidgetPropertiesPanel />
          <ExportPanel stageRef={stageRef} />
        </aside>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div>
          Arrow keys: Nudge (Shift for 10px) | Ctrl+D: Duplicate | Ctrl+L: Lock |
          Delete: Remove | Ctrl+[/]: Z-order
        </div>
      </footer>
    </div>
  );
};

export default App;

