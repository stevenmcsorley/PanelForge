/**
 * PanelForge Type Definitions
 * Core types for the AIDA64 SensorPanel designer
 *
 * AIDA64 PARITY NOTES:
 * - AIDA64 does not have first-class "gauges"
 * - All animation is achieved via: static images, image rotation, visibility thresholds, masked bars
 * - This type system reflects those primitives for accurate AIDA64 compatibility
 */

// ============================================================================
// Canvas Types
// ============================================================================

export type CanvasResolution = {
  width: number;
  height: number;
  label: string;
};

export const SUPPORTED_RESOLUTIONS: CanvasResolution[] = [
  { width: 800, height: 480, label: '800×480' },
  { width: 1024, height: 600, label: '1024×600' },
  { width: 1280, height: 400, label: '1280×400' },
  { width: 1920, height: 480, label: '1920×480' },
  { width: 480, height: 1920, label: '480×1920 (Portrait)' },
];

// ============================================================================
// Sensor Types
// ============================================================================

export type SensorKey =
  | 'cpu_temp'
  | 'gpu_temp'
  | 'cpu_load'
  | 'gpu_load'
  | 'ram_usage'
  | 'fan_rpm';

export type SimulationMode = 'static' | 'sine' | 'random_walk' | 'manual';

export interface SensorConfig {
  key: SensorKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
}

export interface SensorState {
  key: SensorKey;
  value: number;
  mode: SimulationMode;
  staticValue: number;
  // Sine wave params
  sineAmplitude: number;
  sineOffset: number;
  sineFrequency: number;
  // Random walk params
  walkStep: number;
}

export const DEFAULT_SENSORS: SensorConfig[] = [
  { key: 'cpu_temp', label: 'CPU Temperature', unit: '°C', min: 20, max: 100, defaultValue: 45 },
  { key: 'gpu_temp', label: 'GPU Temperature', unit: '°C', min: 20, max: 100, defaultValue: 50 },
  { key: 'cpu_load', label: 'CPU Load', unit: '%', min: 0, max: 100, defaultValue: 25 },
  { key: 'gpu_load', label: 'GPU Load', unit: '%', min: 0, max: 100, defaultValue: 30 },
  { key: 'ram_usage', label: 'RAM Usage', unit: '%', min: 0, max: 100, defaultValue: 45 },
  { key: 'fan_rpm', label: 'Fan RPM', unit: 'RPM', min: 0, max: 5000, defaultValue: 1200 },
];

// ============================================================================
// Visibility Rules (AIDA64 Parity)
// ============================================================================

/**
 * Visibility rules control when a widget is displayed based on sensor values.
 * This is how AIDA64 implements LED segments, warning indicators, and conditional displays.
 *
 * Examples:
 * - Show warning icon when cpu_temp >= 80
 * - Show LED segment when value is between 60-70
 * - Always visible (default)
 */
export type VisibilityRuleType = 'always' | 'gte' | 'lte' | 'between' | 'equals';

export interface VisibilityRule {
  type: VisibilityRuleType;
  sensorBinding: SensorKey | null; // null means use widget's own sensor binding
  threshold?: number;              // For gte, lte, equals
  rangeMin?: number;               // For between
  rangeMax?: number;               // For between
}

export const DEFAULT_VISIBILITY_RULE: VisibilityRule = {
  type: 'always',
  sensorBinding: null,
};

// ============================================================================
// Widget Types
// ============================================================================

/**
 * Widget types available in PanelForge
 * - image_transform: AIDA64's primary animation primitive (rotating needles, fans)
 * - masked_image: AIDA64's bar/arc animation via image cropping
 * - radial_segment: DEPRECATED - use composition of image_transform + masked_image instead
 */
export type WidgetType =
  | 'text'
  | 'image'
  | 'image_transform'   // AIDA64-style rotating image
  | 'masked_image'      // AIDA64-style masked/cropped image bar
  | 'image_sequence'    // AIDA64-style frame-based gauge
  | 'radial_segment';   // DEPRECATED

export type TextAlignment = 'left' | 'center' | 'right';

/**
 * Base widget properties shared by all widget types
 * Now includes visibility rules for AIDA64 parity
 */
export interface BaseWidget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  name: string;
  // AIDA64 visibility rules - evaluated per tick
  visibilityRule: VisibilityRule;
}

export interface TextWidget extends BaseWidget {
  type: 'text';
  text: string;
  sensorBinding: SensorKey | null;
  // Format string: {value}, {value|round}, {value|fixed(1)}
  format: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: TextAlignment;
  width: number;
}

export interface ImageWidget extends BaseWidget {
  type: 'image';
  src: string; // Base64 or URL
  width: number;
  height: number;
  // Legacy rotation binding (kept for backwards compatibility)
  sensorBinding: SensorKey | null;
  rotationEnabled: boolean;
  rotationAnchorX: number; // 0-1, relative to image
  rotationAnchorY: number; // 0-1, relative to image
  rotationMinAngle: number;
  rotationMaxAngle: number;
  rotationMinValue: number;
  rotationMaxValue: number;
  rotation: number; // Static rotation when not bound
}

/**
 * ImageTransformWidget - AIDA64's primary animation primitive
 *
 * Used for: Needles, Fans, Mechanical indicators, Rotating dials
 *
 * AIDA64 Parity:
 * - Rotation is calculated as: t = clamp((value - minValue) / (maxValue - minValue))
 * - Angle = lerp(minAngle, maxAngle, t)
 * - Pivot point is normalized (0-1) relative to image dimensions
 * - Optional smoothing for fluid motion (not in original AIDA64, but useful)
 */
export interface ImageTransformWidget extends BaseWidget {
  type: 'image_transform';
  src: string;
  width: number;
  height: number;

  // Pivot point for rotation (normalized 0-1)
  pivotX: number;
  pivotY: number;

  // Sensor binding for animation
  sensorBinding: SensorKey | null;

  // Value range mapping
  minValue: number;
  maxValue: number;

  // Angle range (degrees)
  minAngle: number;
  maxAngle: number;

  // Clamp value to min/max range
  clampValue: boolean;

  // Optional smoothing (0 = instant, 1 = very slow)
  // This is an extension beyond AIDA64 for smoother animations
  smoothingFactor: number;

  // Current smoothed angle (runtime state, not persisted)
  _smoothedAngle?: number;
}

/**
 * MaskDirection - how the image is cropped based on sensor value
 *
 * AIDA64 Parity:
 * - left_to_right: Progress bar fills from left
 * - right_to_left: Progress bar fills from right
 * - bottom_to_top: Vertical bar fills upward (most common for level indicators)
 * - top_to_bottom: Vertical bar fills downward
 */
export type MaskDirection = 'left_to_right' | 'right_to_left' | 'bottom_to_top' | 'top_to_bottom';

/**
 * MaskedImageWidget - AIDA64's bar/arc animation via image cropping
 *
 * Used for: LED arcs baked into PNGs, curved progress bars, level meters
 *
 * AIDA64 Parity:
 * - Image is cropped (not scaled) based on sensor value
 * - Fill percentage = (value - minValue) / (maxValue - minValue)
 * - Only the "filled" portion of the image is visible
 */
export interface MaskedImageWidget extends BaseWidget {
  type: 'masked_image';
  src: string;
  width: number;
  height: number;

  // Sensor binding
  sensorBinding: SensorKey | null;

  // Value range
  minValue: number;
  maxValue: number;

  // Mask direction
  maskDirection: MaskDirection;

  // Whether to show the "empty" portion with reduced opacity
  showInactivePortion: boolean;
  inactiveOpacity: number; // 0-1
}

/**
 * ImageSequenceWidget - AIDA64-style frame-based gauge
 *
 * AIDA64 Parity:
 * - Gauge is an ordered sequence of static images
 * - Each image represents a discrete gauge state
 * - Frame selection: frameIndex = floor(normalized * (images.length - 1))
 * - Only the active frame is rendered at any time
 */
export interface ImageSequenceWidget extends BaseWidget {
  type: 'image_sequence';
  images: string[];           // Ordered frame paths/base64
  sensorBinding: SensorKey | null;
  minValue: number;
  maxValue: number;
  clamp: boolean;
  width: number;
  height: number;
}

/**
 * RadialSegmentWidget - DEPRECATED
 *
 * This widget type does not exist in AIDA64.
 * For AIDA64 parity, use composition of:
 * - Background image (static)
 * - MaskedImageWidget (LED arc PNG)
 * - ImageTransformWidget (needle)
 * - TextWidget (value display)
 *
 * Kept for backwards compatibility with existing configs.
 * @deprecated Use ImageTransformWidget + MaskedImageWidget composition instead
 */
export interface RadialSegmentWidget extends BaseWidget {
  type: 'radial_segment';
  /** @deprecated */
  sensorBinding: SensorKey | null;
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  segmentCount: number;
  segmentGap: number;
  activeColor: string;
  inactiveColor: string;
  minValue: number;
  maxValue: number;
}

export type Widget =
  | TextWidget
  | ImageWidget
  | ImageTransformWidget
  | MaskedImageWidget
  | ImageSequenceWidget
  | RadialSegmentWidget;

// ============================================================================
// AIDA64 Compatibility Mode
// ============================================================================

export interface AIDA64Settings {
  compatibilityMode: boolean;  // When true, hides non-AIDA64 widgets
  pixelPerfect: boolean;       // When true, enforces integer coordinates
  showDeprecationWarnings: boolean;
}

export const DEFAULT_AIDA64_SETTINGS: AIDA64Settings = {
  compatibilityMode: false,
  pixelPerfect: true,
  showDeprecationWarnings: true,
};

// Helper to check if a widget type is AIDA64-compatible
export function isAIDA64Compatible(type: WidgetType): boolean {
  return ['text', 'image', 'image_transform', 'masked_image', 'image_sequence'].includes(type);
}

// Helper to check if a widget type is deprecated
export function isDeprecatedWidget(type: WidgetType): boolean {
  return type === 'radial_segment';
}

// ============================================================================
// Panel Config (for export/import)
// ============================================================================

export interface PanelConfig {
  version: string;
  name: string;
  resolution: CanvasResolution;
  backgroundColor: string;
  backgroundImage: string | null;
  showGrid: boolean;
  gridSize: number;
  widgets: Widget[];
  sensorStates: Record<SensorKey, Omit<SensorState, 'key' | 'value'>>;
  // New: AIDA64 settings
  aida64Settings?: AIDA64Settings;
}
