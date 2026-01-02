/**
 * WidgetListPanel
 * Lists all widgets, allows selection, z-order, and visibility control
 *
 * AIDA64 Parity:
 * - New widget buttons for image_transform and masked_image
 * - RadialSegment marked as deprecated
 * - Respects AIDA64 compatibility mode (hides non-AIDA64 widgets)
 */

import React, { useState } from 'react';
import {
  useWidgetStore,
  useCanvasStore,
  createDefaultTextWidget,
  createDefaultImageWidget,
  createDefaultImageTransformWidget,
  createDefaultMaskedImageWidget,
  createDefaultImageSequenceWidget,
  createDefaultRadialSegmentWidget,
} from '@/stores';
import { isAIDA64Compatible, isDeprecatedWidget } from '@/types';
import { Button } from '@/components/ui';

export const WidgetListPanel: React.FC = () => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const {
    widgets,
    selectedWidgetId,
    selectWidget,
    addWidget,
    removeWidget,
    toggleLock,
    toggleVisibility,
    bringToFront,
    sendToBack,
  } = useWidgetStore();

  const { aida64Settings } = useCanvasStore();

  // Sort by z-index for display (highest first)
  // In AIDA64 mode, filter out non-compatible widgets
  const sortedWidgets = [...widgets]
    .filter((w) => !aida64Settings.compatibilityMode || isAIDA64Compatible(w.type))
    .sort((a, b) => b.zIndex - a.zIndex);

  const handleAddText = () => {
    addWidget(createDefaultTextWidget());
    setShowAddMenu(false);
  };

  const handleAddImage = () => {
    addWidget(createDefaultImageWidget());
    setShowAddMenu(false);
  };

  const handleAddImageTransform = () => {
    addWidget(createDefaultImageTransformWidget());
    setShowAddMenu(false);
  };

  const handleAddMaskedImage = () => {
    addWidget(createDefaultMaskedImageWidget());
    setShowAddMenu(false);
  };

  const handleAddImageSequence = () => {
    addWidget(createDefaultImageSequenceWidget());
    setShowAddMenu(false);
  };

  const handleAddRadial = () => {
    addWidget(createDefaultRadialSegmentWidget());
    setShowAddMenu(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        Widgets
        {aida64Settings.compatibilityMode && (
          <span style={{ color: '#0088ff', fontSize: 10, marginLeft: 8 }}>
            AIDA64 MODE
          </span>
        )}
      </div>

      {/* Add widget dropdown */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Button
          variant="primary"
          onClick={() => setShowAddMenu(!showAddMenu)}
          fullWidth
        >
          + Add Widget
        </Button>

        {showAddMenu && (
          <div className="widget-add-menu">
            <div className="widget-add-section">
              <div className="widget-add-section-title">Basic</div>
              <button className="widget-add-item" onClick={handleAddText}>
                Text
                <span className="widget-add-desc">Static or sensor-bound text</span>
              </button>
              <button className="widget-add-item" onClick={handleAddImage}>
                Image
                <span className="widget-add-desc">Static image with optional rotation</span>
              </button>
            </div>

            <div className="widget-add-section">
              <div className="widget-add-section-title">AIDA64 Primitives</div>
              <button className="widget-add-item aida64" onClick={handleAddImageTransform}>
                Rotating Image
                <span className="widget-add-desc">Needles, fans, rotating indicators</span>
              </button>
              <button className="widget-add-item aida64" onClick={handleAddMaskedImage}>
                Masked Image
                <span className="widget-add-desc">LED arcs, progress bars, level meters</span>
              </button>
              <button className="widget-add-item aida64" onClick={handleAddImageSequence}>
                Image Sequence
                <span className="widget-add-desc">Frame-based gauges (AIDA64 style)</span>
              </button>
            </div>

            {!aida64Settings.compatibilityMode && (
              <div className="widget-add-section">
                <div className="widget-add-section-title deprecated">Legacy (Deprecated)</div>
                <button className="widget-add-item deprecated" onClick={handleAddRadial}>
                  Radial Gauge
                  <span className="widget-add-desc">Use Rotating + Masked instead</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="widget-list">
        {sortedWidgets.length === 0 && (
          <div style={{ color: '#666', fontSize: 12, padding: 10 }}>
            No widgets yet. Add one above.
          </div>
        )}

        {sortedWidgets.map((widget) => (
          <div
            key={widget.id}
            className={`widget-list-item ${widget.id === selectedWidgetId ? 'selected' : ''
              } ${widget.locked ? 'locked' : ''} ${!widget.visible ? 'hidden' : ''
              } ${isDeprecatedWidget(widget.type) ? 'deprecated' : ''}`}
            onClick={() => selectWidget(widget.id)}
          >
            <div>
              <div className="widget-name">
                {widget.name}
                {isDeprecatedWidget(widget.type) && (
                  <span className="deprecated-badge">DEPRECATED</span>
                )}
              </div>
              <div className="widget-type">
                {widget.type.replace('_', ' ')}
                {widget.type === 'image_transform' && ' (AIDA64)'}
                {widget.type === 'masked_image' && ' (AIDA64)'}
                {widget.type === 'image_sequence' && ' (AIDA64)'}
              </div>
            </div>
            <div className="widget-actions">
              <button
                className="widget-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(widget.id);
                }}
                title={widget.visible ? 'Hide' : 'Show'}
              >
                {widget.visible ? '👁' : '👁‍🗨'}
              </button>
              <button
                className="widget-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(widget.id);
                }}
                title={widget.locked ? 'Unlock' : 'Lock'}
              >
                {widget.locked ? '🔒' : '🔓'}
              </button>
              <button
                className="widget-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeWidget(widget.id);
                }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedWidgetId && (
        <div className="button-row" style={{ marginTop: 12 }}>
          <Button
            variant="secondary"
            onClick={() => bringToFront(selectedWidgetId)}
          >
            ↑ Front
          </Button>
          <Button
            variant="secondary"
            onClick={() => sendToBack(selectedWidgetId)}
          >
            ↓ Back
          </Button>
        </div>
      )}
    </div>
  );
};
