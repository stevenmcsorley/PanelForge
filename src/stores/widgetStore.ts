/**
 * Widget Store
 * Manages all widgets on the canvas: CRUD, selection, z-ordering
 *
 * AIDA64 Parity: All widget factory functions now include visibilityRule
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Widget,
  TextWidget,
  ImageWidget,
  ImageTransformWidget,
  MaskedImageWidget,
  ImageSequenceWidget,
  RadialSegmentWidget,
  DEFAULT_VISIBILITY_RULE,
} from '@/types';

interface WidgetState {
  widgets: Widget[];
  selectedWidgetId: string | null;
  clipboard: Widget | null;

  // Actions
  addWidget: (widget: Omit<Widget, 'id' | 'zIndex'>) => string;
  updateWidget: <T extends Widget>(id: string, updates: Partial<T>) => void;
  removeWidget: (id: string) => void;
  duplicateWidget: (id: string) => string | null;

  selectWidget: (id: string | null) => void;
  getSelectedWidget: () => Widget | null;

  // Position
  moveWidget: (id: string, x: number, y: number) => void;
  nudgeWidget: (id: string, dx: number, dy: number) => void;

  // Z-ordering
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // Lock/visibility
  toggleLock: (id: string) => void;
  toggleVisibility: (id: string) => void;

  // Clipboard
  copyWidget: (id: string) => void;
  pasteWidget: () => string | null;

  // Bulk operations
  clearWidgets: () => void;
  setWidgets: (widgets: Widget[]) => void;
}

// ============================================================================
// Factory Functions for Creating Default Widgets
// ============================================================================

export function createDefaultTextWidget(
  overrides: Partial<TextWidget> = {}
): Omit<TextWidget, 'id' | 'zIndex'> {
  return {
    type: 'text',
    x: 100,
    y: 100,
    locked: false,
    visible: true,
    name: 'Text Widget',
    visibilityRule: { ...DEFAULT_VISIBILITY_RULE },
    text: 'Label',
    sensorBinding: null,
    format: '{value}',
    fontFamily: 'Arial',
    fontSize: 16,
    fontColor: '#ffffff',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    width: 100,
    ...overrides,
  };
}

export function createDefaultImageWidget(
  overrides: Partial<ImageWidget> = {}
): Omit<ImageWidget, 'id' | 'zIndex'> {
  return {
    type: 'image',
    x: 100,
    y: 100,
    locked: false,
    visible: true,
    name: 'Image Widget',
    visibilityRule: { ...DEFAULT_VISIBILITY_RULE },
    src: '',
    width: 100,
    height: 100,
    sensorBinding: null,
    rotationEnabled: false,
    rotationAnchorX: 0.5,
    rotationAnchorY: 0.5,
    rotationMinAngle: 0,
    rotationMaxAngle: 180,
    rotationMinValue: 0,
    rotationMaxValue: 100,
    rotation: 0,
    ...overrides,
  };
}

/**
 * ImageTransformWidget - AIDA64's primary animation primitive
 *
 * Default configuration creates a needle-style gauge:
 * - Pivot at bottom center (0.5, 1.0)
 * - Sweeps from -90° to 90° (left to right arc)
 * - Maps sensor value 0-100 to angle range
 */
export function createDefaultImageTransformWidget(
  overrides: Partial<ImageTransformWidget> = {}
): Omit<ImageTransformWidget, 'id' | 'zIndex'> {
  return {
    type: 'image_transform',
    x: 100,
    y: 100,
    locked: false,
    visible: true,
    name: 'Rotating Image',
    visibilityRule: { ...DEFAULT_VISIBILITY_RULE },
    src: '',
    width: 100,
    height: 100,
    // Default pivot at bottom center (for needle-style gauges)
    pivotX: 0.5,
    pivotY: 1.0,
    sensorBinding: null,
    minValue: 0,
    maxValue: 100,
    // Default sweep: -90° to +90° (180° arc, left to right)
    minAngle: -90,
    maxAngle: 90,
    clampValue: true,
    smoothingFactor: 0,
    ...overrides,
  };
}

/**
 * MaskedImageWidget - AIDA64's bar/arc animation
 *
 * Default configuration creates a bottom-to-top progress bar
 */
export function createDefaultMaskedImageWidget(
  overrides: Partial<MaskedImageWidget> = {}
): Omit<MaskedImageWidget, 'id' | 'zIndex'> {
  return {
    type: 'masked_image',
    x: 100,
    y: 100,
    locked: false,
    visible: true,
    name: 'Masked Image',
    visibilityRule: { ...DEFAULT_VISIBILITY_RULE },
    src: '',
    width: 100,
    height: 100,
    sensorBinding: null,
    minValue: 0,
    maxValue: 100,
    maskDirection: 'bottom_to_top',
    showInactivePortion: true,
    inactiveOpacity: 0.2,
    ...overrides,
  };
}

/**
 * RadialSegmentWidget - DEPRECATED
 *
 * @deprecated Use createDefaultImageTransformWidget + createDefaultMaskedImageWidget instead
 * Kept for backwards compatibility with existing panel configs
 */
export function createDefaultRadialSegmentWidget(
  overrides: Partial<RadialSegmentWidget> = {}
): Omit<RadialSegmentWidget, 'id' | 'zIndex'> {
  console.warn(
    '[PanelForge] RadialSegmentWidget is deprecated. ' +
    'For AIDA64 parity, use ImageTransformWidget + MaskedImageWidget composition instead.'
  );
  return {
    type: 'radial_segment',
    x: 100,
    y: 100,
    locked: false,
    visible: true,
    name: 'Radial Gauge (Deprecated)',
    visibilityRule: { ...DEFAULT_VISIBILITY_RULE },
    sensorBinding: null,
    centerX: 50,
    centerY: 50,
    innerRadius: 30,
    outerRadius: 50,
    startAngle: 180,
    endAngle: 360,
    segmentCount: 10,
    segmentGap: 2,
    activeColor: '#00ff00',
    inactiveColor: '#333333',
    minValue: 0,
    maxValue: 100,
    ...overrides,
  };
}

/**
 * ImageSequenceWidget - AIDA64-style frame-based gauge
 *
 * Default configuration creates a gauge ready for frame import:
 * - Maps sensor value 0-100 to frame indices
 * - Clamping enabled by default
 */
export function createDefaultImageSequenceWidget(
  overrides: Partial<ImageSequenceWidget> = {}
): Omit<ImageSequenceWidget, 'id' | 'zIndex'> {
  return {
    type: 'image_sequence',
    x: 100,
    y: 100,
    locked: false,
    visible: true,
    name: 'Image Sequence',
    visibilityRule: { ...DEFAULT_VISIBILITY_RULE },
    images: [],
    sensorBinding: null,
    minValue: 0,
    maxValue: 100,
    clamp: true,
    width: 100,
    height: 100,
    useModulo: false,
    moduloDivisor: 1,
    sourceFoundry: null,
    foundryParams: null,
    ...overrides,
  };
}

// ============================================================================
// Widget Store
// ============================================================================

export const useWidgetStore = create<WidgetState>((set, get) => ({
  widgets: [],
  selectedWidgetId: null,
  clipboard: null,

  addWidget: (widgetData) => {
    const id = uuidv4();
    const maxZ = get().widgets.reduce((max, w) => Math.max(max, w.zIndex), -1);
    const widget = { ...widgetData, id, zIndex: maxZ + 1 } as Widget;

    set((state) => ({
      widgets: [...state.widgets, widget],
      selectedWidgetId: id,
    }));

    return id;
  },

  updateWidget: (id, updates) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    }));
  },

  removeWidget: (id) => {
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
      selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
    }));
  },

  duplicateWidget: (id) => {
    const widget = get().widgets.find((w) => w.id === id);
    if (!widget) return null;

    const newId = uuidv4();
    const maxZ = get().widgets.reduce((max, w) => Math.max(max, w.zIndex), -1);
    const duplicate: Widget = {
      ...widget,
      id: newId,
      x: widget.x + 20,
      y: widget.y + 20,
      zIndex: maxZ + 1,
      name: `${widget.name} (Copy)`,
    };

    set((state) => ({
      widgets: [...state.widgets, duplicate],
      selectedWidgetId: newId,
    }));

    return newId;
  },

  selectWidget: (id) => set({ selectedWidgetId: id }),

  getSelectedWidget: () => {
    const { widgets, selectedWidgetId } = get();
    return widgets.find((w) => w.id === selectedWidgetId) || null;
  },

  moveWidget: (id, x, y) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, x, y } : w
      ),
    }));
  },

  nudgeWidget: (id, dx, dy) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, x: w.x + dx, y: w.y + dy } : w
      ),
    }));
  },

  bringToFront: (id) => {
    const maxZ = get().widgets.reduce((max, w) => Math.max(max, w.zIndex), 0);
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, zIndex: maxZ + 1 } : w
      ),
    }));
  },

  sendToBack: (id) => {
    const minZ = get().widgets.reduce((min, w) => Math.min(min, w.zIndex), 0);
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, zIndex: minZ - 1 } : w
      ),
    }));
  },

  bringForward: (id) => {
    const { widgets } = get();
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return;

    // Find next widget above
    const sortedAbove = widgets
      .filter((w) => w.zIndex > widget.zIndex)
      .sort((a, b) => a.zIndex - b.zIndex);

    if (sortedAbove.length > 0) {
      const swapWith = sortedAbove[0];
      set((state) => ({
        widgets: state.widgets.map((w) => {
          if (w.id === id) return { ...w, zIndex: swapWith.zIndex };
          if (w.id === swapWith.id) return { ...w, zIndex: widget.zIndex };
          return w;
        }),
      }));
    }
  },

  sendBackward: (id) => {
    const { widgets } = get();
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return;

    // Find next widget below
    const sortedBelow = widgets
      .filter((w) => w.zIndex < widget.zIndex)
      .sort((a, b) => b.zIndex - a.zIndex);

    if (sortedBelow.length > 0) {
      const swapWith = sortedBelow[0];
      set((state) => ({
        widgets: state.widgets.map((w) => {
          if (w.id === id) return { ...w, zIndex: swapWith.zIndex };
          if (w.id === swapWith.id) return { ...w, zIndex: widget.zIndex };
          return w;
        }),
      }));
    }
  },

  toggleLock: (id) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, locked: !w.locked } : w
      ),
    }));
  },

  toggleVisibility: (id) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w
      ),
    }));
  },

  copyWidget: (id) => {
    const widget = get().widgets.find((w) => w.id === id);
    if (widget) {
      set({ clipboard: { ...widget } });
    }
  },

  pasteWidget: () => {
    const { clipboard } = get();
    if (!clipboard) return null;

    const newId = uuidv4();
    const maxZ = get().widgets.reduce((max, w) => Math.max(max, w.zIndex), -1);
    const pasted: Widget = {
      ...clipboard,
      id: newId,
      x: clipboard.x + 20,
      y: clipboard.y + 20,
      zIndex: maxZ + 1,
      name: `${clipboard.name} (Copy)`,
    };

    set((state) => ({
      widgets: [...state.widgets, pasted],
      selectedWidgetId: newId,
    }));

    return newId;
  },

  clearWidgets: () => set({ widgets: [], selectedWidgetId: null }),

  setWidgets: (widgets) => set({ widgets, selectedWidgetId: null }),
}));
