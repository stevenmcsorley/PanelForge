/**
 * NeedlePreview
 * Renders a gauge needle using Konva vector primitives
 *
 * AUTHORING-ONLY: This component is used in the Foundry for preview.
 * At runtime, only PNG frames are used.
 */

import React from 'react';
import { Group, Line, Circle } from 'react-konva';
import { NeedleParams, BackgroundParams, TickParams, LabelParams, LayerType, EncasingParams } from '@/stores/foundryStore';
import { drawLayersInOrder, applyEncasingToCanvas } from './foundryRenderUtils';

interface NeedlePreviewProps {
    params: NeedleParams;
    value: number;           // 0-100
    centerX: number;
    centerY: number;
    scale?: number;
    width?: number;
    height?: number;
}

export const NeedlePreview: React.FC<NeedlePreviewProps> = ({
    params,
    value,
    centerX,
    centerY,
    scale = 1,
    width = 200,
    height = 200,
}) => {
    const {
        orientation,
        needleLength,
        needleWidth,
        hubRadius,
        needleColor,
        hubColor,
        shadowOpacity,
        minAngle,
        maxAngle
    } = params;

    if (orientation === 'arc') {
        const angle = minAngle + (value / 100) * (maxAngle - minAngle);
        const angleRad = (angle * Math.PI) / 180;

        const tipX = centerX + Math.cos(angleRad) * needleLength * scale;
        const tipY = centerY + Math.sin(angleRad) * needleLength * scale;

        return (
            <Group>
                {/* Shadow */}
                {shadowOpacity > 0 && (
                    <Line
                        points={[centerX, centerY, tipX, tipY]}
                        stroke="black"
                        strokeWidth={needleWidth * scale}
                        opacity={shadowOpacity}
                        lineCap="round"
                        offsetX={-2 * scale}
                        offsetY={-2 * scale}
                    />
                )}

                {/* Needle */}
                <Line
                    points={[centerX, centerY, tipX, tipY]}
                    stroke={needleColor}
                    strokeWidth={needleWidth * scale}
                    lineCap="round"
                />

                {/* Hub */}
                <Circle
                    x={centerX}
                    y={centerY}
                    radius={hubRadius * scale}
                    fill={hubColor}
                    stroke="#111"
                    strokeWidth={1 * scale}
                />
            </Group>
        );
    } else {
        const isHorizontal = orientation === 'horizontal';
        const totalSize = (isHorizontal ? width : height) * 0.8;
        const startPos = (isHorizontal ? centerX : centerY) - totalSize / 2;
        const otherPos = (isHorizontal ? centerY : centerX);

        const pos = startPos + (value / 100) * totalSize;
        const nLen = needleLength * scale;
        const nWid = needleWidth * scale;

        let points;
        if (isHorizontal) {
            points = [pos, otherPos - nLen / 2, pos, otherPos + nLen / 2];
        } else {
            const vPos = startPos + (totalSize - (value / 100) * totalSize);
            points = [otherPos - nLen / 2, vPos, otherPos + nLen / 2, vPos];
        }

        return (
            <Group>
                <Line
                    points={points}
                    stroke={needleColor}
                    strokeWidth={nWid}
                    lineCap="round"
                    shadowColor="black"
                    shadowBlur={3 * scale}
                    shadowOpacity={shadowOpacity}
                />
            </Group>
        );
    }
};

/**
 * Render needle to an offscreen canvas and return as base64 PNG
 */
export async function renderNeedleFrame(
    params: NeedleParams,
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

    const maxDimension = params.orientation === 'arc'
        ? Math.max(params.needleLength, tickParams.enabled ? tickParams.radius : 0)
        : Math.max(width, height) / 2;

    const availableRadius = Math.min(width, height) / 2 - totalEncasingWidth;
    const scale = params.orientation === 'arc'
        ? availableRadius / (maxDimension || 1)
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
        needleParams: params,
        includeLeds: false,
        includeNeedle: true,
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
 * Generate all frames for a needle gauge
 */
export async function generateNeedleFrames(
    params: NeedleParams,
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
        const frame = await renderNeedleFrame(
            params, value, width, height,
            useTransparentBackground,
            bg, ticks, labels, order, encasingParams
        );
        frames.push(frame);
        if (onProgress) onProgress((i + 1) / frameCount);
    }

    return frames;
}
