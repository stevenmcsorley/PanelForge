/**
 * ImageTransformWidgetRenderer
 *
 * AIDA64's primary animation primitive for rotating images.
 * Used for: Needles, Fans, Mechanical indicators, Rotating dials
 *
 * AIDA64 Parity:
 * - Rotation calculated as: t = clamp((value - minValue) / (maxValue - minValue))
 * - Angle = lerp(minAngle, maxAngle, t)
 * - Pivot point is normalized (0-1) relative to image dimensions
 * - Supports optional smoothing for fluid motion
 */

import React, { useEffect, useState, useRef } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import { ImageTransformWidget, SensorKey } from '@/types';
import { useSensorValue } from '@/hooks';
import { calculateTransformRotation, smoothAngle, evaluateVisibilityRule } from '@/utils';
import { useSensorStore } from '@/stores';

interface ImageTransformWidgetRendererProps {
  widget: ImageTransformWidget;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export const ImageTransformWidgetRenderer: React.FC<ImageTransformWidgetRendererProps> = ({
  widget,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const sensorValue = useSensorValue(widget.sensorBinding);
  const sensors = useSensorStore((state) => state.sensors);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const smoothedAngleRef = useRef<number>(widget.minAngle);

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

  // Calculate rotation based on sensor value
  // AIDA64 formula: t = clamp((value - minValue) / (maxValue - minValue))
  //                 rotation = lerp(minAngle, maxAngle, t)
  const targetRotation = widget.sensorBinding
    ? calculateTransformRotation(
        sensorValue,
        widget.minValue,
        widget.maxValue,
        widget.minAngle,
        widget.maxAngle,
        widget.clampValue
      )
    : widget.minAngle; // Default to minAngle when not bound

  // Apply smoothing if enabled
  const displayRotation = smoothAngle(
    smoothedAngleRef.current,
    targetRotation,
    widget.smoothingFactor
  );
  smoothedAngleRef.current = displayRotation;

  // Calculate pivot point in pixels
  const pivotX = widget.width * widget.pivotX;
  const pivotY = widget.height * widget.pivotY;

  // Don't render if visibility rule says hidden (but still render if just widget.visible is false for editor purposes)
  const shouldRender = widget.visible || isSelected;
  const actualOpacity = !widget.visible ? 0.3 : !isVisibleByRule ? 0 : 1;

  if (!shouldRender && !isVisibleByRule) {
    return null;
  }

  return (
    <Group
      x={widget.x + pivotX}
      y={widget.y + pivotY}
      rotation={displayRotation}
      offsetX={pivotX}
      offsetY={pivotY}
      draggable={!widget.locked && widget.visible}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const node = e.target;
        onDragEnd(node.x() - pivotX, node.y() - pivotY);
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

      {/* Actual image */}
      {image && !loadError && (
        <KonvaImage
          image={image}
          x={0}
          y={0}
          width={widget.width}
          height={widget.height}
        />
      )}

      {/* Pivot point indicator (when selected) */}
      {isSelected && (
        <>
          {/* Pivot point crosshair */}
          <Rect
            x={pivotX - 4}
            y={pivotY - 4}
            width={8}
            height={8}
            fill="#ff0000"
            stroke="#ffffff"
            strokeWidth={1}
          />
          {/* Rotation arc preview */}
          <Rect
            x={pivotX - 2}
            y={-20}
            width={4}
            height={20}
            fill="rgba(255, 0, 0, 0.5)"
          />
        </>
      )}
    </Group>
  );
};
