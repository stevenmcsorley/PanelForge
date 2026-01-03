/**
 * TicksLayer
 * Renders static tick marks (arc or linear) using Konva
 * 
 * AUTHORING-ONLY
 */

import React from 'react';
import { Group, Line } from 'react-konva';
import { TickParams } from '@/stores/foundryStore';

interface TicksLayerProps {
    params: TickParams;
    centerX: number;
    centerY: number;
    scale?: number;
    width?: number;
    height?: number;
}

export const TicksLayer: React.FC<TicksLayerProps> = ({
    params,
    centerX,
    centerY,
    scale = 1,
    width = 200,
    height = 200
}) => {
    if (!params.enabled) return null;

    const {
        mode,
        startAngle,
        endAngle,
        majorCount,
        minorSteps,
        majorLength,
        minorLength,
        majorWidth,
        minorWidth,
        color,
        opacity,
        radius,
        offset
    } = params;

    const ticks = [];

    if (mode === 'arc') {
        const totalAngle = endAngle - startAngle;

        for (let i = 0; i < majorCount; i++) {
            // Major tick
            const angle = startAngle + (i / Math.max(1, majorCount - 1)) * totalAngle;
            const rad = (angle * Math.PI) / 180;

            const x1 = centerX + Math.cos(rad) * radius * scale;
            const y1 = centerY + Math.sin(rad) * radius * scale;
            const x2 = centerX + Math.cos(rad) * (radius - majorLength) * scale;
            const y2 = centerY + Math.sin(rad) * (radius - majorLength) * scale;

            ticks.push(
                <Line
                    key={`major-${i}`}
                    points={[x1, y1, x2, y2]}
                    stroke={color}
                    strokeWidth={majorWidth * scale}
                    opacity={opacity}
                    lineCap="round"
                />
            );

            // Minor ticks
            if (i < majorCount - 1 && minorSteps > 0) {
                for (let j = 1; j <= minorSteps; j++) {
                    const minorAngle = angle + (j / (minorSteps + 1)) * (totalAngle / Math.max(1, majorCount - 1));
                    const minorRad = (minorAngle * Math.PI) / 180;

                    const mx1 = centerX + Math.cos(minorRad) * radius * scale;
                    const my1 = centerY + Math.sin(minorRad) * radius * scale;
                    const mx2 = centerX + Math.cos(minorRad) * (radius - minorLength) * scale;
                    const my2 = centerY + Math.sin(minorRad) * (radius - minorLength) * scale;

                    ticks.push(
                        <Line
                            key={`minor-${i}-${j}`}
                            points={[mx1, my1, mx2, my2]}
                            stroke={color}
                            strokeWidth={minorWidth * scale}
                            opacity={opacity}
                            lineCap="round"
                        />
                    );
                }
            }
        }
    } else if (mode === 'horizontal') {
        const startX = centerX - (width / 2) * 0.8;
        const totalWidth = width * 0.8;
        const y = centerY + offset * scale;

        for (let i = 0; i < majorCount; i++) {
            const x = startX + (i / Math.max(1, majorCount - 1)) * totalWidth;

            ticks.push(
                <Line
                    key={`major-h-${i}`}
                    points={[x, y, x, y - majorLength * scale]}
                    stroke={color}
                    strokeWidth={majorWidth * scale}
                    opacity={opacity}
                    lineCap="round"
                />
            );

            if (i < majorCount - 1 && minorSteps > 0) {
                for (let j = 1; j <= minorSteps; j++) {
                    const mx = x + (j / (minorSteps + 1)) * (totalWidth / Math.max(1, majorCount - 1));
                    ticks.push(
                        <Line
                            key={`minor-h-${i}-${j}`}
                            points={[mx, y, mx, y - minorLength * scale]}
                            stroke={color}
                            strokeWidth={minorWidth * scale}
                            opacity={opacity}
                            lineCap="round"
                        />
                    );
                }
            }
        }
    } else if (mode === 'vertical') {
        const startY = centerY - (height / 2) * 0.8;
        const totalHeight = height * 0.8;
        const x = centerX + offset * scale;

        for (let i = 0; i < majorCount; i++) {
            const y = (startY + totalHeight) - (i / Math.max(1, majorCount - 1)) * totalHeight;

            ticks.push(
                <Line
                    key={`major-v-${i}`}
                    points={[x, y, x - majorLength * scale, y]}
                    stroke={color}
                    strokeWidth={majorWidth * scale}
                    opacity={opacity}
                    lineCap="round"
                />
            );

            if (i < majorCount - 1 && minorSteps > 0) {
                for (let j = 1; j <= minorSteps; j++) {
                    const my = (startY + totalHeight) - (i / Math.max(1, majorCount - 1)) * totalHeight - (j / (minorSteps + 1)) * (totalHeight / Math.max(1, majorCount - 1));
                    ticks.push(
                        <Line
                            key={`minor-v-${i}-${j}`}
                            points={[x, my, x - minorLength * scale, my]}
                            stroke={color}
                            strokeWidth={minorWidth * scale}
                            opacity={opacity}
                            lineCap="round"
                        />
                    );
                }
            }
        }
    }

    return <Group>{ticks}</Group>;
};
