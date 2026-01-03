/**
 * GaugePreviewCanvas
 * Canvas-based live preview that shows all effects including LED effects and encasing
 * Uses the same rendering pipeline as frame generation for accurate preview
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
    LedArcParams,
    NeedleParams,
    BackgroundParams,
    TickParams,
    LabelParams,
    LayerType,
    EncasingParams,
    FoundryTemplate,
} from '@/stores/foundryStore';
import { drawEncasing } from './encasingRenderer';
import { applyGlobalLedEffects, applyBulbShapeToArc, applyInsetShadowToArc } from './ledEffects';
import { getSegmentColors } from './foundryRenderUtils';

interface GaugePreviewCanvasProps {
    template: FoundryTemplate;
    value: number;
    width: number;
    height: number;
    ledArcParams: LedArcParams;
    needleParams: NeedleParams;
    backgroundParams: BackgroundParams;
    tickParams: TickParams;
    labelParams: LabelParams;
    layerOrder: LayerType[];
    encasingParams: EncasingParams;
    useTransparentBackground: boolean;
}

export const GaugePreviewCanvas: React.FC<GaugePreviewCanvasProps> = ({
    template,
    value,
    width,
    height,
    ledArcParams,
    needleParams,
    backgroundParams,
    tickParams,
    labelParams,
    layerOrder,
    encasingParams,
    useTransparentBackground,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);

    // Load background image
    useEffect(() => {
        if (backgroundParams.src) {
            const img = new Image();
            img.onload = () => {
                bgImageRef.current = img;
            };
            img.src = backgroundParams.src;
        } else {
            bgImageRef.current = null;
        }
    }, [backgroundParams.src]);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background color
        const activeBgColor = template === 'needle'
            ? needleParams.backgroundColor
            : ledArcParams.backgroundColor;

        if (!useTransparentBackground) {
            ctx.fillStyle = activeBgColor;
            ctx.fillRect(0, 0, width, height);
        }

        // Calculate scale - gauge should fill the frame edge-to-edge
        // Account for encasing rim width if enabled
        const rimWidth = encasingParams.rim.enabled ? encasingParams.rim.width : 0;
        const sealWidth = encasingParams.rubberSeal.enabled ? encasingParams.rubberSeal.width : 0;
        const totalEncasingWidth = rimWidth + sealWidth;

        const maxRadius = Math.max(
            template !== 'needle' ? ledArcParams.outerRadius : 0,
            template !== 'led_arc' ? needleParams.needleLength : 0,
            tickParams.enabled ? tickParams.radius : 0
        );

        // Scale so that gauge + encasing fills the frame exactly
        const availableRadius = Math.min(width, height) / 2 - totalEncasingWidth;
        const scale = availableRadius / (maxRadius || 1);

        const centerX = width / 2;
        const centerY = height / 2;

        // Draw layers in order
        for (const layerType of layerOrder) {
            switch (layerType) {
                case 'background':
                    drawBackground(ctx, backgroundParams, bgImageRef.current, width, height);
                    break;
                case 'ticks':
                    drawTicks(ctx, tickParams, centerX, centerY, scale, width, height);
                    break;
                case 'labels':
                    drawLabels(ctx, labelParams, tickParams, centerX, centerY, scale, width, height);
                    break;
                case 'leds':
                    if (template !== 'needle') {
                        drawLeds(ctx, ledArcParams, value, centerX, centerY, scale, width, height);
                    }
                    break;
                case 'needle':
                    if (template !== 'led_arc') {
                        drawNeedle(ctx, needleParams, value, centerX, centerY, scale, width, height);
                    }
                    break;
            }
        }

        // Draw encasing on top
        drawEncasing(ctx, encasingParams, width, height);

    }, [
        template, value, width, height,
        ledArcParams, needleParams, backgroundParams,
        tickParams, labelParams, layerOrder, encasingParams,
        useTransparentBackground
    ]);

    useEffect(() => {
        render();
    }, [render]);

    // Re-render when background image loads
    useEffect(() => {
        const checkImage = setInterval(() => {
            if (bgImageRef.current?.complete) {
                render();
                clearInterval(checkImage);
            }
        }, 100);
        return () => clearInterval(checkImage);
    }, [backgroundParams.src, render]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
            }}
        />
    );
};

// Helper drawing functions

function drawBackground(
    ctx: CanvasRenderingContext2D,
    params: BackgroundParams,
    img: HTMLImageElement | null,
    width: number,
    height: number
) {
    if (!img || !params.src) return;

    ctx.save();
    ctx.globalAlpha = params.opacity / 100;

    const scaledWidth = img.width * params.scale;
    const scaledHeight = img.height * params.scale;
    const x = params.x + width / 2 - scaledWidth / 2;
    const y = params.y + height / 2 - scaledHeight / 2;

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    ctx.restore();
}

function drawTicks(
    ctx: CanvasRenderingContext2D,
    params: TickParams,
    centerX: number,
    centerY: number,
    scale: number,
    width: number,
    height: number
) {
    if (!params.enabled) return;

    ctx.save();
    ctx.strokeStyle = params.color;
    ctx.globalAlpha = params.opacity;
    ctx.lineCap = 'round';

    if (params.mode === 'arc') {
        const totalAngle = params.endAngle - params.startAngle;
        for (let i = 0; i < params.majorCount; i++) {
            const angle = params.startAngle + (i / Math.max(1, params.majorCount - 1)) * totalAngle;
            const rad = (angle * Math.PI) / 180;

            // Major tick
            ctx.lineWidth = params.majorWidth * scale;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(rad) * params.radius * scale,
                centerY + Math.sin(rad) * params.radius * scale
            );
            ctx.lineTo(
                centerX + Math.cos(rad) * (params.radius - params.majorLength) * scale,
                centerY + Math.sin(rad) * (params.radius - params.majorLength) * scale
            );
            ctx.stroke();

            // Minor ticks
            if (i < params.majorCount - 1 && params.minorSteps > 0) {
                ctx.lineWidth = params.minorWidth * scale;
                for (let j = 1; j <= params.minorSteps; j++) {
                    const minorAngle = angle + (j / (params.minorSteps + 1)) * (totalAngle / Math.max(1, params.majorCount - 1));
                    const minorRad = (minorAngle * Math.PI) / 180;
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + Math.cos(minorRad) * params.radius * scale,
                        centerY + Math.sin(minorRad) * params.radius * scale
                    );
                    ctx.lineTo(
                        centerX + Math.cos(minorRad) * (params.radius - params.minorLength) * scale,
                        centerY + Math.sin(minorRad) * (params.radius - params.minorLength) * scale
                    );
                    ctx.stroke();
                }
            }
        }
    } else if (params.mode === 'horizontal') {
        const startX = centerX - (width / 2) * 0.8;
        const totalWidth = width * 0.8;
        const y = centerY + params.offset * scale;

        for (let i = 0; i < params.majorCount; i++) {
            const x = startX + (i / Math.max(1, params.majorCount - 1)) * totalWidth;
            ctx.lineWidth = params.majorWidth * scale;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - params.majorLength * scale);
            ctx.stroke();

            if (i < params.majorCount - 1 && params.minorSteps > 0) {
                ctx.lineWidth = params.minorWidth * scale;
                for (let j = 1; j <= params.minorSteps; j++) {
                    const mx = x + (j / (params.minorSteps + 1)) * (totalWidth / Math.max(1, params.majorCount - 1));
                    ctx.beginPath();
                    ctx.moveTo(mx, y);
                    ctx.lineTo(mx, y - params.minorLength * scale);
                    ctx.stroke();
                }
            }
        }
    } else if (params.mode === 'vertical') {
        const startY = centerY - (height / 2) * 0.8;
        const totalHeight = height * 0.8;
        const x = centerX + params.offset * scale;

        for (let i = 0; i < params.majorCount; i++) {
            const y = (startY + totalHeight) - (i / Math.max(1, params.majorCount - 1)) * totalHeight;
            ctx.lineWidth = params.majorWidth * scale;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - params.majorLength * scale, y);
            ctx.stroke();

            if (i < params.majorCount - 1 && params.minorSteps > 0) {
                ctx.lineWidth = params.minorWidth * scale;
                for (let j = 1; j <= params.minorSteps; j++) {
                    const my = y - (j / (params.minorSteps + 1)) * (totalHeight / Math.max(1, params.majorCount - 1));
                    ctx.beginPath();
                    ctx.moveTo(x, my);
                    ctx.lineTo(x - params.minorLength * scale, my);
                    ctx.stroke();
                }
            }
        }
    }

    ctx.restore();
}

function drawLabels(
    ctx: CanvasRenderingContext2D,
    params: LabelParams,
    tickParams: TickParams,
    centerX: number,
    centerY: number,
    scale: number,
    width: number,
    height: number
) {
    if (!params.enabled) return;

    ctx.save();
    ctx.fillStyle = params.color;
    ctx.globalAlpha = params.opacity;
    ctx.font = `${params.fontStyle} ${params.fontWeight} ${params.fontSize * scale}px ${params.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const count = Math.floor((params.maxValue - params.minValue) / Math.max(0.1, params.step)) + 1;

    if (tickParams.mode === 'arc') {
        const totalAngle = tickParams.endAngle - tickParams.startAngle;
        const radius = tickParams.radius + params.offset;

        for (let i = 0; i < count; i++) {
            const value = params.minValue + i * params.step;
            const angle = tickParams.startAngle + (i / Math.max(1, count - 1)) * totalAngle;
            const rad = (angle * Math.PI) / 180;
            const x = centerX + Math.cos(rad) * radius * scale;
            const y = centerY + Math.sin(rad) * radius * scale;
            const labelText = `${value}${params.unit}`;

            ctx.save();
            ctx.translate(x, y);
            if (!params.upright) {
                ctx.rotate((angle + 90) * Math.PI / 180);
            }
            ctx.fillText(labelText, 0, 0);
            ctx.restore();
        }
    } else if (tickParams.mode === 'horizontal') {
        const startX = centerX - (width / 2) * 0.8;
        const totalWidth = width * 0.8;
        const y = centerY + tickParams.offset * scale + params.offset * scale;

        for (let i = 0; i < count; i++) {
            const value = params.minValue + i * params.step;
            const t = params.reversed ? (1 - i / Math.max(1, count - 1)) : (i / Math.max(1, count - 1));
            const x = startX + t * totalWidth;
            ctx.fillText(`${value}${params.unit}`, x, y);
        }
    } else if (tickParams.mode === 'vertical') {
        const startY = centerY - (height / 2) * 0.8;
        const totalHeight = height * 0.8;
        const x = centerX + tickParams.offset * scale + params.offset * scale;

        ctx.textAlign = 'right';
        for (let i = 0; i < count; i++) {
            const value = params.minValue + i * params.step;
            const t = params.reversed ? (i / Math.max(1, count - 1)) : (1 - i / Math.max(1, count - 1));
            const y = startY + t * totalHeight;
            ctx.fillText(`${value}${params.unit}`, x, y);
        }
    }

    ctx.restore();
}

function drawLeds(
    ctx: CanvasRenderingContext2D,
    params: LedArcParams,
    value: number,
    centerX: number,
    centerY: number,
    scale: number,
    width: number,
    height: number
) {
    const litSegments = Math.round((value / 100) * params.segmentCount);
    const effects = params.effects;

    ctx.save();
    ctx.globalAlpha = effects.segmentOpacity;

    if (params.orientation === 'arc') {
        const totalArcAngle = params.arcEndAngle - params.arcStartAngle;
        const totalGapAngle = params.segmentGap * (params.segmentCount - 1);
        const segmentAngle = (totalArcAngle - totalGapAngle) / params.segmentCount;

        for (let i = 0; i < params.segmentCount; i++) {
            const segmentStartAngle = params.arcStartAngle + i * (segmentAngle + params.segmentGap);
            const segmentEndAngle = segmentStartAngle + segmentAngle;
            const isLit = i < litSegments;
            const { onColor, offColor } = getSegmentColors(
                i, params.segmentCount, params.onColor, params.offColor, params.colorSplits
            );
            const color = isLit ? onColor : offColor;

            // Draw arc segment
            ctx.beginPath();
            ctx.arc(centerX, centerY, params.outerRadius * scale, segmentStartAngle * Math.PI / 180, segmentEndAngle * Math.PI / 180);
            ctx.arc(centerX, centerY, params.innerRadius * scale, segmentEndAngle * Math.PI / 180, segmentStartAngle * Math.PI / 180, true);
            ctx.closePath();
            ctx.fillStyle = color;

            // Glow effect for lit segments
            if (isLit && params.glowStrength > 0) {
                ctx.shadowColor = color;
                ctx.shadowBlur = params.glowStrength * scale;
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fill();
            ctx.shadowBlur = 0;

            // Apply LED effects to segment
            if (effects.bulbShapeEnabled) {
                applyBulbShapeToArc(
                    ctx, centerX, centerY,
                    params.innerRadius * scale,
                    params.outerRadius * scale,
                    segmentStartAngle, segmentEndAngle,
                    effects.bulbIntensity
                );
            }

            if (effects.insetShadowEnabled) {
                applyInsetShadowToArc(
                    ctx, centerX, centerY,
                    params.innerRadius * scale,
                    params.outerRadius * scale,
                    segmentStartAngle, segmentEndAngle,
                    effects.insetShadowDepth * scale,
                    effects.insetShadowColor
                );
            }
        }
    } else {
        // Horizontal/Vertical LED bars
        const isHorizontal = params.orientation === 'horizontal';
        const totalSize = (isHorizontal ? width : height) * 0.8;
        const startPos = (isHorizontal ? centerX : centerY) - totalSize / 2;
        const otherPos = (isHorizontal ? centerY : centerX) + (params.innerRadius - 60) * scale;

        const thickness = (params.outerRadius - params.innerRadius) * scale;
        const totalGap = params.segmentGap * (params.segmentCount - 1) * scale;
        const segmentSize = (totalSize - totalGap) / params.segmentCount;

        for (let i = 0; i < params.segmentCount; i++) {
            const pos = startPos + i * (segmentSize + params.segmentGap * scale);
            const isLit = i < litSegments;
            const { onColor, offColor } = getSegmentColors(
                i, params.segmentCount, params.onColor, params.offColor, params.colorSplits
            );
            const color = isLit ? onColor : offColor;

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

            ctx.fillStyle = color;
            if (isLit && params.glowStrength > 0) {
                ctx.shadowColor = color;
                ctx.shadowBlur = params.glowStrength * scale;
            } else {
                ctx.shadowBlur = 0;
            }

            // Draw rounded rect
            const radius = 2 * scale;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, radius);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    ctx.restore();

    // Apply global LED effects
    applyGlobalLedEffects(ctx, effects, width, height);
}

function drawNeedle(
    ctx: CanvasRenderingContext2D,
    params: NeedleParams,
    value: number,
    centerX: number,
    centerY: number,
    scale: number,
    width: number,
    height: number
) {
    ctx.save();

    if (params.orientation === 'arc') {
        const angle = params.minAngle + (value / 100) * (params.maxAngle - params.minAngle);
        const angleRad = (angle * Math.PI) / 180;

        const tipX = centerX + Math.cos(angleRad) * params.needleLength * scale;
        const tipY = centerY + Math.sin(angleRad) * params.needleLength * scale;

        // Shadow
        if (params.shadowOpacity > 0) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = params.needleWidth * scale;
            ctx.lineCap = 'round';
            ctx.globalAlpha = params.shadowOpacity;
            ctx.beginPath();
            ctx.moveTo(centerX + 2 * scale, centerY + 2 * scale);
            ctx.lineTo(tipX + 2 * scale, tipY + 2 * scale);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Needle
        ctx.strokeStyle = params.needleColor;
        ctx.lineWidth = params.needleWidth * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Hub
        ctx.beginPath();
        ctx.arc(centerX, centerY, params.hubRadius * scale, 0, Math.PI * 2);
        ctx.fillStyle = params.hubColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5 * scale;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
    } else {
        // Linear needle
        const isHorizontal = params.orientation === 'horizontal';
        const totalSize = (isHorizontal ? width : height) * 0.8;
        const startPos = (isHorizontal ? centerX : centerY) - totalSize / 2;
        const otherPos = (isHorizontal ? centerY : centerX);

        const nLen = params.needleLength * scale;
        const nWid = params.needleWidth * scale;

        ctx.strokeStyle = params.needleColor;
        ctx.lineWidth = nWid;
        ctx.lineCap = 'round';
        ctx.shadowColor = `rgba(0, 0, 0, ${params.shadowOpacity})`;
        ctx.shadowBlur = 3 * scale;

        ctx.beginPath();
        if (isHorizontal) {
            const pos = startPos + (value / 100) * totalSize;
            ctx.moveTo(pos, otherPos - nLen / 2);
            ctx.lineTo(pos, otherPos + nLen / 2);
        } else {
            const vPos = startPos + (totalSize - (value / 100) * totalSize);
            ctx.moveTo(otherPos - nLen / 2, vPos);
            ctx.lineTo(otherPos + nLen / 2, vPos);
        }
        ctx.stroke();
    }

    ctx.restore();
}
