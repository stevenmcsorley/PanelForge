/**
 * CompositePreview
 * Renders LED Arc + Needle combined as a composite gauge
 *
 * AUTHORING-ONLY: This component is used in the Foundry for preview.
 * At runtime, only PNG frames are used.
 */

import React from 'react';
import { Group } from 'react-konva';
import { LedArcParams, NeedleParams, BackgroundParams, TickParams, LabelParams, LayerType, EncasingParams } from '@/stores/foundryStore';
import { LedArcPreview } from './LedArcPreview';
import { NeedlePreview } from './NeedlePreview';
import { drawLayersInOrder, applyEncasingToCanvas } from './foundryRenderUtils';

interface CompositePreviewProps {
    ledArcParams: LedArcParams;
    needleParams: NeedleParams;
    value: number;           // 0-100
    width: number;
    height: number;
    scale?: number;
}

export const CompositePreview: React.FC<CompositePreviewProps> = ({
    ledArcParams,
    needleParams,
    value,
    width,
    height,
    scale = 1,
}) => {
    const centerX = width / 2;
    const centerY = height / 2;

    return (
        <Group>
            {/* Template Layers */}
            <LedArcPreview
                params={ledArcParams}
                value={value}
                centerX={centerX}
                centerY={centerY}
                scale={scale}
            />

            <NeedlePreview
                params={needleParams}
                value={value}
                centerX={centerX}
                centerY={centerY}
                scale={scale}
                width={width}
                height={height}
            />
        </Group>
    );
};

/**
 * Render composite LED Arc + Needle to an offscreen canvas
 */
export async function renderCompositeFrame(
    ledArcParams: LedArcParams,
    needleParams: NeedleParams,
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
            x: 0, y: 0, width, height, fill: ledArcParams.backgroundColor,
        }));
    }

    // Calculate scaling - gauge fills frame edge-to-edge
    // Account for encasing if enabled
    const rimWidth = encasingParams?.rim.enabled ? encasingParams.rim.width : 0;
    const sealWidth = encasingParams?.rubberSeal.enabled ? encasingParams.rubberSeal.width : 0;
    const totalEncasingWidth = rimWidth + sealWidth;

    const maxRadius = Math.max(
        ledArcParams.outerRadius,
        needleParams.needleLength,
        tickParams.enabled ? tickParams.radius : 0
    );
    const availableRadius = Math.min(width, height) / 2 - totalEncasingWidth;

    // Scale only applies to arc modes usually
    const scale = (ledArcParams.orientation === 'arc' || needleParams.orientation === 'arc')
        ? availableRadius / (maxRadius || 1)
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
        ledArcParams,
        needleParams,
        includeLeds: true,
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
 * Generate all frames for a composite LED Arc + Needle gauge
 */
export async function generateCompositeFrames(
    ledArcParams: LedArcParams,
    needleParams: NeedleParams,
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
        const frame = await renderCompositeFrame(
            ledArcParams, needleParams, value, width, height,
            useTransparentBackground,
            bg, ticks, labels, order, encasingParams
        );
        frames.push(frame);
        if (onProgress) onProgress((i + 1) / frameCount);
    }

    return frames;
}
