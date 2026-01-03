/**
 * CanvasSettingsPanel
 * Settings for canvas resolution, background, grid
 */

import React, { useRef, useState } from 'react';
import { useCanvasStore, BlendMode } from '@/stores';
import { SUPPORTED_RESOLUTIONS } from '@/types';
import { Select, Input, Checkbox, Slider, Button } from '@/components/ui';
import { PanelBackgroundFoundry } from '@/components/foundry/PanelBackgroundFoundry';

const BLEND_MODE_OPTIONS: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
];

export const CanvasSettingsPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBackgroundFoundry, setShowBackgroundFoundry] = useState(false);
  const {
    resolution,
    backgroundColor,
    backgroundImage,
    backgroundImageOpacity,
    backgroundImageBlendMode,
    showGrid,
    gridSize,
    showSafeArea,
    safeAreaMargin,
    setResolution,
    setBackgroundColor,
    setBackgroundImage,
    setBackgroundImageOpacity,
    setBackgroundImageBlendMode,
    toggleGrid,
    setGridSize,
    toggleSafeArea,
    setSafeAreaMargin,
  } = useCanvasStore();

  const handleResolutionChange = (value: string) => {
    const res = SUPPORTED_RESOLUTIONS.find((r) => r.label === value);
    if (res) setResolution(res);
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearBackgroundImage = () => {
    setBackgroundImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">Canvas Settings</div>

      <Select
        label="Resolution"
        value={resolution.label}
        options={SUPPORTED_RESOLUTIONS.map((r) => ({ value: r.label, label: r.label }))}
        onChange={handleResolutionChange}
      />

      <Input
        label="Background Color"
        type="color"
        value={backgroundColor}
        onChange={setBackgroundColor}
      />

      <div className="input-group">
        <label className="input-label">Background Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleBackgroundImageUpload}
          style={{ display: 'none' }}
        />
        <div className="button-row">
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
          {backgroundImage && (
            <Button variant="danger" onClick={clearBackgroundImage}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {backgroundImage && (
        <>
          <Slider
            label="Image Opacity"
            value={backgroundImageOpacity}
            onChange={setBackgroundImageOpacity}
            min={0}
            max={1}
            step={0.05}
          />

          <Select
            label="Image Blend Mode"
            value={backgroundImageBlendMode}
            options={BLEND_MODE_OPTIONS}
            onChange={(value) => setBackgroundImageBlendMode(value as BlendMode)}
          />
        </>
      )}

      <div className="input-group">
        <label className="input-label">Procedural Background</label>
        <Button
          variant="primary"
          onClick={() => setShowBackgroundFoundry(true)}
          fullWidth
        >
          Open Background Foundry
        </Button>
        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
          Create carbon fiber, brushed metal, and other textures
        </div>
      </div>

      <PanelBackgroundFoundry
        isOpen={showBackgroundFoundry}
        onClose={() => setShowBackgroundFoundry(false)}
      />

      <div className="panel-header" style={{ marginTop: 16 }}>
        Grid & Guides
      </div>

      <Checkbox label="Show Grid" checked={showGrid} onChange={toggleGrid} />

      <Slider
        label="Grid Size"
        value={gridSize}
        onChange={setGridSize}
        min={5}
        max={50}
        step={5}
        disabled={!showGrid}
      />

      <Checkbox
        label="Show Safe Area"
        checked={showSafeArea}
        onChange={toggleSafeArea}
      />

      <Slider
        label="Safe Area Margin"
        value={safeAreaMargin}
        onChange={setSafeAreaMargin}
        min={10}
        max={50}
        step={5}
        disabled={!showSafeArea}
      />
    </div>
  );
};
