/**
 * TextWidgetRenderer
 * Renders text widgets with sensor binding support
 */

import React from 'react';
import { Group, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { TextWidget } from '@/types';
import { useSensorValue } from '@/hooks';
import { formatSensorValue } from '@/utils';

interface TextWidgetRendererProps {
  widget: TextWidget;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export const TextWidgetRenderer: React.FC<TextWidgetRendererProps> = ({
  widget,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  const sensorValue = useSensorValue(widget.sensorBinding);
  const textRef = React.useRef<Konva.Text>(null);

  // Calculate display text
  const displayText = widget.sensorBinding
    ? formatSensorValue(widget.format, sensorValue)
    : widget.text;

  // Get text dimensions for selection box
  const [textWidth, setTextWidth] = React.useState(widget.width);
  const [textHeight, setTextHeight] = React.useState(widget.fontSize);

  React.useEffect(() => {
    if (textRef.current) {
      setTextWidth(Math.max(textRef.current.width(), widget.width));
      setTextHeight(textRef.current.height());
    }
  }, [displayText, widget.fontSize, widget.fontFamily, widget.width]);

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
          x={-2}
          y={-2}
          width={textWidth + 4}
          height={textHeight + 4}
          stroke="#00aaff"
          strokeWidth={1}
          dash={[3, 3]}
          name="editor-overlay"
        />
      )}

      {/* Lock indicator */}
      {widget.locked && isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={textWidth + 8}
          height={textHeight + 8}
          stroke="#ff6600"
          strokeWidth={2}
          dash={[5, 5]}
          name="editor-overlay"
        />
      )}

      <Text
        ref={textRef}
        text={displayText}
        fontFamily={widget.fontFamily}
        fontSize={widget.fontSize}
        fill={widget.fontColor}
        fontStyle={`${widget.fontWeight} ${widget.fontStyle}`}
        align={widget.textAlign}
        width={widget.width}
      />
    </Group>
  );
};
