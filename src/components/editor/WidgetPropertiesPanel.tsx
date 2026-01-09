/**
 * WidgetPropertiesPanel
 * Edits properties of the selected widget
 *
 * AIDA64 Parity:
 * - ImageTransformWidget: Pivot editor, angle sliders, clamp toggle
 * - MaskedImageWidget: Mask direction, opacity controls
 * - Visibility rule editor for all widgets
 */

import React, { useRef, useCallback } from 'react';
import { useWidgetStore } from '@/stores';
import { useFoundryStore } from '@/stores/foundryStore';
import { useLcdGaugeFoundryStore } from '@/stores/lcdGaugeFoundryStore';
import { useShapeGaugeFoundryStore } from '@/stores/shapeGaugeFoundryStore';
import { useStaticShapeFoundryStore } from '@/stores/staticShapeFoundryStore';
import { useClockFoundryStore } from '@/stores/clockFoundryStore';
import {
  TextWidget,
  ImageWidget,
  ImageTransformWidget,
  MaskedImageWidget,
  ImageSequenceWidget,
  RadialSegmentWidget,
  DEFAULT_SENSORS,
  TIME_SENSORS,
  SensorKey,
  VisibilityRule,
  VisibilityRuleType,
  isDeprecatedWidget,
  MaskDirection,
} from '@/types';
import { Input, Select, Slider, Checkbox, Button } from '@/components/ui';


export const WidgetPropertiesPanel: React.FC = () => {
  const { widgets, selectedWidgetId, updateWidget } = useWidgetStore();
  const widget = widgets.find((w) => w.id === selectedWidgetId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!widget) {
    return (
      <div className="panel">
        <div className="panel-header">Properties</div>
        <div style={{ color: '#666', fontSize: 12 }}>
          Select a widget to edit its properties.
        </div>
      </div>
    );
  }

  const sensorOptions = [
    { value: '', label: 'None (Static)' },
    ...DEFAULT_SENSORS.map((s) => ({ value: s.key, label: s.label })),
    ...TIME_SENSORS.map((s) => ({ value: s.key, label: s.label })),
  ];

  const isDeprecated = isDeprecatedWidget(widget.type);

  return (
    <div className="panel">
      <div className="panel-header">
        Properties: {widget.type.replace('_', ' ')}
        {isDeprecated && (
          <span className="deprecated-badge">DEPRECATED</span>
        )}
      </div>

      {/* Static Shape Edit Button */}
      {widget.type === 'image' && (widget as any).sourceFoundry === 'static_shape' && (
        <div style={{ marginBottom: 16 }}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              const params = (widget as any).foundryParams;
              if (params) {
                useStaticShapeFoundryStore.getState().loadForEdit(widget.id, params);
              }
            }}
          >
            Edit Structure
          </Button>
        </div>
      )}

      {/* Deprecation warning */}
      {isDeprecated && (
        <div style={{
          background: 'rgba(170, 102, 0, 0.15)',
          border: '1px solid #aa6600',
          borderRadius: 4,
          padding: 8,
          marginBottom: 12,
          fontSize: 11,
          color: '#cc8800',
        }}>
          This widget type is deprecated. For AIDA64 parity, use Rotating Image + Masked Image instead.
        </div>
      )}

      {/* Common properties */}
      <Input
        label="Name"
        value={widget.name}
        onChange={(v) => updateWidget(widget.id, { name: v })}
      />

      <div className="panel-row">
        <Input
          label="X"
          type="number"
          value={widget.x}
          onChange={(v) => updateWidget(widget.id, { x: parseFloat(v) || 0 })}
          disabled={widget.locked}
        />
        <Input
          label="Y"
          type="number"
          value={widget.y}
          onChange={(v) => updateWidget(widget.id, { y: parseFloat(v) || 0 })}
          disabled={widget.locked}
        />
      </div>

      {/* Widget-specific properties */}
      {widget.type === 'text' && (
        <TextWidgetProperties
          widget={widget}
          sensorOptions={sensorOptions}
          updateWidget={(updates) => updateWidget(widget.id, updates)}
        />
      )}

      {widget.type === 'image' && (
        <ImageWidgetProperties
          widget={widget}
          sensorOptions={sensorOptions}
          updateWidget={(updates) => updateWidget(widget.id, updates)}
          fileInputRef={fileInputRef}
        />
      )}

      {widget.type === 'image_transform' && (
        <ImageTransformWidgetProperties
          widget={widget}
          sensorOptions={sensorOptions}
          updateWidget={(updates) => updateWidget(widget.id, updates)}
          fileInputRef={fileInputRef}
        />
      )}

      {widget.type === 'masked_image' && (
        <MaskedImageWidgetProperties
          widget={widget}
          sensorOptions={sensorOptions}
          updateWidget={(updates) => updateWidget(widget.id, updates)}
          fileInputRef={fileInputRef}
        />
      )}

      {widget.type === 'image_sequence' && (
        <ImageSequenceWidgetProperties
          widget={widget}
          sensorOptions={sensorOptions}
          updateWidget={(updates) => updateWidget(widget.id, updates)}
        />
      )}

      {widget.type === 'radial_segment' && (
        <RadialSegmentWidgetProperties
          widget={widget}
          sensorOptions={sensorOptions}
          updateWidget={(updates) => updateWidget(widget.id, updates)}
        />
      )}

      {/* Visibility Rules (for all widget types) */}
      <VisibilityRuleEditor
        rule={widget.visibilityRule}
        sensorOptions={sensorOptions}
        widgetSensorBinding={'sensorBinding' in widget ? widget.sensorBinding : null}
        updateRule={(rule) => updateWidget(widget.id, { visibilityRule: rule })}
      />
    </div>
  );
};

// ============================================================================
// Visibility Rule Editor (AIDA64 Parity)
// ============================================================================

interface VisibilityRuleEditorProps {
  rule: VisibilityRule;
  sensorOptions: { value: string; label: string }[];
  widgetSensorBinding: SensorKey | null;
  updateRule: (rule: VisibilityRule) => void;
}

const VisibilityRuleEditor: React.FC<VisibilityRuleEditorProps> = ({
  rule,
  sensorOptions,
  widgetSensorBinding,
  updateRule,
}) => {
  const ruleTypeOptions = [
    { value: 'always', label: 'Always Visible' },
    { value: 'gte', label: 'Value >= Threshold' },
    { value: 'lte', label: 'Value <= Threshold' },
    { value: 'between', label: 'Value Between Range' },
    { value: 'equals', label: 'Value Equals' },
  ];

  return (
    <div className="visibility-rule-editor">
      <div className="visibility-rule-header">Visibility Rule (AIDA64)</div>

      <Select
        label="Condition"
        value={rule.type}
        options={ruleTypeOptions}
        onChange={(v) => updateRule({ ...rule, type: v as VisibilityRuleType })}
      />

      {rule.type !== 'always' && (
        <>
          <Select
            label="Sensor"
            value={rule.sensorBinding || ''}
            options={[
              { value: '', label: widgetSensorBinding ? 'Use Widget Sensor' : 'Select Sensor' },
              ...sensorOptions.slice(1),
            ]}
            onChange={(v) =>
              updateRule({ ...rule, sensorBinding: (v || null) as SensorKey | null })
            }
          />

          {(rule.type === 'gte' || rule.type === 'lte' || rule.type === 'equals') && (
            <Input
              label="Threshold"
              type="number"
              value={rule.threshold ?? 0}
              onChange={(v) => updateRule({ ...rule, threshold: parseFloat(v) || 0 })}
            />
          )}

          {rule.type === 'between' && (
            <div className="panel-row">
              <Input
                label="Min"
                type="number"
                value={rule.rangeMin ?? 0}
                onChange={(v) => updateRule({ ...rule, rangeMin: parseFloat(v) || 0 })}
              />
              <Input
                label="Max"
                type="number"
                value={rule.rangeMax ?? 100}
                onChange={(v) => updateRule({ ...rule, rangeMax: parseFloat(v) || 100 })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Text Widget Properties
// ============================================================================

interface TextWidgetPropertiesProps {
  widget: TextWidget;
  sensorOptions: { value: string; label: string }[];
  updateWidget: (updates: Partial<TextWidget>) => void;
}

const TextWidgetProperties: React.FC<TextWidgetPropertiesProps> = ({
  widget,
  sensorOptions,
  updateWidget,
}) => {
  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Monaco', label: 'Monaco' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
  ];

  const alignOptions = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ];

  return (
    <>
      <Input
        label="Text"
        value={widget.text}
        onChange={(v) => updateWidget({ text: v })}
      />

      <Select
        label="Sensor Binding"
        value={widget.sensorBinding || ''}
        options={sensorOptions}
        onChange={(v) =>
          updateWidget({ sensorBinding: (v || null) as SensorKey | null })
        }
      />

      {widget.sensorBinding && (
        <Input
          label="Format"
          value={widget.format}
          onChange={(v) => updateWidget({ format: v })}
        />
      )}

      <Select
        label="Font Family"
        value={widget.fontFamily}
        options={fontFamilies}
        onChange={(v) => updateWidget({ fontFamily: v })}
      />

      <div className="panel-row">
        <Input
          label="Font Size"
          type="number"
          value={widget.fontSize}
          onChange={(v) => updateWidget({ fontSize: parseInt(v) || 16 })}
          min={8}
          max={200}
        />
        <Input
          label="Width"
          type="number"
          value={widget.width}
          onChange={(v) => updateWidget({ width: parseInt(v) || 100 })}
          min={20}
        />
      </div>

      <Input
        label="Font Color"
        type="color"
        value={widget.fontColor}
        onChange={(v) => updateWidget({ fontColor: v })}
      />

      <Select
        label="Alignment"
        value={widget.textAlign}
        options={alignOptions}
        onChange={(v) => updateWidget({ textAlign: v as 'left' | 'center' | 'right' })}
      />

      <div className="panel-row">
        <Checkbox
          label="Bold"
          checked={widget.fontWeight === 'bold'}
          onChange={(c) => updateWidget({ fontWeight: c ? 'bold' : 'normal' })}
        />
        <Checkbox
          label="Italic"
          checked={widget.fontStyle === 'italic'}
          onChange={(c) => updateWidget({ fontStyle: c ? 'italic' : 'normal' })}
        />
      </div>
    </>
  );
};

// ============================================================================
// Image Widget Properties (Legacy)
// ============================================================================

interface ImageWidgetPropertiesProps {
  widget: ImageWidget;
  sensorOptions: { value: string; label: string }[];
  updateWidget: (updates: Partial<ImageWidget>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ImageWidgetProperties: React.FC<ImageWidgetPropertiesProps> = ({
  widget,
  sensorOptions,
  updateWidget,
  fileInputRef,
}) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        updateWidget({
          src: event.target?.result as string,
          width: img.width,
          height: img.height,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="input-group">
        <label className="input-label">Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          fullWidth
        >
          {widget.src ? 'Change Image' : 'Upload Image'}
        </Button>
      </div>

      <div className="panel-row">
        <Input
          label="Width"
          type="number"
          value={widget.width}
          onChange={(v) => updateWidget({ width: parseInt(v) || 100 })}
          min={1}
        />
        <Input
          label="Height"
          type="number"
          value={widget.height}
          onChange={(v) => updateWidget({ height: parseInt(v) || 100 })}
          min={1}
        />
      </div>

      <Checkbox
        label="Enable Rotation"
        checked={widget.rotationEnabled}
        onChange={(c) => updateWidget({ rotationEnabled: c })}
      />

      {!widget.rotationEnabled && (
        <Slider
          label="Static Rotation"
          value={widget.rotation}
          onChange={(v) => updateWidget({ rotation: v })}
          min={0}
          max={360}
        />
      )}

      {widget.rotationEnabled && (
        <>
          <Select
            label="Rotation Sensor"
            value={widget.sensorBinding || ''}
            options={sensorOptions}
            onChange={(v) =>
              updateWidget({ sensorBinding: (v || null) as SensorKey | null })
            }
          />

          <div className="panel-row">
            <Slider
              label="Anchor X"
              value={widget.rotationAnchorX}
              onChange={(v) => updateWidget({ rotationAnchorX: v })}
              min={0}
              max={1}
              step={0.1}
            />
            <Slider
              label="Anchor Y"
              value={widget.rotationAnchorY}
              onChange={(v) => updateWidget({ rotationAnchorY: v })}
              min={0}
              max={1}
              step={0.1}
            />
          </div>

          <div className="panel-row">
            <Input
              label="Min Angle"
              type="number"
              value={widget.rotationMinAngle}
              onChange={(v) =>
                updateWidget({ rotationMinAngle: parseFloat(v) || 0 })
              }
            />
            <Input
              label="Max Angle"
              type="number"
              value={widget.rotationMaxAngle}
              onChange={(v) =>
                updateWidget({ rotationMaxAngle: parseFloat(v) || 180 })
              }
            />
          </div>

          <div className="panel-row">
            <Input
              label="Min Value"
              type="number"
              value={widget.rotationMinValue}
              onChange={(v) =>
                updateWidget({ rotationMinValue: parseFloat(v) || 0 })
              }
            />
            <Input
              label="Max Value"
              type="number"
              value={widget.rotationMaxValue}
              onChange={(v) =>
                updateWidget({ rotationMaxValue: parseFloat(v) || 100 })
              }
            />
          </div>
        </>
      )}
    </>
  );
};

// ============================================================================
// ImageTransformWidget Properties (AIDA64)
// ============================================================================

interface ImageTransformWidgetPropertiesProps {
  widget: ImageTransformWidget;
  sensorOptions: { value: string; label: string }[];
  updateWidget: (updates: Partial<ImageTransformWidget>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ImageTransformWidgetProperties: React.FC<ImageTransformWidgetPropertiesProps> = ({
  widget,
  sensorOptions,
  updateWidget,
  fileInputRef,
}) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        updateWidget({
          src: event.target?.result as string,
          width: img.width,
          height: img.height,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Pivot presets
  const pivotPresets = [
    { label: 'Center', x: 0.5, y: 0.5 },
    { label: 'Bottom Center', x: 0.5, y: 1.0 },
    { label: 'Top Center', x: 0.5, y: 0.0 },
    { label: 'Left Center', x: 0.0, y: 0.5 },
    { label: 'Right Center', x: 1.0, y: 0.5 },
  ];

  return (
    <>
      <div style={{
        background: 'rgba(0, 136, 255, 0.1)',
        border: '1px solid rgba(0, 136, 255, 0.3)',
        borderRadius: 4,
        padding: 8,
        marginBottom: 12,
        fontSize: 11,
        color: '#0088ff',
      }}>
        AIDA64 Primitive: Use for needles, fans, and rotating indicators
      </div>

      <div className="input-group">
        <label className="input-label">Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          fullWidth
        >
          {widget.src ? 'Change Image' : 'Upload Image'}
        </Button>
      </div>

      <div className="panel-row">
        <Input
          label="Width"
          type="number"
          value={widget.width}
          onChange={(v) => updateWidget({ width: parseInt(v) || 100 })}
          min={1}
        />
        <Input
          label="Height"
          type="number"
          value={widget.height}
          onChange={(v) => updateWidget({ height: parseInt(v) || 100 })}
          min={1}
        />
      </div>

      <Select
        label="Sensor Binding"
        value={widget.sensorBinding || ''}
        options={sensorOptions}
        onChange={(v) =>
          updateWidget({ sensorBinding: (v || null) as SensorKey | null })
        }
      />

      {/* Pivot Point Editor */}
      <div className="input-group">
        <label className="input-label">Pivot Point (Rotation Center)</label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {pivotPresets.map((preset) => (
            <button
              key={preset.label}
              className="widget-action-btn"
              style={{
                padding: '4px 8px',
                fontSize: 10,
                background: widget.pivotX === preset.x && widget.pivotY === preset.y
                  ? '#0088ff'
                  : '#333',
                color: widget.pivotX === preset.x && widget.pivotY === preset.y
                  ? '#fff'
                  : '#888',
              }}
              onClick={() => updateWidget({ pivotX: preset.x, pivotY: preset.y })}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="panel-row">
          <Slider
            label="Pivot X"
            value={widget.pivotX}
            onChange={(v) => updateWidget({ pivotX: v })}
            min={0}
            max={1}
            step={0.05}
          />
          <Slider
            label="Pivot Y"
            value={widget.pivotY}
            onChange={(v) => updateWidget({ pivotY: v })}
            min={0}
            max={1}
            step={0.05}
          />
        </div>
      </div>

      {/* Angle Range */}
      <div className="panel-row">
        <Input
          label="Min Angle (°)"
          type="number"
          value={widget.minAngle}
          onChange={(v) => updateWidget({ minAngle: parseFloat(v) || 0 })}
        />
        <Input
          label="Max Angle (°)"
          type="number"
          value={widget.maxAngle}
          onChange={(v) => updateWidget({ maxAngle: parseFloat(v) || 180 })}
        />
      </div>

      {/* Value Range */}
      <div className="panel-row">
        <Input
          label="Min Value"
          type="number"
          value={widget.minValue}
          onChange={(v) => updateWidget({ minValue: parseFloat(v) || 0 })}
        />
        <Input
          label="Max Value"
          type="number"
          value={widget.maxValue}
          onChange={(v) => updateWidget({ maxValue: parseFloat(v) || 100 })}
        />
      </div>

      <Checkbox
        label="Clamp Value to Range"
        checked={widget.clampValue}
        onChange={(c) => updateWidget({ clampValue: c })}
      />

      <Slider
        label="Smoothing Factor"
        value={widget.smoothingFactor}
        onChange={(v) => updateWidget({ smoothingFactor: v })}
        min={0}
        max={0.95}
        step={0.05}
      />
    </>
  );
};

// ============================================================================
// MaskedImageWidget Properties (AIDA64)
// ============================================================================

interface MaskedImageWidgetPropertiesProps {
  widget: MaskedImageWidget;
  sensorOptions: { value: string; label: string }[];
  updateWidget: (updates: Partial<MaskedImageWidget>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const MaskedImageWidgetProperties: React.FC<MaskedImageWidgetPropertiesProps> = ({
  widget,
  sensorOptions,
  updateWidget,
  fileInputRef,
}) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        updateWidget({
          src: event.target?.result as string,
          width: img.width,
          height: img.height,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const directionOptions = [
    { value: 'left_to_right', label: 'Left → Right' },
    { value: 'right_to_left', label: 'Right → Left' },
    { value: 'bottom_to_top', label: 'Bottom → Top' },
    { value: 'top_to_bottom', label: 'Top → Bottom' },
  ];

  return (
    <>
      <div style={{
        background: 'rgba(0, 136, 255, 0.1)',
        border: '1px solid rgba(0, 136, 255, 0.3)',
        borderRadius: 4,
        padding: 8,
        marginBottom: 12,
        fontSize: 11,
        color: '#0088ff',
      }}>
        AIDA64 Primitive: Use for LED arcs, progress bars, and level meters
      </div>

      <div className="input-group">
        <label className="input-label">Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          fullWidth
        >
          {widget.src ? 'Change Image' : 'Upload Image'}
        </Button>
      </div>

      <div className="panel-row">
        <Input
          label="Width"
          type="number"
          value={widget.width}
          onChange={(v) => updateWidget({ width: parseInt(v) || 100 })}
          min={1}
        />
        <Input
          label="Height"
          type="number"
          value={widget.height}
          onChange={(v) => updateWidget({ height: parseInt(v) || 100 })}
          min={1}
        />
      </div>

      <Select
        label="Sensor Binding"
        value={widget.sensorBinding || ''}
        options={sensorOptions}
        onChange={(v) =>
          updateWidget({ sensorBinding: (v || null) as SensorKey | null })
        }
      />

      <Select
        label="Mask Direction"
        value={widget.maskDirection}
        options={directionOptions}
        onChange={(v) => updateWidget({ maskDirection: v as MaskDirection })}
      />

      {/* Value Range */}
      <div className="panel-row">
        <Input
          label="Min Value"
          type="number"
          value={widget.minValue}
          onChange={(v) => updateWidget({ minValue: parseFloat(v) || 0 })}
        />
        <Input
          label="Max Value"
          type="number"
          value={widget.maxValue}
          onChange={(v) => updateWidget({ maxValue: parseFloat(v) || 100 })}
        />
      </div>

      <Checkbox
        label="Show Inactive Portion"
        checked={widget.showInactivePortion}
        onChange={(c) => updateWidget({ showInactivePortion: c })}
      />

      {widget.showInactivePortion && (
        <Slider
          label="Inactive Opacity"
          value={widget.inactiveOpacity}
          onChange={(v) => updateWidget({ inactiveOpacity: v })}
          min={0}
          max={1}
          step={0.05}
        />
      )}
    </>
  );
};

// ============================================================================
// ImageSequenceWidget Properties (AIDA64)
// ============================================================================

interface ImageSequenceWidgetPropertiesProps {
  widget: ImageSequenceWidget & { id: string };
  sensorOptions: { value: string; label: string }[];
  updateWidget: (updates: Partial<ImageSequenceWidget>) => void;
}

const ImageSequenceWidgetProperties: React.FC<ImageSequenceWidgetPropertiesProps> = ({
  widget,
  sensorOptions,
  updateWidget,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openFoundryForWidget } = useFoundryStore();
  const { openLcdGaugeFoundryForWidget } = useLcdGaugeFoundryStore();
  const { openShapeGaugeFoundryForWidget } = useShapeGaugeFoundryStore();
  const { openClockFoundryForWidget } = useClockFoundryStore();

  // Route to the correct foundry based on sourceFoundry
  const handleOpenFoundry = useCallback(() => {
    const source = widget.sourceFoundry;
    const params = widget.foundryParams;
    switch (source) {
      case 'lcd':
        openLcdGaugeFoundryForWidget(widget.id, widget.width, widget.height, params);
        break;
      case 'shape':
        openShapeGaugeFoundryForWidget(widget.id, widget.width, widget.height, params);
        break;
      case 'clock':
        openClockFoundryForWidget(widget.id, widget.width, widget.height, params);
        break;
      case 'gauge':
      default:
        // Default to gauge foundry for backwards compatibility
        openFoundryForWidget(widget.id, widget.width, widget.height, params);
        break;
    }
  }, [widget.id, widget.width, widget.height, widget.sourceFoundry, widget.foundryParams, openFoundryForWidget, openLcdGaugeFoundryForWidget, openShapeGaugeFoundryForWidget, openClockFoundryForWidget]);

  // Get foundry name for display
  const getFoundryName = () => {
    switch (widget.sourceFoundry) {
      case 'lcd': return 'LCD Gauge Foundry';
      case 'shape': return 'Shape Gauge Foundry';
      case 'clock': return 'Clock Foundry';
      case 'gauge': return 'Gauge Foundry';
      case 'uploaded': return 'Uploaded Frames';
      default: return 'Gauge Foundry';
    }
  };

  const handleFramesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Sort files by name before processing to ensure correct order
    const fileArray = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    const loadedImages: { index: number; data: string; width: number; height: number }[] = [];
    let loadedCount = 0;

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          loadedImages.push({
            index,
            data: event.target?.result as string,
            width: img.width,
            height: img.height,
          });
          loadedCount++;

          if (loadedCount === fileArray.length) {
            // Sort by original index to maintain filename order
            loadedImages.sort((a, b) => a.index - b.index);
            const sortedData = loadedImages.map(item => item.data);
            const firstImage = loadedImages[0];

            updateWidget({
              images: [...widget.images, ...sortedData],
              width: widget.images.length === 0 ? firstImage.width : widget.width,
              height: widget.images.length === 0 ? firstImage.height : widget.height,
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const moveFrame = (index: number, direction: 'up' | 'down') => {
    const newImages = [...widget.images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    updateWidget({ images: newImages });
  };

  const removeFrame = (index: number) => {
    const newImages = [...widget.images];
    newImages.splice(index, 1);
    updateWidget({ images: newImages });
  };

  const clearAllFrames = () => {
    updateWidget({ images: [] });
  };

  const reverseFrames = () => {
    updateWidget({ images: [...widget.images].reverse() });
  };

  return (
    <>
      <div style={{
        background: 'rgba(0, 136, 255, 0.1)',
        border: '1px solid rgba(0, 136, 255, 0.3)',
        borderRadius: 4,
        padding: 8,
        marginBottom: 12,
        fontSize: 11,
        color: '#0088ff',
      }}>
        AIDA64 Primitive: Frame-based gauge animation
      </div>

      <Select
        label="Sensor Binding"
        value={widget.sensorBinding || ''}
        options={sensorOptions}
        onChange={(v) =>
          updateWidget({ sensorBinding: (v || null) as SensorKey | null })
        }
      />

      {/* Frame Import */}
      <div className="input-group">
        <label className="input-label">Frames ({widget.images.length})</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif"
          multiple
          onChange={handleFramesUpload}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            fullWidth
          >
            + Add Frames
          </Button>
          {widget.images.length > 0 && (
            <Button
              variant="danger"
              onClick={clearAllFrames}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Frame List */}
      {widget.images.length > 0 && (
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Frame Order</label>
            <button
              className="widget-action-btn"
              onClick={reverseFrames}
              title="Reverse frame order"
              style={{ padding: '2px 8px', fontSize: 10 }}
            >
              ⇅ Reverse
            </button>
          </div>
          <div style={{
            maxHeight: 150,
            overflowY: 'auto',
            border: '1px solid #333',
            borderRadius: 4,
            padding: 4,
            marginTop: 4,
          }}>
            {widget.images.map((src, index) => (
              <div
                key={`frame-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 4px',
                  background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  fontSize: 11,
                }}
              >
                <img
                  src={src}
                  alt={`Frame ${index + 1}`}
                  style={{ width: 24, height: 24, objectFit: 'contain', background: '#222' }}
                />
                <span style={{ flex: 1, color: '#888' }}>
                  Frame {index + 1}
                </span>
                <button
                  className="widget-action-btn"
                  title="Move Up"
                  onClick={() => moveFrame(index, 'up')}
                  style={{ opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'default' : 'pointer' }}
                >
                  ↑
                </button>
                <button
                  className="widget-action-btn"
                  title="Move Down"
                  onClick={() => moveFrame(index, 'down')}
                  style={{ opacity: index === widget.images.length - 1 ? 0.3 : 1, cursor: index === widget.images.length - 1 ? 'default' : 'pointer' }}
                >
                  ↓
                </button>
                <button
                  className="widget-action-btn"
                  title="Remove"
                  onClick={() => removeFrame(index)}
                  style={{ color: '#ff4444' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel-row">
        <Input
          label="Width"
          type="number"
          value={widget.width}
          onChange={(v) => updateWidget({ width: parseInt(v) || 100 })}
          min={1}
        />
        <Input
          label="Height"
          type="number"
          value={widget.height}
          onChange={(v) => updateWidget({ height: parseInt(v) || 100 })}
          min={1}
        />
      </div>

      {/* Value Range */}
      <div className="panel-row">
        <Input
          label="Min Value"
          type="number"
          value={widget.minValue}
          onChange={(v) => updateWidget({ minValue: parseFloat(v) || 0 })}
        />
        <Input
          label="Max Value"
          type="number"
          value={widget.maxValue}
          onChange={(v) => updateWidget({ maxValue: parseFloat(v) || 100 })}
        />
      </div>

      <Checkbox
        label="Clamp Value to Range"
        checked={widget.clamp}
        onChange={(c) => updateWidget({ clamp: c })}
      />

      <Checkbox
        label="Use Modulo (for time cycling)"
        checked={widget.useModulo}
        onChange={(c) => updateWidget({ useModulo: c })}
      />

      {widget.useModulo && (
        <>
          <Select
            label="Time Unit"
            value={String(widget.moduloDivisor || 1)}
            options={[
              { value: '1', label: 'Seconds (divisor: 1)' },
              { value: '60', label: 'Minutes (divisor: 60)' },
              { value: '3600', label: 'Hours (divisor: 3600)' },
            ]}
            onChange={(v) => updateWidget({ moduloDivisor: parseInt(v) || 1 })}
          />
          <div style={{
            background: 'rgba(255, 170, 0, 0.1)',
            border: '1px solid rgba(255, 170, 0, 0.3)',
            borderRadius: 4,
            padding: 8,
            marginTop: 4,
            fontSize: 10,
            color: '#ffaa00',
          }}>
            Frame = floor(sensorValue / {widget.moduloDivisor || 1}) % {widget.images.length || 'frameCount'}
            <br />
            <span style={{ color: '#888' }}>
              {widget.moduloDivisor === 1 && 'Updates every second'}
              {widget.moduloDivisor === 60 && 'Updates every minute'}
              {widget.moduloDivisor === 3600 && 'Updates every hour'}
            </span>
          </div>
        </>
      )}

      {/* Regenerate in Foundry */}
      <div className="input-group" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #333' }}>
        <label className="input-label">{getFoundryName()}</label>
        <Button
          variant="primary"
          onClick={handleOpenFoundry}
          fullWidth
          disabled={widget.sourceFoundry === 'uploaded'}
        >
          Regenerate at Current Size
        </Button>
        <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
          {widget.sourceFoundry === 'uploaded'
            ? 'Uploaded frames cannot be regenerated'
            : `Open the ${getFoundryName()} to generate new frames at ${widget.width}x${widget.height}`}
        </div>
      </div>
    </>
  );
};

// ============================================================================
// RadialSegmentWidget Properties (DEPRECATED)
// ============================================================================

interface RadialSegmentWidgetPropertiesProps {
  widget: RadialSegmentWidget;
  sensorOptions: { value: string; label: string }[];
  updateWidget: (updates: Partial<RadialSegmentWidget>) => void;
}

const RadialSegmentWidgetProperties: React.FC<RadialSegmentWidgetPropertiesProps> = ({
  widget,
  sensorOptions,
  updateWidget,
}) => {
  return (
    <>
      <Select
        label="Sensor Binding"
        value={widget.sensorBinding || ''}
        options={sensorOptions}
        onChange={(v) =>
          updateWidget({ sensorBinding: (v || null) as SensorKey | null })
        }
      />

      <div className="panel-row">
        <Input
          label="Center X"
          type="number"
          value={widget.centerX}
          onChange={(v) => updateWidget({ centerX: parseFloat(v) || 50 })}
        />
        <Input
          label="Center Y"
          type="number"
          value={widget.centerY}
          onChange={(v) => updateWidget({ centerY: parseFloat(v) || 50 })}
        />
      </div>

      <div className="panel-row">
        <Input
          label="Inner Radius"
          type="number"
          value={widget.innerRadius}
          onChange={(v) => updateWidget({ innerRadius: parseFloat(v) || 30 })}
          min={0}
        />
        <Input
          label="Outer Radius"
          type="number"
          value={widget.outerRadius}
          onChange={(v) => updateWidget({ outerRadius: parseFloat(v) || 50 })}
          min={1}
        />
      </div>

      <div className="panel-row">
        <Input
          label="Start Angle"
          type="number"
          value={widget.startAngle}
          onChange={(v) => updateWidget({ startAngle: parseFloat(v) || 0 })}
        />
        <Input
          label="End Angle"
          type="number"
          value={widget.endAngle}
          onChange={(v) => updateWidget({ endAngle: parseFloat(v) || 180 })}
        />
      </div>

      <div className="panel-row">
        <Input
          label="Segments"
          type="number"
          value={widget.segmentCount}
          onChange={(v) =>
            updateWidget({ segmentCount: Math.max(1, parseInt(v) || 10) })
          }
          min={1}
          max={50}
        />
        <Input
          label="Gap"
          type="number"
          value={widget.segmentGap}
          onChange={(v) => updateWidget({ segmentGap: parseFloat(v) || 2 })}
          min={0}
        />
      </div>

      <Input
        label="Active Color"
        type="color"
        value={widget.activeColor}
        onChange={(v) => updateWidget({ activeColor: v })}
      />

      <Input
        label="Inactive Color"
        type="color"
        value={widget.inactiveColor}
        onChange={(v) => updateWidget({ inactiveColor: v })}
      />

      <div className="panel-row">
        <Input
          label="Min Value"
          type="number"
          value={widget.minValue}
          onChange={(v) => updateWidget({ minValue: parseFloat(v) || 0 })}
        />
        <Input
          label="Max Value"
          type="number"
          value={widget.maxValue}
          onChange={(v) => updateWidget({ maxValue: parseFloat(v) || 100 })}
        />
      </div>
    </>
  );
};
