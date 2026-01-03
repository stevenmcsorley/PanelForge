/**
 * Encasing Renderer
 * Draws gauge encasing elements: rim, glass, screws, seals
 */

import { EncasingParams, RimParams, GlassParams, ScrewParams, SealParams } from '@/stores/foundryStore';

/**
 * Draw metallic rim/bezel
 */
export function drawRim(
    ctx: CanvasRenderingContext2D,
    params: RimParams,
    width: number,
    height: number
): void {
    if (!params.enabled) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius - params.width;

    ctx.save();

    // Outer shadow
    if (params.outerShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = params.outerShadowBlur;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }

    // Main rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
    ctx.closePath();

    if (params.metallic) {
        // Metallic gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, params.highlightColor);
        gradient.addColorStop(0.3, params.color);
        gradient.addColorStop(0.5, params.shadowColor);
        gradient.addColorStop(0.7, params.color);
        gradient.addColorStop(1, params.highlightColor);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = params.color;
    }

    ctx.fill();

    // Reset shadow for inner elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Bevel highlight (top-left)
    if (params.bevelWidth > 0) {
        const bevelRadius = outerRadius - params.bevelWidth / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, bevelRadius, Math.PI * 1.25, Math.PI * 1.75);
        ctx.strokeStyle = params.highlightColor;
        ctx.lineWidth = params.bevelWidth;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Bevel shadow (bottom-right)
        ctx.beginPath();
        ctx.arc(centerX, centerY, bevelRadius, Math.PI * 0.25, Math.PI * 0.75);
        ctx.strokeStyle = params.shadowColor;
        ctx.stroke();
    }

    // Inner shadow
    if (params.innerShadow) {
        const shadowGradient = ctx.createRadialGradient(
            centerX, centerY, innerRadius - 5,
            centerX, centerY, innerRadius + 5
        );
        shadowGradient.addColorStop(0, 'transparent');
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = shadowGradient;
        ctx.lineWidth = 10;
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draw rubber seal
 */
export function drawSeal(
    ctx: CanvasRenderingContext2D,
    params: SealParams,
    rimParams: RimParams,
    width: number,
    height: number
): void {
    if (!params.enabled) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const sealRadius = outerRadius - (rimParams.enabled ? rimParams.width : 0) - params.width / 2;

    ctx.save();

    ctx.beginPath();
    ctx.arc(centerX, centerY, sealRadius, 0, Math.PI * 2);
    ctx.strokeStyle = params.color;
    ctx.lineWidth = params.width;
    ctx.stroke();

    // Ribbed texture
    if (params.texture === 'ribbed') {
        const ribCount = Math.floor(2 * Math.PI * sealRadius / 4);
        for (let i = 0; i < ribCount; i++) {
            const angle = (i / ribCount) * Math.PI * 2;
            const x1 = centerX + Math.cos(angle) * (sealRadius - params.width / 2);
            const y1 = centerY + Math.sin(angle) * (sealRadius - params.width / 2);
            const x2 = centerX + Math.cos(angle) * (sealRadius + params.width / 2);
            const y2 = centerY + Math.sin(angle) * (sealRadius + params.width / 2);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    ctx.restore();
}

/**
 * Draw screws
 */
export function drawScrews(
    ctx: CanvasRenderingContext2D,
    params: ScrewParams,
    width: number,
    height: number
): void {
    if (!params.enabled) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - params.inset;

    const angles: number[] = [];
    for (let i = 0; i < params.count; i++) {
        angles.push((i / params.count) * Math.PI * 2 - Math.PI / 2);
    }

    ctx.save();

    angles.forEach((angle) => {
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const size = params.size;

        // Screw head
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);

        // Metallic gradient for screw head
        const gradient = ctx.createRadialGradient(
            x - size * 0.3, y - size * 0.3, 0,
            x, y, size
        );
        gradient.addColorStop(0, '#888');
        gradient.addColorStop(0.5, params.color);
        gradient.addColorStop(1, '#222');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Screw slot/pattern
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        switch (params.style) {
            case 'phillips':
                // Cross pattern
                ctx.beginPath();
                ctx.moveTo(x - size * 0.5, y);
                ctx.lineTo(x + size * 0.5, y);
                ctx.moveTo(x, y - size * 0.5);
                ctx.lineTo(x, y + size * 0.5);
                ctx.stroke();
                break;

            case 'slotted':
                // Single slot
                ctx.beginPath();
                ctx.moveTo(x - size * 0.6, y);
                ctx.lineTo(x + size * 0.6, y);
                ctx.stroke();
                break;

            case 'hex':
                // Hexagon
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    const hx = x + Math.cos(a) * size * 0.5;
                    const hy = y + Math.sin(a) * size * 0.5;
                    if (i === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.stroke();
                break;

            case 'torx':
                // Star pattern
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    const a2 = ((i + 0.5) / 6) * Math.PI * 2 - Math.PI / 2;
                    const ox = x + Math.cos(a1) * size * 0.5;
                    const oy = y + Math.sin(a1) * size * 0.5;
                    const ix = x + Math.cos(a2) * size * 0.25;
                    const iy = y + Math.sin(a2) * size * 0.25;
                    if (i === 0) ctx.moveTo(ox, oy);
                    else ctx.lineTo(ox, oy);
                    ctx.lineTo(ix, iy);
                }
                ctx.closePath();
                ctx.stroke();
                break;
        }
    });

    ctx.restore();
}

/**
 * Draw glass overlay with reflections
 */
export function drawGlass(
    ctx: CanvasRenderingContext2D,
    params: GlassParams,
    rimParams: RimParams,
    width: number,
    height: number
): void {
    if (!params.enabled) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const glassRadius = outerRadius - (rimParams.enabled ? rimParams.width : 0);

    ctx.save();

    // Glass tint
    if (params.tintOpacity > 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, glassRadius, 0, Math.PI * 2);
        ctx.fillStyle = params.tint;
        ctx.globalAlpha = params.tintOpacity;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Main reflection
    const refAngle = params.reflectionAngle * Math.PI / 180;
    const refX = centerX + Math.cos(refAngle) * glassRadius * 0.3;
    const refY = centerY + Math.sin(refAngle) * glassRadius * 0.3;
    const refWidth = glassRadius * params.reflectionWidth;

    // Curved reflection highlight
    const reflectionGradient = ctx.createRadialGradient(
        refX, refY, 0,
        refX, refY, refWidth
    );
    reflectionGradient.addColorStop(0, `rgba(255, 255, 255, ${params.reflectionIntensity})`);
    reflectionGradient.addColorStop(0.5, `rgba(255, 255, 255, ${params.reflectionIntensity * 0.3})`);
    reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, glassRadius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(0, 0, width, height);

    // Secondary smaller highlight
    const ref2X = centerX + Math.cos(refAngle + Math.PI) * glassRadius * 0.5;
    const ref2Y = centerY + Math.sin(refAngle + Math.PI) * glassRadius * 0.5;

    const ref2Gradient = ctx.createRadialGradient(
        ref2X, ref2Y, 0,
        ref2X, ref2Y, refWidth * 0.3
    );
    ref2Gradient.addColorStop(0, `rgba(255, 255, 255, ${params.reflectionIntensity * 0.5})`);
    ref2Gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = ref2Gradient;
    ctx.fillRect(0, 0, width, height);

    // Edge highlight (curvature effect)
    if (params.curvature > 0) {
        const edgeGradient = ctx.createRadialGradient(
            centerX, centerY, glassRadius * 0.7,
            centerX, centerY, glassRadius
        );
        edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        edgeGradient.addColorStop(0.8, `rgba(255, 255, 255, ${params.curvature * 0.1})`);
        edgeGradient.addColorStop(1, `rgba(0, 0, 0, ${params.curvature * 0.2})`);

        ctx.fillStyle = edgeGradient;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
}

/**
 * Draw all encasing elements
 */
export function drawEncasing(
    ctx: CanvasRenderingContext2D,
    params: EncasingParams,
    width: number,
    height: number
): void {
    // Draw in order: rim -> seal -> screws -> glass
    drawRim(ctx, params.rim, width, height);
    drawSeal(ctx, params.rubberSeal, params.rim, width, height);
    drawScrews(ctx, params.screws, width, height);
    drawGlass(ctx, params.glass, params.rim, width, height);
}

/**
 * Draw encasing using Konva (for live preview)
 */
export function drawEncasingKonva(
    Konva: any,
    params: EncasingParams,
    group: any,
    width: number,
    height: number
): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2;

    // Rim
    if (params.rim.enabled) {
        const innerRadius = outerRadius - params.rim.width;

        // Main rim ring
        const rim = new Konva.Ring({
            x: centerX,
            y: centerY,
            innerRadius: innerRadius,
            outerRadius: outerRadius,
            fill: params.rim.color,
            shadowColor: 'black',
            shadowBlur: params.rim.outerShadow ? params.rim.outerShadowBlur : 0,
            shadowOffset: { x: 2, y: 2 },
            shadowOpacity: 0.5,
        });
        group.add(rim);

        // Bevel highlights
        if (params.rim.bevelWidth > 0) {
            const bevelRadius = outerRadius - params.rim.bevelWidth / 2;

            // Top-left highlight
            const highlight = new Konva.Arc({
                x: centerX,
                y: centerY,
                innerRadius: bevelRadius - 1,
                outerRadius: bevelRadius + 1,
                angle: 90,
                rotation: 225,
                fill: params.rim.highlightColor,
                opacity: 0.6,
            });
            group.add(highlight);

            // Bottom-right shadow
            const shadow = new Konva.Arc({
                x: centerX,
                y: centerY,
                innerRadius: bevelRadius - 1,
                outerRadius: bevelRadius + 1,
                angle: 90,
                rotation: 45,
                fill: params.rim.shadowColor,
                opacity: 0.6,
            });
            group.add(shadow);
        }
    }

    // Rubber seal
    if (params.rubberSeal.enabled) {
        const sealRadius = outerRadius - (params.rim.enabled ? params.rim.width : 0) - params.rubberSeal.width / 2;
        const seal = new Konva.Ring({
            x: centerX,
            y: centerY,
            innerRadius: sealRadius - params.rubberSeal.width / 2,
            outerRadius: sealRadius + params.rubberSeal.width / 2,
            fill: params.rubberSeal.color,
        });
        group.add(seal);
    }

    // Screws
    if (params.screws.enabled) {
        const screwRadius = outerRadius - params.screws.inset;
        for (let i = 0; i < params.screws.count; i++) {
            const angle = (i / params.screws.count) * Math.PI * 2 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * screwRadius;
            const y = centerY + Math.sin(angle) * screwRadius;

            // Screw head
            const screw = new Konva.Circle({
                x: x,
                y: y,
                radius: params.screws.size,
                fill: params.screws.color,
                stroke: '#222',
                strokeWidth: 0.5,
            });
            group.add(screw);

            // Slot
            if (params.screws.style === 'phillips') {
                const hLine = new Konva.Line({
                    points: [x - params.screws.size * 0.5, y, x + params.screws.size * 0.5, y],
                    stroke: '#111',
                    strokeWidth: 1.5,
                });
                const vLine = new Konva.Line({
                    points: [x, y - params.screws.size * 0.5, x, y + params.screws.size * 0.5],
                    stroke: '#111',
                    strokeWidth: 1.5,
                });
                group.add(hLine);
                group.add(vLine);
            } else if (params.screws.style === 'slotted') {
                const slot = new Konva.Line({
                    points: [x - params.screws.size * 0.6, y, x + params.screws.size * 0.6, y],
                    stroke: '#111',
                    strokeWidth: 1.5,
                });
                group.add(slot);
            }
        }
    }

    // Glass overlay
    if (params.glass.enabled) {
        const glassRadius = outerRadius - (params.rim.enabled ? params.rim.width : 0);

        // Tint
        if (params.glass.tintOpacity > 0) {
            const tint = new Konva.Circle({
                x: centerX,
                y: centerY,
                radius: glassRadius,
                fill: params.glass.tint,
                opacity: params.glass.tintOpacity,
            });
            group.add(tint);
        }

        // Reflection highlight
        const refAngle = params.glass.reflectionAngle * Math.PI / 180;
        const refX = centerX + Math.cos(refAngle) * glassRadius * 0.3;
        const refY = centerY + Math.sin(refAngle) * glassRadius * 0.3;

        const reflection = new Konva.Circle({
            x: refX,
            y: refY,
            radius: glassRadius * params.glass.reflectionWidth,
            fillRadialGradientStartPoint: { x: 0, y: 0 },
            fillRadialGradientEndPoint: { x: 0, y: 0 },
            fillRadialGradientStartRadius: 0,
            fillRadialGradientEndRadius: glassRadius * params.glass.reflectionWidth,
            fillRadialGradientColorStops: [
                0, `rgba(255, 255, 255, ${params.glass.reflectionIntensity})`,
                0.5, `rgba(255, 255, 255, ${params.glass.reflectionIntensity * 0.3})`,
                1, 'rgba(255, 255, 255, 0)',
            ],
        });
        group.add(reflection);
    }
}
