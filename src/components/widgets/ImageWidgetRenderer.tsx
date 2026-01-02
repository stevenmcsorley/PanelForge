/**
 * ImageWidgetRenderer
 * Renders image widgets with rotation binding support (for needles/gauges)
 */

import React, { useEffect, useState } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import { ImageWidget } from '@/types';
import { useSensorValue } from '@/hooks';
import { mapRange } from '@/utils';

interface ImageWidgetRendererProps {
  widget: ImageWidget;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export const ImageWidgetRenderer: React.FC<ImageWidgetRendererProps> = ({
  widget,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const sensorValue = useSensorValue(widget.sensorBinding);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);

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

  // Calculate rotation
  const rotation = widget.rotationEnabled && widget.sensorBinding
    ? mapRange(
        sensorValue,
        widget.rotationMinValue,
        widget.rotationMaxValue,
        widget.rotationMinAngle,
        widget.rotationMaxAngle
      )
    : widget.rotation;

  // Anchor point for rotation
  const offsetX = widget.width * widget.rotationAnchorX;
  const offsetY = widget.height * widget.rotationAnchorY;

  return (
    <Group
      x={widget.x + offsetX}
      y={widget.y + offsetY}
      rotation={rotation}
      offsetX={offsetX}
      offsetY={offsetY}
      draggable={!widget.locked && widget.visible}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const node = e.target;
        // Adjust for offset when reporting position
        onDragEnd(node.x() - offsetX, node.y() - offsetY);
      }}
      visible={widget.visible}
      opacity={widget.visible ? 1 : 0.3}
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

      {/* Rotation anchor indicator (when selected and rotation enabled) */}
      {isSelected && widget.rotationEnabled && (
        <Rect
          x={offsetX - 3}
          y={offsetY - 3}
          width={6}
          height={6}
          fill="#ff0000"
        />
      )}
    </Group>
  );
};
