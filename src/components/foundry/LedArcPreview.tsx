/**
 * LedArcPreview
 * Renders the LED Arc gauge using Konva vector primitives
 * 
 * AUTHORING-ONLY: This component is used in the Foundry for preview.
 * At runtime, only PNG frames are used.
 */

import React from 'react';
import { Group, Arc, Circle } from 'react-konva';
import { LedArcParams } from '@/stores/foundryStore';

interface LedArcPreviewProps {
    params: LedArcParams;
    value: number;           // 0-100, percentage of segments lit
    centerX: number;
    centerY: number;
    scale?: number;
}

export const LedArcPreview: React.FC<LedArcPreviewProps> = ({
    params,
    value,
    centerX,
    centerY,
    scale = 1,
}) => {
    const {
        arcStartAngle,
        arcEndAngle,
        segmentCount,
        segmentGap,
        innerRadius,
        outerRadius,
        offColor,
        onColor,
        glowStrength,
    } = params;

    // Calculate segment angles
    const totalArcAngle = arcEndAngle - arcStartAngle;
    const totalGapAngle = segmentGap * (segmentCount - 1);
    const segmentAngle = (totalArcAngle - totalGapAngle) / segmentCount;

    // Calculate how many segments should be lit
    const litSegments = Math.round((value / 100) * segmentCount);

    // Generate segments
    const segments = [];
    for (let i = 0; i < segmentCount; i++) {
        const segmentStartAngle = arcStartAngle + i * (segmentAngle + segmentGap);
        const isLit = i < litSegments;

        // Konva Arc uses rotation and angle differently - it expects:
        // - rotation: where to start (from right, clockwise)
        // - angle: how much arc to draw
        // We need to convert our counter-clockwise convention

        segments.push(
            <Arc
                key={`segment-${i}`}
                x={centerX}
                y={centerY}
                innerRadius={innerRadius * scale}
                outerRadius={outerRadius * scale}
                angle={segmentAngle}
                rotation={segmentStartAngle}
                fill={isLit ? onColor : offColor}
                shadowColor={isLit ? onColor : 'transparent'}
                shadowBlur={isLit ? glowStrength * scale : 0}
                shadowOpacity={isLit ? 0.8 : 0}
            />
        );
    }

    // Add optional center decoration
    const centerRadius = innerRadius * 0.3 * scale;

    return (
        <Group>
            {segments}
            {/* Center cap */}
            <Circle
                x={centerX}
                y={centerY}
                radius={centerRadius}
                fill="#1a1a2a"
                stroke="#333"
                strokeWidth={1 * scale}
            />
        </Group>
    );
};

/**
 * Render LED Arc to an offscreen canvas and return as base64 PNG
 * Used for frame generation
 */
export function renderLedArcFrame(
    params: LedArcParams,
    value: number,
    width: number,
    height: number
): Promise<string> {
    return new Promise((resolve) => {
        // Import Konva dynamically to create offscreen stage
        import('konva').then((Konva) => {
            const container = document.createElement('div');
            container.style.display = 'none';
            document.body.appendChild(container);

            const stage = new Konva.default.Stage({
                container,
                width,
                height,
            });

            const layer = new Konva.default.Layer();
            stage.add(layer);

            // Background
            const bg = new Konva.default.Rect({
                x: 0,
                y: 0,
                width,
                height,
                fill: params.backgroundColor,
            });
            layer.add(bg);

            // Calculate scaling
            const maxRadius = params.outerRadius;
            const availableSize = Math.min(width, height) * 0.9;
            const scale = availableSize / (maxRadius * 2);
            const centerX = width / 2;
            const centerY = height / 2;

            // Draw segments
            const {
                arcStartAngle,
                arcEndAngle,
                segmentCount,
                segmentGap,
                innerRadius,
                outerRadius,
                offColor,
                onColor,
                glowStrength,
            } = params;

            const totalArcAngle = arcEndAngle - arcStartAngle;
            const totalGapAngle = segmentGap * (segmentCount - 1);
            const segmentAngle = (totalArcAngle - totalGapAngle) / segmentCount;
            const litSegments = Math.round((value / 100) * segmentCount);

            for (let i = 0; i < segmentCount; i++) {
                const segmentStartAngle = arcStartAngle + i * (segmentAngle + segmentGap);
                const isLit = i < litSegments;

                const arc = new Konva.default.Arc({
                    x: centerX,
                    y: centerY,
                    innerRadius: innerRadius * scale,
                    outerRadius: outerRadius * scale,
                    angle: segmentAngle,
                    rotation: segmentStartAngle,
                    fill: isLit ? onColor : offColor,
                    shadowColor: isLit ? onColor : 'transparent',
                    shadowBlur: isLit ? glowStrength * scale : 0,
                    shadowOpacity: isLit ? 0.8 : 0,
                });
                layer.add(arc);
            }

            // Center cap
            const centerRadius = innerRadius * 0.3 * scale;
            const cap = new Konva.default.Circle({
                x: centerX,
                y: centerY,
                radius: centerRadius,
                fill: '#1a1a2a',
                stroke: '#333',
                strokeWidth: 1 * scale,
            });
            layer.add(cap);

            layer.draw();

            // Export to data URL
            const dataUrl = stage.toDataURL({ pixelRatio: 1 });

            // Cleanup
            stage.destroy();
            document.body.removeChild(container);

            resolve(dataUrl);
        });
    });
}

/**
 * Generate all frames for a LED Arc gauge
 */
export async function generateLedArcFrames(
    params: LedArcParams,
    frameCount: number,
    width: number,
    height: number,
    onProgress?: (progress: number) => void
): Promise<string[]> {
    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
        // Calculate value for this frame (0 to 100)
        const value = (i / (frameCount - 1)) * 100;
        const frame = await renderLedArcFrame(params, value, width, height);
        frames.push(frame);

        if (onProgress) {
            onProgress((i + 1) / frameCount);
        }
    }

    return frames;
}
