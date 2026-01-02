/**
 * Formatting utilities for sensor value display
 * Supports format strings: {value}, {value|round}, {value|fixed(N)}
 */

/**
 * Parse and apply format string to a sensor value
 * @param format - Format string like "{value}", "{value|round}", "{value|fixed(2)}"
 * @param value - The sensor value to format
 * @returns Formatted string
 */
export function formatSensorValue(format: string, value: number): string {
  // Match format patterns: {value}, {value|modifier}, {value|modifier(arg)}
  const pattern = /\{value(?:\|(\w+)(?:\((\d+)\))?)?\}/g;

  return format.replace(pattern, (_match, modifier?: string, arg?: string) => {
    if (!modifier) {
      // Plain {value}
      return String(value);
    }

    switch (modifier.toLowerCase()) {
      case 'round':
        return String(Math.round(value));

      case 'floor':
        return String(Math.floor(value));

      case 'ceil':
        return String(Math.ceil(value));

      case 'fixed':
        const decimals = arg ? parseInt(arg, 10) : 2;
        return value.toFixed(decimals);

      case 'percent':
        return `${Math.round(value)}%`;

      default:
        return String(value);
    }
  });
}

/**
 * Map a value from one range to another
 * Used for rotation angle calculation
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  // Clamp input value
  const clampedValue = Math.min(Math.max(value, inMin), inMax);
  // Linear interpolation
  const normalized = (clampedValue - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
}

/**
 * Calculate how many segments should be "lit" based on value
 */
export function calculateActiveSegments(
  value: number,
  minValue: number,
  maxValue: number,
  segmentCount: number
): number {
  const normalized = (value - minValue) / (maxValue - minValue);
  const clamped = Math.min(Math.max(normalized, 0), 1);
  return Math.round(clamped * segmentCount);
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

// ============================================================================
// AIDA64 Transform Utilities
// ============================================================================

/**
 * Calculate rotation angle for ImageTransformWidget
 *
 * AIDA64 Parity:
 * - t = clamp((value - minValue) / (maxValue - minValue), 0, 1)
 * - rotation = lerp(minAngle, maxAngle, t)
 *
 * @param value - Current sensor value
 * @param minValue - Minimum sensor value
 * @param maxValue - Maximum sensor value
 * @param minAngle - Angle at minimum value (degrees)
 * @param maxAngle - Angle at maximum value (degrees)
 * @param clamp - Whether to clamp value to range
 */
export function calculateTransformRotation(
  value: number,
  minValue: number,
  maxValue: number,
  minAngle: number,
  maxAngle: number,
  clamp: boolean = true
): number {
  let t = (value - minValue) / (maxValue - minValue);

  if (clamp) {
    t = Math.min(Math.max(t, 0), 1);
  }

  return minAngle + t * (maxAngle - minAngle);
}

/**
 * Apply smoothing to angle transitions
 * Uses exponential smoothing for fluid motion
 *
 * @param currentAngle - Current displayed angle
 * @param targetAngle - Target angle based on sensor value
 * @param smoothingFactor - 0 = instant, approaching 1 = very slow
 */
export function smoothAngle(
  currentAngle: number,
  targetAngle: number,
  smoothingFactor: number
): number {
  if (smoothingFactor <= 0) return targetAngle;
  return currentAngle + (targetAngle - currentAngle) * (1 - smoothingFactor);
}

/**
 * Calculate mask clip percentage for MaskedImageWidget
 *
 * AIDA64 Parity:
 * - fillPercent = (value - minValue) / (maxValue - minValue)
 * - Image is cropped (not scaled) based on fill percentage
 *
 * @returns Fill percentage (0-1)
 */
export function calculateMaskFill(
  value: number,
  minValue: number,
  maxValue: number
): number {
  const fill = (value - minValue) / (maxValue - minValue);
  return Math.min(Math.max(fill, 0), 1);
}

// ============================================================================
// Visibility Rule Evaluation (AIDA64 Parity)
// ============================================================================

import type { VisibilityRule, SensorKey } from '@/types';

/**
 * Evaluate a visibility rule against a sensor value
 *
 * AIDA64 Parity:
 * - Visibility rules enable LED segment simulation and warning indicators
 * - Rules are evaluated per update tick
 * - Supports: always, gte (>=), lte (<=), between, equals
 *
 * @param rule - The visibility rule to evaluate
 * @param sensorValues - Map of all current sensor values
 * @param widgetSensorBinding - The widget's own sensor binding (fallback if rule.sensorBinding is null)
 * @returns Whether the widget should be visible
 */
export function evaluateVisibilityRule(
  rule: VisibilityRule,
  sensorValues: Record<SensorKey, number>,
  widgetSensorBinding: SensorKey | null
): boolean {
  // 'always' means always visible
  if (rule.type === 'always') {
    return true;
  }

  // Determine which sensor to use
  const sensorKey = rule.sensorBinding ?? widgetSensorBinding;
  if (!sensorKey) {
    // No sensor binding, default to visible
    return true;
  }

  const value = sensorValues[sensorKey];
  if (value === undefined) {
    return true; // Sensor not found, default visible
  }

  switch (rule.type) {
    case 'gte':
      return rule.threshold !== undefined && value >= rule.threshold;

    case 'lte':
      return rule.threshold !== undefined && value <= rule.threshold;

    case 'between':
      return (
        rule.rangeMin !== undefined &&
        rule.rangeMax !== undefined &&
        value >= rule.rangeMin &&
        value <= rule.rangeMax
      );

    case 'equals':
      return rule.threshold !== undefined && Math.abs(value - rule.threshold) < 0.001;

    default:
      return true;
  }
}
