/**
 * MaskedImageWidgetRenderer
 *
 * AIDA64's bar/arc animation via image cropping.
 * Used for: LED arcs baked into PNGs, curved progress bars, level meters
 *
 * AIDA64 Parity:
 * - Image is cropped (not scaled) based on sensor value
 * - Fill percentage = (value - minValue) / (maxValue - minValue)
 * - Only the "filled" portion of the image is visible
 * - Supports four mask directions: left→right, right→left, bottom→top, top→bottom
 */

import React, { useEffect, useState } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import { MaskedImageWidget, SensorKey } from '@/types';
import { useSensorValue } from '@/hooks';
import { calculateMaskFill, evaluateVisibilityRule } from '@/utils';
import { useSensorStore } from '@/stores';

interface MaskedImageWidgetRendererProps {
  widget: MaskedImageWidget;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export const MaskedImageWidgetRenderer: React.FC<MaskedImageWidgetRendererProps> = ({
  widget,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const sensorValue = useSensorValue(widget.sensorBinding);
  const sensors = useSensorStore((state) => state.sensors);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Build sensor values map for visibility evaluation
  const sensorValues = Object.fromEntries(
    Object.entries(sensors).map(([key, state]) => [key, state.value])
  ) as Record<SensorKey, number>;

  // Evaluate visibility rule
  const isVisibleByRule = evaluateVisibilityRule(
    widget.visibilityRule,
    sensorValues,
    widget.sensorBinding
  );

  // Load image
  useEffect(() => {
    if (!widget.src) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.src = widget.src;
    img.onload = () => {
      setImage(img);
      setLoadError(false);
    };
    img.onerror = () => {
      setImage(null);
      setLoadError(true);
    };
  }, [widget.src]);

  // Calculate fill percentage based on sensor value
  const fillPercent = widget.sensorBinding
    ? calculateMaskFill(sensorValue, widget.minValue, widget.maxValue)
    : 0.5; // Default to 50% when not bound

  /**
   * Calculate clip region based on mask direction
   * AIDA64 crops the image, showing only the "filled" portion
   */
  const calculateClipRegion = () => {
    const { width, height, maskDirection } = widget;

    switch (maskDirection) {
      case 'left_to_right':
        // Fills from left edge toward right
        return {
          x: 0,
          y: 0,
          width: width * fillPercent,
          height: height,
        };

      case 'right_to_left':
        // Fills from right edge toward left
        return {
          x: width * (1 - fillPercent),
          y: 0,
          width: width * fillPercent,
          height: height,
        };

      case 'bottom_to_top':
        // Fills from bottom edge toward top (most common for level indicators)
        return {
          x: 0,
          y: height * (1 - fillPercent),
          width: width,
          height: height * fillPercent,
        };

      case 'top_to_bottom':
        // Fills from top edge toward bottom
        return {
          x: 0,
          y: 0,
          width: width,
          height: height * fillPercent,
        };

      default:
        return { x: 0, y: 0, width, height };
    }
  };

  /**
   * Calculate the "inactive" region (opposite of active)
   */
  const calculateInactiveRegion = () => {
    const { width, height, maskDirection } = widget;

    switch (maskDirection) {
      case 'left_to_right':
        return {
          x: width * fillPercent,
          y: 0,
          width: width * (1 - fillPercent),
          height: height,
        };

      case 'right_to_left':
        return {
          x: 0,
          y: 0,
          width: width * (1 - fillPercent),
          height: height,
        };

      case 'bottom_to_top':
        return {
          x: 0,
          y: 0,
          width: width,
          height: height * (1 - fillPercent),
        };

      case 'top_to_bottom':
        return {
          x: 0,
          y: height * fillPercent,
          width: width,
          height: height * (1 - fillPercent),
        };

      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  };

  const activeClip = calculateClipRegion();
  const inactiveClip = calculateInactiveRegion();

  // Don't render if visibility rule says hidden
  const shouldRender = widget.visible || isSelected;
  const actualOpacity = !widget.visible ? 0.3 : !isVisibleByRule ? 0 : 1;

  if (!shouldRender && !isVisibleByRule) {
    return null;
  }

  return (
    <Group
      x={widget.x}
      y={widget.y}
      draggable={!widget.locked && widget.visible}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const node = e.target;
        onDragEnd(node.x(), node.y());
      }}
      visible={shouldRender}
      opacity={actualOpacity}
    >
      {/* Selection indicator */}
      {isSelected && (
        <Rect
          x={-2}
          y={-2}
          width={widget.width + 4}
          height={widget.height + 4}
          stroke="#00aaff"
          strokeWidth={1}
          dash={[3, 3]}
        />
      )}

      {/* Lock indicator */}
      {widget.locked && isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={widget.width + 8}
          height={widget.height + 8}
          stroke="#ff6600"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}

      {/* Placeholder if no image or error */}
      {(!image || loadError) && (
        <Rect
          x={0}
          y={0}
          width={widget.width}
          height={widget.height}
          fill="#333"
          stroke="#666"
          strokeWidth={1}
        />
      )}

      {/* Inactive portion (dimmed) - rendered first so active is on top */}
      {image && !loadError && widget.showInactivePortion && inactiveClip.width > 0 && inactiveClip.height > 0 && (
        <KonvaImage
          image={image}
          x={0}
          y={0}
          width={widget.width}
          height={widget.height}
          opacity={widget.inactiveOpacity}
          // Clip to show only inactive region
          clipX={inactiveClip.x}
          clipY={inactiveClip.y}
          clipWidth={inactiveClip.width}
          clipHeight={inactiveClip.height}
        />
      )}

      {/* Active portion (full opacity) */}
      {image && !loadError && activeClip.width > 0 && activeClip.height > 0 && (
        <KonvaImage
          image={image}
          x={0}
          y={0}
          width={widget.width}
          height={widget.height}
          // Clip to show only active region
          clipX={activeClip.x}
          clipY={activeClip.y}
          clipWidth={activeClip.width}
          clipHeight={activeClip.height}
        />
      )}

      {/* Fill level indicator line (when selected) */}
      {isSelected && (
        <>
          {widget.maskDirection === 'bottom_to_top' && (
            <Rect
              x={0}
              y={widget.height * (1 - fillPercent)}
              width={widget.width}
              height={2}
              fill="#ff0000"
            />
          )}
          {widget.maskDirection === 'top_to_bottom' && (
            <Rect
              x={0}
              y={widget.height * fillPercent}
              width={widget.width}
              height={2}
              fill="#ff0000"
            />
          )}
          {widget.maskDirection === 'left_to_right' && (
            <Rect
              x={widget.width * fillPercent}
              y={0}
              width={2}
              height={widget.height}
              fill="#ff0000"
            />
          )}
          {widget.maskDirection === 'right_to_left' && (
            <Rect
              x={widget.width * (1 - fillPercent)}
              y={0}
              width={2}
              height={widget.height}
              fill="#ff0000"
            />
          )}
        </>
      )}
    </Group>
  );
};
