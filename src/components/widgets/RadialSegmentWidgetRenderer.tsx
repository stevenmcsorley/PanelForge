/**
 * RadialSegmentWidgetRenderer
 * Renders radial/arc segment gauges
 */

import React from 'react';
import { Group, Arc, Rect } from 'react-konva';
import { RadialSegmentWidget } from '@/types';
import { useSensorValue } from '@/hooks';
import { calculateActiveSegments } from '@/utils';

interface RadialSegmentWidgetRendererProps {
  widget: RadialSegmentWidget;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export const RadialSegmentWidgetRenderer: React.FC<RadialSegmentWidgetRendererProps> = ({
  widget,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const sensorValue = useSensorValue(widget.sensorBinding);

  // Calculate how many segments should be lit
  const activeCount = widget.sensorBinding
    ? calculateActiveSegments(
        sensorValue,
        widget.minValue,
        widget.maxValue,
        widget.segmentCount
      )
    : Math.floor(widget.segmentCount / 2); // Default to half when not bound

  // Calculate segment angles
  const totalAngle = widget.endAngle - widget.startAngle;
  const gapAngleTotal = widget.segmentGap * (widget.segmentCount - 1);
  const segmentAngle = (totalAngle - gapAngleTotal) / widget.segmentCount;

  // Generate segments
  const segments: JSX.Element[] = [];
  for (let i = 0; i < widget.segmentCount; i++) {
    const startAngle = widget.startAngle + i * (segmentAngle + widget.segmentGap);
    const isActive = i < activeCount;

    segments.push(
      <Arc
        key={i}
        x={widget.centerX}
        y={widget.centerY}
        innerRadius={widget.innerRadius}
        outerRadius={widget.outerRadius}
        // Konva uses degrees, with 0 at 3 o'clock, going clockwise
        // We adjust to have 0 at 12 o'clock
        angle={segmentAngle}
        rotation={startAngle - 90}
        fill={isActive ? widget.activeColor : widget.inactiveColor}
      />
    );
  }

  // Calculate bounding box for selection
  const boundingSize = widget.outerRadius * 2 + 10;
  const boundingOffset = widget.outerRadius + 5;

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
      visible={widget.visible}
      opacity={widget.visible ? 1 : 0.3}
    >
      {/* Selection indicator */}
      {isSelected && (
        <Rect
          x={widget.centerX - boundingOffset}
          y={widget.centerY - boundingOffset}
          width={boundingSize}
          height={boundingSize}
          stroke="#00aaff"
          strokeWidth={1}
          dash={[3, 3]}
        />
      )}

      {/* Lock indicator */}
      {widget.locked && isSelected && (
        <Rect
          x={widget.centerX - boundingOffset - 2}
          y={widget.centerY - boundingOffset - 2}
          width={boundingSize + 4}
          height={boundingSize + 4}
          stroke="#ff6600"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}

      {/* Render segments */}
      {segments}

      {/* Center point indicator when selected */}
      {isSelected && (
        <Rect
          x={widget.centerX - 2}
          y={widget.centerY - 2}
          width={4}
          height={4}
          fill="#ff0000"
        />
      )}
    </Group>
  );
};
