/**
 * LabelsLayer
 * Renders static numeric labels along an arc or line
 * 
 * AUTHORING-ONLY
 */

import React from 'react';
import { Group, Text } from 'react-konva';
import { LabelParams, TickParams } from '@/stores/foundryStore';

interface LabelsLayerProps {
    params: LabelParams;
    tickParams: TickParams;
    centerX: number;
    centerY: number;
    scale?: number;
    width?: number;
    height?: number;
}

export const LabelsLayer: React.FC<LabelsLayerProps> = ({
    params,
    tickParams,
    centerX,
    centerY,
    scale = 1,
    width = 200,
    height = 200
}) => {
    if (!params.enabled) return null;

    const {
        minValue,
        maxValue,
        step,
        fontSize,
        fontWeight,
        fontFamily,
        color,
        opacity,
        offset, // Offset from TICKS (which are at 'radius')
        upright,
        reversed,
        unit
    } = params;

    const labels = [];

    // Calculate how many labels to show
    const count = Math.floor((maxValue - minValue) / Math.max(0.1, step)) + 1;

    if (tickParams.mode === 'arc') {
        const totalAngle = tickParams.endAngle - tickParams.startAngle;
        const radius = tickParams.radius + offset; // Adding offset to push away from center

        for (let i = 0; i < count; i++) {
            const value = minValue + i * step;
            const angle = tickParams.startAngle + (i / Math.max(1, count - 1)) * totalAngle;
            const rad = (angle * Math.PI) / 180;

            const x = centerX + Math.cos(rad) * radius * scale;
            const y = centerY + Math.sin(rad) * radius * scale;

            const labelText = `${value}${unit}`;
            const textWidth = fontSize * labelText.length * 0.6; // Approximation

            labels.push(
                <Text
                    key={`label-${i}`}
                    text={labelText}
                    x={x}
                    y={y}
                    width={textWidth * scale}
                    fontSize={fontSize * scale}
                    fontFamily={fontFamily}
                    fontStyle={fontWeight}
                    fill={color}
                    opacity={opacity}
                    align="center"
                    offsetX={(textWidth * scale) / 2}
                    offsetY={(fontSize * scale) / 2}
                    rotation={upright ? 0 : angle + 90}
                />
            );
        }
    } else if (tickParams.mode === 'horizontal') {
        const startX = centerX - (width / 2) * 0.8;
        const totalWidth = width * 0.8;
        const y = centerY + tickParams.offset * scale + offset * scale;

        for (let i = 0; i < count; i++) {
            const value = minValue + i * step;
            const t = reversed ? (1 - i / Math.max(1, count - 1)) : (i / Math.max(1, count - 1));
            const x = startX + t * totalWidth;
            const labelText = `${value}${unit}`;
            const textWidth = fontSize * labelText.length * 0.6;

            labels.push(
                <Text
                    key={`label-h-${i}`}
                    text={labelText}
                    x={x}
                    y={y}
                    width={textWidth * scale}
                    fontSize={fontSize * scale}
                    fontFamily={fontFamily}
                    fontStyle={fontWeight}
                    fill={color}
                    opacity={opacity}
                    align="center"
                    offsetX={(textWidth * scale) / 2}
                />
            );
        }
    } else if (tickParams.mode === 'vertical') {
        const startY = centerY - (height / 2) * 0.8;
        const totalHeight = height * 0.8;
        const x = centerX + tickParams.offset * scale + offset * scale;

        for (let i = 0; i < count; i++) {
            const value = minValue + i * step;
            const t = reversed ? (i / Math.max(1, count - 1)) : (1 - i / Math.max(1, count - 1)); // 0 at bottom
            const y = startY + t * totalHeight;
            const labelText = `${value}${unit}`;
            const textWidth = fontSize * labelText.length * 0.6;

            labels.push(
                <Text
                    key={`label-v-${i}`}
                    text={labelText}
                    x={x}
                    y={y}
                    width={textWidth * scale}
                    fontSize={fontSize * scale}
                    fontFamily={fontFamily}
                    fontStyle={fontWeight}
                    fill={color}
                    opacity={opacity}
                    offsetX={textWidth * scale}
                    offsetY={(fontSize * scale) / 2}
                />
            );
        }
    }

    return <Group>{labels}</Group>;
};
