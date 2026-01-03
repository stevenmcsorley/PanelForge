/**
 * LED Effects - Canvas 2D procedural effects for LED segments
 *
 * Provides texture overlays and blending effects:
 * - Dust/scratches (grunge/worn look)
 * - Bulb shape (3D rounded appearance)
 * - Glass overlay (reflections/highlights)
 * - Inset shadow (embedded/recessed look)
 */

import { LedEffectsParams } from '@/stores/foundryStore';

// Seeded random number generator for consistent patterns
function seededRandom(seed: number): () => number {
    return function () {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
}

/**
 * Apply dust/scratch texture overlay
 * Creates a worn, grunge effect
 */
export function applyDustTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    seed: number
): void {
    if (intensity <= 0) return;

    const random = seededRandom(seed);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Add random noise/dust particles
    const particleCount = Math.floor(width * height * intensity * 0.02);
    for (let i = 0; i < particleCount; i++) {
        const x = Math.floor(random() * width);
        const y = Math.floor(random() * height);
        const idx = (y * width + x) * 4;

        // Dark dust particles
        const darkness = random() * 0.3 * intensity;
        data[idx] = Math.max(0, data[idx] * (1 - darkness));
        data[idx + 1] = Math.max(0, data[idx + 1] * (1 - darkness));
        data[idx + 2] = Math.max(0, data[idx + 2] * (1 - darkness));
    }

    // Add some scratch lines
    const scratchCount = Math.floor(intensity * 5);
    for (let i = 0; i < scratchCount; i++) {
        const x1 = Math.floor(random() * width);
        const y1 = Math.floor(random() * height);
        const length = Math.floor(random() * 20 + 5);
        const angle = random() * Math.PI;

        for (let j = 0; j < length; j++) {
            const x = Math.floor(x1 + Math.cos(angle) * j);
            const y = Math.floor(y1 + Math.sin(angle) * j);
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const idx = (y * width + x) * 4;
                const fade = 1 - j / length;
                data[idx] = Math.max(0, data[idx] - 30 * intensity * fade);
                data[idx + 1] = Math.max(0, data[idx + 1] - 30 * intensity * fade);
                data[idx + 2] = Math.max(0, data[idx + 2] - 30 * intensity * fade);
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply bulb shape effect (3D rounded look)
 * Creates highlight at top and shadow at bottom of each segment
 */
export function applyBulbShape(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    intensity: number
): void {
    if (intensity <= 0) return;

    // Create radial gradient for 3D bulb effect
    const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius
    );

    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 * intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.1 * intensity})`);
    gradient.addColorStop(0.8, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.3 * intensity})`);

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

/**
 * Apply bulb shape to arc segment
 */
export function applyBulbShapeToArc(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    intensity: number
): void {
    if (intensity <= 0) return;

    const midRadius = (innerRadius + outerRadius) / 2;
    const midAngle = (startAngle + endAngle) / 2;

    // Calculate segment center
    const segCenterX = centerX + Math.cos(midAngle * Math.PI / 180) * midRadius;
    const segCenterY = centerY + Math.sin(midAngle * Math.PI / 180) * midRadius;
    const segRadius = (outerRadius - innerRadius) / 2;

    // Create highlight gradient offset toward light source
    const lightAngle = -45 * Math.PI / 180; // Light from top-left
    const highlightOffsetX = Math.cos(lightAngle) * segRadius * 0.3;
    const highlightOffsetY = Math.sin(lightAngle) * segRadius * 0.3;

    const gradient = ctx.createRadialGradient(
        segCenterX + highlightOffsetX,
        segCenterY + highlightOffsetY,
        0,
        segCenterX,
        segCenterY,
        segRadius * 1.5
    );

    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * intensity})`);
    gradient.addColorStop(0.4, `rgba(255, 255, 255, ${0.15 * intensity})`);
    gradient.addColorStop(0.7, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.25 * intensity})`);

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = gradient;

    // Draw arc segment path
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle * Math.PI / 180, endAngle * Math.PI / 180);
    ctx.arc(centerX, centerY, innerRadius, endAngle * Math.PI / 180, startAngle * Math.PI / 180, true);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

/**
 * Apply glass overlay effect
 * Creates curved reflection highlight
 */
export function applyGlassOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    angle: number
): void {
    if (intensity <= 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;

    // Calculate reflection position based on angle
    const radAngle = angle * Math.PI / 180;
    const reflectX = centerX + Math.cos(radAngle) * radius * 0.3;
    const reflectY = centerY + Math.sin(radAngle) * radius * 0.3;

    // Create curved reflection highlight
    const gradient = ctx.createRadialGradient(
        reflectX, reflectY, 0,
        reflectX, reflectY, radius * 0.8
    );

    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 * intensity})`);
    gradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.15 * intensity})`);
    gradient.addColorStop(0.6, `rgba(255, 255, 255, 0)`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

/**
 * Apply inset shadow effect
 * Makes segments look embedded/recessed
 */
export function applyInsetShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    color: string
): void {
    if (depth <= 0) return;

    ctx.save();

    // Parse shadow color
    const shadowColor = color || '#000000';

    // Top shadow
    const topGradient = ctx.createLinearGradient(x, y, x, y + depth);
    topGradient.addColorStop(0, shadowColor);
    topGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = topGradient;
    ctx.fillRect(x, y, width, depth);

    // Left shadow
    const leftGradient = ctx.createLinearGradient(x, y, x + depth, y);
    leftGradient.addColorStop(0, shadowColor);
    leftGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = leftGradient;
    ctx.fillRect(x, y, depth, height);

    // Bottom highlight (subtle)
    const bottomGradient = ctx.createLinearGradient(x, y + height - depth, x, y + height);
    bottomGradient.addColorStop(0, 'transparent');
    bottomGradient.addColorStop(1, `rgba(255, 255, 255, 0.1)`);
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(x, y + height - depth, width, depth);

    // Right highlight (subtle)
    const rightGradient = ctx.createLinearGradient(x + width - depth, y, x + width, y);
    rightGradient.addColorStop(0, 'transparent');
    rightGradient.addColorStop(1, `rgba(255, 255, 255, 0.1)`);
    ctx.fillStyle = rightGradient;
    ctx.fillRect(x + width - depth, y, depth, height);

    ctx.restore();
}

/**
 * Apply inset shadow to arc segment
 */
export function applyInsetShadowToArc(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    depth: number,
    color: string
): void {
    if (depth <= 0) return;

    ctx.save();

    // Create shadow at outer edge (top of segment)
    const shadowGradient = ctx.createRadialGradient(
        centerX, centerY, outerRadius - depth,
        centerX, centerY, outerRadius
    );
    shadowGradient.addColorStop(0, 'transparent');
    shadowGradient.addColorStop(1, color);

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = shadowGradient;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle * Math.PI / 180, endAngle * Math.PI / 180);
    ctx.arc(centerX, centerY, innerRadius, endAngle * Math.PI / 180, startAngle * Math.PI / 180, true);
    ctx.closePath();
    ctx.fill();

    // Create highlight at inner edge (bottom of segment)
    const highlightGradient = ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, innerRadius + depth
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    highlightGradient.addColorStop(1, 'transparent');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = highlightGradient;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle * Math.PI / 180, endAngle * Math.PI / 180);
    ctx.arc(centerX, centerY, innerRadius, endAngle * Math.PI / 180, startAngle * Math.PI / 180, true);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

/**
 * Apply all enabled effects to a segment
 */
export function applySegmentEffects(
    ctx: CanvasRenderingContext2D,
    effects: LedEffectsParams,
    isArc: boolean,
    geometry: {
        centerX?: number;
        centerY?: number;
        innerRadius?: number;
        outerRadius?: number;
        startAngle?: number;
        endAngle?: number;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }
): void {
    if (isArc && geometry.centerX !== undefined) {
        // Arc segment effects
        if (effects.bulbShapeEnabled) {
            applyBulbShapeToArc(
                ctx,
                geometry.centerX!,
                geometry.centerY!,
                geometry.innerRadius!,
                geometry.outerRadius!,
                geometry.startAngle!,
                geometry.endAngle!,
                effects.bulbIntensity
            );
        }

        if (effects.insetShadowEnabled) {
            applyInsetShadowToArc(
                ctx,
                geometry.centerX!,
                geometry.centerY!,
                geometry.innerRadius!,
                geometry.outerRadius!,
                geometry.startAngle!,
                geometry.endAngle!,
                effects.insetShadowDepth,
                effects.insetShadowColor
            );
        }
    } else if (geometry.x !== undefined) {
        // Rectangular segment effects
        const cx = geometry.x! + geometry.width! / 2;
        const cy = geometry.y! + geometry.height! / 2;
        const radius = Math.min(geometry.width!, geometry.height!) / 2;

        if (effects.bulbShapeEnabled) {
            applyBulbShape(ctx, cx, cy, radius, effects.bulbIntensity);
        }

        if (effects.insetShadowEnabled) {
            applyInsetShadow(
                ctx,
                geometry.x!,
                geometry.y!,
                geometry.width!,
                geometry.height!,
                effects.insetShadowDepth,
                effects.insetShadowColor
            );
        }
    }
}

/**
 * Apply global effects (dust, glass) to entire LED layer
 */
export function applyGlobalLedEffects(
    ctx: CanvasRenderingContext2D,
    effects: LedEffectsParams,
    width: number,
    height: number
): void {
    if (effects.dustEnabled) {
        applyDustTexture(ctx, width, height, effects.dustIntensity, effects.dustSeed);
    }

    if (effects.glassOverlayEnabled) {
        applyGlassOverlay(ctx, width, height, effects.glassIntensity, effects.glassAngle);
    }
}
