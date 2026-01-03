/**
 * LedArcPreview
 * Renders the LED Arc gauge using Konva vector primitives
 *
 * AUTHORING-ONLY: This component is used in the Foundry for preview.
 * At runtime, only PNG frames are used.
 */

import React from 'react';
import { Group, Arc, Circle, Rect } from 'react-konva';
import { LedArcParams, BackgroundParams, TickParams, LabelParams, LayerType, EncasingParams } from '@/stores/foundryStore';
import { drawLayersInOrder, applyEncasingToCanvas, getSegmentColors } from './foundryRenderUtils';

interface LedArcPreviewProps {
    params: LedArcParams;
    value: number;           // 0-100, percentage of segments lit
    centerX: number;
    centerY: number;
    width?: number;
    height?: number;
    scale?: number;
}

export const LedArcPreview: React.FC<LedArcPreviewProps> = ({
    params,
    value,
    centerX,
    centerY,
    width = 200,
    height = 200,
    scale = 1,
}) => {
    const {
        orientation,
        arcStartAngle,
        arcEndAngle,
        segmentCount,
        segmentGap,
        innerRadius,
        outerRadius,
        offColor,
        onColor,
        glowStrength,
        colorSplits,
    } = params;

    const litSegments = Math.round((value / 100) * segmentCount);

    if (orientation === 'arc') {
        const totalArcAngle = arcEndAngle - arcStartAngle;
        const totalGapAngle = segmentGap * (segmentCount - 1);
        const segmentAngle = (totalArcAngle - totalGapAngle) / segmentCount;

        const segments = [];
        for (let i = 0; i < segmentCount; i++) {
            const segmentStartAngle = arcStartAngle + i * (segmentAngle + segmentGap);
            const isLit = i < litSegments;
            const { onColor: segOnColor, offColor: segOffColor } = getSegmentColors(
                i, segmentCount, onColor, offColor, colorSplits
            );

            segments.push(
                <Arc
                    key={`segment-${i}`}
                    x={centerX}
                    y={centerY}
                    innerRadius={innerRadius * scale}
                    outerRadius={outerRadius * scale}
                    angle={segmentAngle}
                    rotation={segmentStartAngle}
                    fill={isLit ? segOnColor : segOffColor}
                    shadowColor={isLit ? segOnColor : 'transparent'}
                    shadowBlur={isLit ? glowStrength * scale : 0}
                    shadowOpacity={isLit ? 0.8 : 0}
                />
            );
        }

        const centerRadius = innerRadius * 0.3 * scale;

        return (
            <Group>
                {segments}
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
    } else {
        const isHorizontal = orientation === 'horizontal';
        const totalSize = (isHorizontal ? width : height) * 0.8;
        const startPos = (isHorizontal ? centerX : centerY) - totalSize / 2;
        const otherPos = (isHorizontal ? centerY : centerX) + (params.innerRadius - 60) * scale;

        const thickness = (outerRadius - innerRadius) * scale;
        const totalGap = segmentGap * (segmentCount - 1) * scale;
        const segmentSize = (totalSize - totalGap) / segmentCount;

        const segments = [];
        for (let i = 0; i < segmentCount; i++) {
            const pos = startPos + i * (segmentSize + segmentGap * scale);
            const isLit = i < litSegments;
            const { onColor: segOnColor, offColor: segOffColor } = getSegmentColors(
                i, segmentCount, onColor, offColor, colorSplits
            );

            let x, y, w, h;
            if (isHorizontal) {
                x = pos;
                y = otherPos - thickness / 2;
                w = segmentSize;
                h = thickness;
            } else {
                x = otherPos - thickness / 2;
                y = startPos + (totalSize - pos - segmentSize);
                w = thickness;
                h = segmentSize;
            }

            segments.push(
                <Rect
                    key={`segment-${i}`}
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={isLit ? segOnColor : segOffColor}
                    shadowColor={isLit ? segOnColor : 'transparent'}
                    shadowBlur={isLit ? glowStrength * scale : 0}
                    shadowOpacity={isLit ? 0.8 : 0}
                    cornerRadius={2 * scale}
                />
            );
        }

        return <Group>{segments}</Group>;
    }
};

/**
 * Render LED Arc to an offscreen canvas and return as base64 PNG
 */
export async function renderLedArcFrame(
    params: LedArcParams,
    value: number,
    width: number,
    height: number,
    useTransparentBackground: boolean = false,
    backgroundParams: BackgroundParams,
    tickParams: TickParams,
    labelParams: LabelParams,
    layerOrder: LayerType[] = ['background', 'ticks', 'labels', 'leds', 'needle'],
    encasingParams?: EncasingParams
): Promise<string> {
    const KonvaRaw = await import('konva');
    const Konva = KonvaRaw.default;

    const container = document.createElement('div');
    const stage = new Konva.Stage({
        container,
        width,
        height,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // 1. Background Rect
    if (!useTransparentBackground) {
        layer.add(new Konva.Rect({
            x: 0, y: 0, width, height, fill: params.backgroundColor,
        }));
    }

    // Calculate scaling - gauge fills frame edge-to-edge
    // Account for encasing if enabled
    const rimWidth = encasingParams?.rim.enabled ? encasingParams.rim.width : 0;
    const sealWidth = encasingParams?.rubberSeal.enabled ? encasingParams.rubberSeal.width : 0;
    const totalEncasingWidth = rimWidth + sealWidth;

    const maxRadiusOrSize = params.orientation === 'arc'
        ? Math.max(params.outerRadius, tickParams.enabled ? tickParams.radius : 0)
        : Math.max(width, height) / 2;

    const availableRadius = Math.min(width, height) / 2 - totalEncasingWidth;
    const scale = params.orientation === 'arc'
        ? availableRadius / (maxRadiusOrSize || 1)
        : 1;

    const centerX = width / 2;
    const centerY = height / 2;

    // Draw layers in specified order
    await drawLayersInOrder({
        Konva,
        layer,
        layerOrder,
        value,
        centerX,
        centerY,
        scale,
        width,
        height,
        backgroundParams,
        tickParams,
        labelParams,
        ledArcParams: params,
        includeLeds: true,
        includeNeedle: false,
    });

    layer.draw();

    // Apply encasing if provided
    let dataUrl: string;
    if (encasingParams && (encasingParams.rim.enabled || encasingParams.glass.enabled || encasingParams.screws.enabled || encasingParams.rubberSeal.enabled)) {
        dataUrl = applyEncasingToCanvas(stage, encasingParams, width, height);
    } else {
        dataUrl = stage.toDataURL({ pixelRatio: 1 });
    }

    stage.destroy();
    return dataUrl;
}

/**
 * Generate all frames for a LED Arc gauge
 */
export async function generateLedArcFrames(
    params: LedArcParams,
    frameCount: number,
    width: number,
    height: number,
    useTransparentBackground: boolean = false,
    onProgress?: (progress: number) => void,
    backgroundParams?: BackgroundParams,
    tickParams?: TickParams,
    labelParams?: LabelParams,
    layerOrder?: LayerType[],
    encasingParams?: EncasingParams
): Promise<string[]> {
    const frames: string[] = [];
    const bg = backgroundParams || ({ src: '', opacity: 100, scale: 1, x: 0, y: 0, locked: false } as BackgroundParams);
    const ticks = tickParams || ({ enabled: false } as TickParams);
    const labels = labelParams || ({ enabled: false } as LabelParams);
    const order = layerOrder || ['background', 'ticks', 'labels', 'leds', 'needle'];

    for (let i = 0; i < frameCount; i++) {
        const value = (i / Math.max(1, frameCount - 1)) * 100;
        const frame = await renderLedArcFrame(
            params, value, width, height,
            useTransparentBackground,
            bg, ticks, labels, order, encasingParams
        );
        frames.push(frame);
        if (onProgress) onProgress((i + 1) / frameCount);
    }

    return frames;
}
