/**
 * foundryRenderUtils
 * Shared Konva-based rendering logic for Gauge Foundry
 *
 * Used for offscreen frame generation (PNG sequences)
 */

import Konva from 'konva';
import { BackgroundParams, TickParams, LabelParams, LedArcParams, NeedleParams, ColorSplit, LayerType, EncasingParams } from '@/stores/foundryStore';
import { drawEncasing } from './encasingRenderer';
import { applyBulbShapeToArc, applyInsetShadowToArc, applyGlobalLedEffects } from './ledEffects';

/**
 * Get the on/off colors for a segment based on its index and color splits
 */
export function getSegmentColors(
    segmentIndex: number,
    segmentCount: number,
    baseOnColor: string,
    baseOffColor: string,
    colorSplits: ColorSplit[]
): { onColor: string; offColor: string } {
    if (colorSplits.length === 0) {
        return { onColor: baseOnColor, offColor: baseOffColor };
    }

    // Calculate segment percentage position (0-100)
    const segmentPercent = (segmentIndex / segmentCount) * 100;

    // Sort splits by threshold ascending
    const sortedSplits = [...colorSplits].sort((a, b) => a.threshold - b.threshold);

    // Find which split range this segment falls into
    // Segments before the first threshold use base colors
    // Segments at or after a threshold use that split's colors
    let onColor = baseOnColor;
    let offColor = baseOffColor;

    for (const split of sortedSplits) {
        if (segmentPercent >= split.threshold) {
            onColor = split.onColor;
            offColor = split.offColor;
        } else {
            break;
        }
    }

    return { onColor, offColor };
}

export async function drawBackgroundLayer(
    Konva: any,
    params: BackgroundParams,
    layer: Konva.Layer,
    width: number,
    height: number
): Promise<void> {
    if (!params.src) return Promise.resolve();
    return new Promise((resolve) => {
        const img = new window.Image();
        img.src = params.src;
        img.onload = () => {
            const kImg = new Konva.Image({
                image: img,
                x: params.x + width / 2,
                y: params.y + height / 2,
                width: img.width * params.scale,
                height: img.height * params.scale,
                offsetX: img.width / 2,
                offsetY: img.height / 2,
                opacity: params.opacity / 100,
            });
            layer.add(kImg);
            resolve();
        };
        img.onerror = () => resolve(); // Fail gracefully
    });
}

export function drawTicksLayer(
    Konva: any,
    params: TickParams,
    layer: Konva.Layer,
    centerX: number,
    centerY: number,
    scale: number,
    width: number,
    height: number
) {
    if (!params.enabled) return;

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

    if (mode === 'arc') {
        const totalAngle = endAngle - startAngle;
        for (let i = 0; i < majorCount; i++) {
            const angle = startAngle + (i / Math.max(1, majorCount - 1)) * totalAngle;
            const rad = (angle * Math.PI) / 180;
            const x1 = centerX + Math.cos(rad) * radius * scale;
            const y1 = centerY + Math.sin(rad) * radius * scale;
            const x2 = centerX + Math.cos(rad) * (radius - majorLength) * scale;
            const y2 = centerY + Math.sin(rad) * (radius - majorLength) * scale;

            layer.add(new Konva.Line({
                points: [x1, y1, x2, y2],
                stroke: color,
                strokeWidth: majorWidth * scale,
                opacity: opacity,
                lineCap: 'round'
            }));

            if (i < majorCount - 1 && minorSteps > 0) {
                for (let j = 1; j <= minorSteps; j++) {
                    const minorAngle = angle + (j / (minorSteps + 1)) * (totalAngle / Math.max(1, majorCount - 1));
                    const minorRad = (minorAngle * Math.PI) / 180;
                    const mx1 = centerX + Math.cos(minorRad) * radius * scale;
                    const my1 = centerY + Math.sin(minorRad) * radius * scale;
                    const mx2 = centerX + Math.cos(minorRad) * (radius - minorLength) * scale;
                    const my2 = centerY + Math.sin(minorRad) * (radius - minorLength) * scale;
                    layer.add(new Konva.Line({
                        points: [mx1, my1, mx2, my2],
                        stroke: color,
                        strokeWidth: minorWidth * scale,
                        opacity: opacity,
                        lineCap: 'round'
                    }));
                }
            }
        }
    } else if (mode === 'horizontal') {
        const startX = centerX - (width / 2) * 0.8;
        const totalWidth = width * 0.8;
        const y = centerY + offset * scale;

        for (let i = 0; i < majorCount; i++) {
            const x = startX + (i / Math.max(1, majorCount - 1)) * totalWidth;
            layer.add(new Konva.Line({
                points: [x, y, x, y - majorLength * scale],
                stroke: color,
                strokeWidth: majorWidth * scale,
                opacity: opacity,
                lineCap: 'round'
            }));

            if (i < majorCount - 1 && minorSteps > 0) {
                for (let j = 1; j <= minorSteps; j++) {
                    const mx = x + (j / (minorSteps + 1)) * (totalWidth / Math.max(1, majorCount - 1));
                    layer.add(new Konva.Line({
                        points: [mx, y, mx, y - minorLength * scale],
                        stroke: color,
                        strokeWidth: minorWidth * scale,
                        opacity: opacity,
                        lineCap: 'round'
                    }));
                }
            }
        }
    } else if (mode === 'vertical') {
        const startY = centerY - (height / 2) * 0.8;
        const totalHeight = height * 0.8;
        const x = centerX + offset * scale;

        for (let i = 0; i < majorCount; i++) {
            // Vertical: Bottom to Top (0 at bottom)
            const y = (startY + totalHeight) - (i / Math.max(1, majorCount - 1)) * totalHeight;
            layer.add(new Konva.Line({
                points: [x, y, x - majorLength * scale, y],
                stroke: color,
                strokeWidth: majorWidth * scale,
                opacity: opacity,
                lineCap: 'round'
            }));

            if (i < majorCount - 1 && minorSteps > 0) {
                for (let j = 1; j <= minorSteps; j++) {
                    const my = (startY + totalHeight) - (i / Math.max(1, majorCount - 1)) * totalHeight - (j / (minorSteps + 1)) * (totalHeight / Math.max(1, majorCount - 1));
                    layer.add(new Konva.Line({
                        points: [x, my, x - minorLength * scale, my],
                        stroke: color,
                        strokeWidth: minorWidth * scale,
                        opacity: opacity,
                        lineCap: 'round'
                    }));
                }
            }
        }
    }
}

export function drawLabelsLayer(
    Konva: any,
    params: LabelParams,
    tickParams: TickParams,
    layer: Konva.Layer,
    centerX: number,
    centerY: number,
    scale: number,
    width: number,
    height: number
) {
    if (!params.enabled) return;

    const {
        minValue,
        maxValue,
        step,
        fontSize,
        fontFamily,
        color,
        opacity,
        offset,
        upright,
        reversed,
        unit
    } = params;

    const count = Math.floor((maxValue - minValue) / Math.max(0.1, step)) + 1;

    if (tickParams.mode === 'arc') {
        const totalAngle = tickParams.endAngle - tickParams.startAngle;
        const radius = tickParams.radius + offset;

        for (let i = 0; i < count; i++) {
            const value = minValue + i * step;
            const angle = tickParams.startAngle + (i / Math.max(1, count - 1)) * totalAngle;
            const rad = (angle * Math.PI) / 180;
            const x = centerX + Math.cos(rad) * radius * scale;
            const y = centerY + Math.sin(rad) * radius * scale;
            const labelText = `${value}${unit}`;
            const textWidth = fontSize * labelText.length * 0.6;

            layer.add(new Konva.Text({
                text: labelText,
                x: x,
                y: y,
                width: textWidth * scale,
                fontSize: fontSize * scale,
                fontFamily: fontFamily,
                fontStyle: params.fontWeight,
                fill: color,
                opacity: opacity,
                align: 'center',
                offsetX: (textWidth * scale) / 2,
                offsetY: (fontSize * scale) / 2,
                rotation: upright ? 0 : angle + 90
            }));
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

            layer.add(new Konva.Text({
                text: labelText,
                x: x,
                y: y,
                width: textWidth * scale,
                fontSize: fontSize * scale,
                fontFamily: fontFamily,
                fontStyle: params.fontWeight,
                fill: color,
                opacity: opacity,
                align: 'center',
                offsetX: (textWidth * scale) / 2
            }));
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

            layer.add(new Konva.Text({
                text: labelText,
                x: x,
                y: y,
                width: textWidth * scale,
                fontSize: fontSize * scale,
                fontFamily: fontFamily,
                fontStyle: params.fontWeight,
                fill: color,
                opacity: opacity,
                offsetX: textWidth * scale,
                offsetY: (fontSize * scale) / 2
            }));
        }
    }
}

export function drawLedTemplate(
    Konva: any,
    params: LedArcParams,
    value: number, // 0-100
    group: Konva.Group | Konva.Layer,
    centerX: number,
    centerY: number,
    scale: number,
    width: number,
    height: number
) {
    const {
        orientation,
        segmentCount,
        segmentGap,
        innerRadius,
        outerRadius,
        offColor,
        onColor,
        glowStrength,
        arcStartAngle,
        arcEndAngle,
        colorSplits,
        effects
    } = params;

    // Normalize value from sensor range to 0-100 percentage
    const normalizedValue = ((value - params.minValue) / (params.maxValue - params.minValue)) * 100;
    const clampedValue = Math.max(0, Math.min(100, normalizedValue));

    const litSegments = Math.round((clampedValue / 100) * segmentCount);

    if (orientation === 'arc') {
        const totalArcAngle = arcEndAngle - arcStartAngle;
        const totalGapAngle = segmentGap * (segmentCount - 1);
        const segmentAngle = (totalArcAngle - totalGapAngle) / segmentCount;

        for (let i = 0; i < segmentCount; i++) {
            const segmentStartAngle = arcStartAngle + i * (segmentAngle + segmentGap);
            const isLit = i < litSegments;
            const { onColor: segOnColor, offColor: segOffColor } = getSegmentColors(
                i, segmentCount, onColor, offColor, colorSplits
            );

            group.add(new Konva.Arc({
                x: centerX,
                y: centerY,
                innerRadius: innerRadius * scale,
                outerRadius: outerRadius * scale,
                angle: segmentAngle,
                rotation: segmentStartAngle,
                fill: isLit ? segOnColor : segOffColor,
                opacity: effects.segmentOpacity,
                shadowColor: isLit ? segOnColor : 'transparent',
                shadowBlur: isLit ? glowStrength * scale : 0,
                shadowOpacity: isLit ? 0.8 : 0,
            }));
        }
    } else {
        const isHorizontal = orientation === 'horizontal';
        const totalSize = (isHorizontal ? width : height) * 0.8;
        const startPos = (isHorizontal ? centerX : centerY) - totalSize / 2;
        const otherPos = (isHorizontal ? centerY : centerX) + (params.innerRadius - 60) * scale;

        const thickness = (outerRadius - innerRadius) * scale;
        const totalGap = segmentGap * (segmentCount - 1) * scale;
        const segmentSize = (totalSize - totalGap) / segmentCount;

        for (let i = 0; i < segmentCount; i++) {
            const pos = startPos + i * (segmentSize + segmentGap * scale);
            const isLit = i < litSegments;
            const { onColor: segOnColor, offColor: segOffColor } = getSegmentColors(
                i, segmentCount, onColor, offColor, colorSplits
            );

            const rectParams: any = {
                fill: isLit ? segOnColor : segOffColor,
                opacity: effects.segmentOpacity,
                shadowColor: isLit ? segOnColor : 'transparent',
                shadowBlur: isLit ? glowStrength * scale : 0,
                shadowOpacity: isLit ? 0.8 : 0,
                cornerRadius: 2 * scale
            };

            if (isHorizontal) {
                rectParams.x = pos;
                rectParams.y = otherPos - thickness / 2;
                rectParams.width = segmentSize;
                rectParams.height = thickness;
            } else {
                // Vertical from bottom to top
                rectParams.x = otherPos - thickness / 2;
                rectParams.y = startPos + (totalSize - pos - segmentSize);
                rectParams.width = thickness;
                rectParams.height = segmentSize;
            }

            group.add(new Konva.Rect(rectParams));
        }
    }
}

export function drawNeedleTemplate(
    Konva: any,
    params: NeedleParams,
    value: number, // 0-100
    group: Konva.Group | Konva.Layer,
    centerX: number,
    centerY: number,
    scale: number,
    width: number,
    height: number
) {
    const {
        orientation,
        needleLength,
        needleWidth,
        needleColor,
        hubRadius,
        hubColor,
        shadowOpacity,
        minAngle,
        maxAngle
    } = params;

    if (orientation === 'arc') {
        const angle = minAngle + (value / 100) * (maxAngle - minAngle);

        // Shadow/Glow
        group.add(new Konva.Line({
            points: [centerX, centerY, centerX + Math.cos(angle * Math.PI / 180) * needleLength * scale, centerY + Math.sin(angle * Math.PI / 180) * needleLength * scale],
            stroke: 'black',
            strokeWidth: needleWidth * scale,
            opacity: shadowOpacity,
            lineCap: 'round',
            offsetX: -2 * scale,
            offsetY: -2 * scale
        }));

        // Needle body
        group.add(new Konva.Line({
            points: [centerX, centerY, centerX + Math.cos(angle * Math.PI / 180) * needleLength * scale, centerY + Math.sin(angle * Math.PI / 180) * needleLength * scale],
            stroke: needleColor,
            strokeWidth: needleWidth * scale,
            lineCap: 'round',
        }));

        // Hub
        group.add(new Konva.Circle({
            x: centerX,
            y: centerY,
            radius: hubRadius * scale,
            fill: hubColor,
            stroke: '#111',
            strokeWidth: 1 * scale,
            shadowColor: 'black',
            shadowBlur: 5 * scale,
            shadowOpacity: 0.5
        }));
    } else {
        const isHorizontal = orientation === 'horizontal';
        const totalSize = (isHorizontal ? width : height) * 0.8;
        const startPos = (isHorizontal ? centerX : centerY) - totalSize / 2;
        const otherPos = (isHorizontal ? centerY : centerX);

        const pos = startPos + (value / 100) * totalSize;

        // Linear needle is often a triangle or a bar
        const points = [];
        const nLen = needleLength * scale;
        const nWid = needleWidth * scale;

        if (isHorizontal) {
            // A vertical needle moving horizontally
            points.push(pos, otherPos - nLen / 2);
            points.push(pos, otherPos + nLen / 2);
        } else {
            // A horizontal needle moving vertically
            const vPos = startPos + (totalSize - (value / 100) * totalSize);
            points.push(otherPos - nLen / 2, vPos);
            points.push(otherPos + nLen / 2, vPos);
        }

        group.add(new Konva.Line({
            points: points,
            stroke: needleColor,
            strokeWidth: nWid,
            lineCap: 'round',
            shadowColor: 'black',
            shadowBlur: 3 * scale,
            shadowOpacity: shadowOpacity
        }));
    }
}

/**
 * Draw layers in the specified order
 */
export interface DrawLayersOptions {
    Konva: any;
    layer: Konva.Layer;
    layerOrder: LayerType[];
    value: number;
    centerX: number;
    centerY: number;
    scale: number;
    width: number;
    height: number;
    backgroundParams: BackgroundParams;
    tickParams: TickParams;
    labelParams: LabelParams;
    ledArcParams?: LedArcParams;
    needleParams?: NeedleParams;
    includeLeds?: boolean;
    includeNeedle?: boolean;
}

export async function drawLayersInOrder(options: DrawLayersOptions): Promise<void> {
    const {
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
        includeLeds = true,
        includeNeedle = true,
    } = options;

    for (const layerType of layerOrder) {
        switch (layerType) {
            case 'background':
                await drawBackgroundLayer(Konva, backgroundParams, layer, width, height);
                break;
            case 'ticks':
                drawTicksLayer(Konva, tickParams, layer, centerX, centerY, scale, width, height);
                break;
            case 'labels':
                drawLabelsLayer(Konva, labelParams, tickParams, layer, centerX, centerY, scale, width, height);
                break;
            case 'leds':
                if (includeLeds && ledArcParams) {
                    drawLedTemplate(Konva, ledArcParams, value, layer, centerX, centerY, scale, width, height);
                }
                break;
            case 'needle':
                if (includeNeedle && needleParams) {
                    drawNeedleTemplate(Konva, needleParams, value, layer, centerX, centerY, scale, width, height);
                }
                break;
        }
    }
}

/**
 * Apply encasing to a rendered canvas
 */
export function applyEncasingToCanvas(
    stage: Konva.Stage,
    encasingParams: EncasingParams,
    width: number,
    height: number
): string {
    // Get the current stage as an image
    const stageDataUrl = stage.toDataURL({ pixelRatio: 1 });

    // Create a new canvas to composite encasing
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Draw the stage content first
    const img = new Image();
    img.src = stageDataUrl;

    // Since we need to wait for image load, we'll do this synchronously with a workaround
    // Actually, stage.toCanvas() gives us direct access
    const stageCanvas = stage.toCanvas({ pixelRatio: 1 });
    ctx.drawImage(stageCanvas, 0, 0);

    // Draw encasing on top
    drawEncasing(ctx, encasingParams, width, height);

    return canvas.toDataURL('image/png');
}
