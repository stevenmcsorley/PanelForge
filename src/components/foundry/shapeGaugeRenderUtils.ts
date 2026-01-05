/**
 * Shape Gauge Rendering Utilities
 * Canvas 2D rendering functions for animated shape gauges
 * - Bars (horizontal, vertical)
 * - Circles, Donuts
 * - Semi-circles, Quarter-circles
 * - Custom arcs
 *
 * Pro features:
 * - Multi-stop gradients (linear, radial, sweep)
 * - Glow effects
 * - Glossy/metallic finishes
 * - Color zones based on value
 */

import {
    ShapeParams,
    ShapeType,
    GradientParams,
    GlowParams,
    ColorZone,
    ScaleParams,
    ValueLabelParams,
} from '@/stores/shapeGaugeFoundryStore';

// ============================================================================
// Helper Functions
// ============================================================================

function degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function getColorForValue(value: number, colorZones: ColorZone[], defaultColor: string): string {
    for (const zone of colorZones) {
        if (value <= zone.threshold) {
            return zone.color;
        }
    }
    return colorZones[colorZones.length - 1]?.color || defaultColor;
}

function getGlowColorForValue(value: number, colorZones: ColorZone[], defaultColor: string): string {
    for (const zone of colorZones) {
        if (value <= zone.threshold) {
            return zone.glowColor || zone.color;
        }
    }
    const lastZone = colorZones[colorZones.length - 1];
    return lastZone?.glowColor || lastZone?.color || defaultColor;
}

// ============================================================================
// Gradient Creation
// ============================================================================

function createGradient(
    ctx: CanvasRenderingContext2D,
    gradient: GradientParams,
    x: number,
    y: number,
    width: number,
    height: number,
    centerX?: number,
    centerY?: number,
    radius?: number,
    startAngle?: number,
    _endAngle?: number
): CanvasGradient | string {
    if (!gradient.enabled || gradient.stops.length < 2) {
        return gradient.stops[0]?.color || '#00aaff';
    }

    let canvasGradient: CanvasGradient;

    switch (gradient.type) {
        case 'linear': {
            const angle = degreesToRadians(gradient.angle);
            const halfDiag = Math.sqrt(width * width + height * height) / 2;
            const cx = x + width / 2;
            const cy = y + height / 2;
            canvasGradient = ctx.createLinearGradient(
                cx - Math.cos(angle) * halfDiag,
                cy - Math.sin(angle) * halfDiag,
                cx + Math.cos(angle) * halfDiag,
                cy + Math.sin(angle) * halfDiag
            );
            break;
        }
        case 'radial': {
            const cx = centerX ?? x + width / 2;
            const cy = centerY ?? y + height / 2;
            const r = radius ?? Math.min(width, height) / 2;
            canvasGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            break;
        }
        case 'sweep': {
            // Conic gradient (sweep along arc)
            const cx = centerX ?? x + width / 2;
            const cy = centerY ?? y + height / 2;
            const start = startAngle !== undefined ? degreesToRadians(startAngle - 90) : 0;
            canvasGradient = ctx.createConicGradient(start, cx, cy);
            break;
        }
        default:
            return gradient.stops[0]?.color || '#00aaff';
    }

    gradient.stops.forEach(stop => {
        canvasGradient.addColorStop(stop.position / 100, stop.color);
    });

    return canvasGradient;
}

// ============================================================================
// Effect Rendering
// ============================================================================

function applyGlow(ctx: CanvasRenderingContext2D, glow: GlowParams, color?: string): void {
    if (glow.enabled) {
        ctx.shadowColor = color || glow.color;
        ctx.shadowBlur = glow.strength;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}

function clearGlow(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

function applyGlossyEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isArc: boolean = false,
    centerX?: number,
    centerY?: number,
    outerRadius?: number,
    innerRadius?: number
): void {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';

    if (isArc && centerX !== undefined && centerY !== undefined && outerRadius !== undefined) {
        // Circular glossy effect
        const gradient = ctx.createLinearGradient(
            centerX, centerY - outerRadius,
            centerX, centerY + outerRadius
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        if (innerRadius) {
            ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
        }
        ctx.fill();
    } else {
        // Linear glossy effect for bars
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
    }

    ctx.restore();
}

function applyMetallicEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
): void {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';

    // Multiple subtle gradients for metallic sheen
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.1)');
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    ctx.restore();
}

function applyInsetEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 0
): void {
    ctx.save();

    // Inner shadow effect
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, width - 2, height - 2, radius);
    ctx.stroke();

    ctx.restore();
}

// ============================================================================
// Bar Rendering
// ============================================================================

function renderHorizontalBar(
    ctx: CanvasRenderingContext2D,
    value: number, // 0-100
    width: number,
    height: number,
    params: ShapeParams
): void {
    const padding = 10;
    const barWidth = width - padding * 2;
    const barHeight = (params.thickness / 100) * (height - padding * 2);
    const barX = padding;
    const barY = (height - barHeight) / 2;
    const fillWidth = (value / 100) * barWidth;
    const cornerRadius = Math.min(params.cornerRadius, barHeight / 2);

    // Get fill color
    let fillColor: string | CanvasGradient;
    if (params.useColorZones) {
        fillColor = getColorForValue(value, params.colorZones, params.fillColor);
    } else if (params.gradient.enabled) {
        fillColor = createGradient(ctx, params.gradient, barX, barY, fillWidth, barHeight);
    } else {
        fillColor = params.fillColor;
    }

    // Draw background track
    if (params.showBackground) {
        ctx.fillStyle = params.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
        ctx.fill();

        if (params.effects.inset) {
            applyInsetEffect(ctx, barX, barY, barWidth, barHeight, cornerRadius);
        }
    }

    // Draw fill
    if (value > 0) {
        ctx.save();

        // Apply glow
        if (params.glow.enabled) {
            const glowColor = params.useColorZones
                ? getGlowColorForValue(value, params.colorZones, params.glow.color)
                : params.glow.color;
            applyGlow(ctx, params.glow, glowColor);
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillWidth, barHeight, cornerRadius);
        ctx.fill();

        clearGlow(ctx);

        // Apply effects
        if (params.effects.glossy) {
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillWidth, barHeight, cornerRadius);
            ctx.clip();
            applyGlossyEffect(ctx, barX, barY, fillWidth, barHeight);
        }

        if (params.effects.metallic) {
            applyMetallicEffect(ctx, barX, barY, fillWidth, barHeight);
        }

        ctx.restore();
    }
}

function renderVerticalBar(
    ctx: CanvasRenderingContext2D,
    value: number,
    width: number,
    height: number,
    params: ShapeParams
): void {
    const padding = 10;
    const barWidth = (params.thickness / 100) * (width - padding * 2);
    const barHeight = height - padding * 2;
    const barX = (width - barWidth) / 2;
    const barY = padding;
    const fillHeight = (value / 100) * barHeight;
    const cornerRadius = Math.min(params.cornerRadius, barWidth / 2);

    // Get fill color
    let fillColor: string | CanvasGradient;
    if (params.useColorZones) {
        fillColor = getColorForValue(value, params.colorZones, params.fillColor);
    } else if (params.gradient.enabled) {
        fillColor = createGradient(ctx, params.gradient, barX, barY + barHeight - fillHeight, barWidth, fillHeight);
    } else {
        fillColor = params.fillColor;
    }

    // Draw background track
    if (params.showBackground) {
        ctx.fillStyle = params.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
        ctx.fill();

        if (params.effects.inset) {
            applyInsetEffect(ctx, barX, barY, barWidth, barHeight, cornerRadius);
        }
    }

    // Draw fill (from bottom)
    if (value > 0) {
        ctx.save();

        if (params.glow.enabled) {
            const glowColor = params.useColorZones
                ? getGlowColorForValue(value, params.colorZones, params.glow.color)
                : params.glow.color;
            applyGlow(ctx, params.glow, glowColor);
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight, cornerRadius);
        ctx.fill();

        clearGlow(ctx);

        if (params.effects.glossy) {
            ctx.beginPath();
            ctx.roundRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight, cornerRadius);
            ctx.clip();
            applyGlossyEffect(ctx, barX, barY + barHeight - fillHeight, barWidth, fillHeight);
        }

        ctx.restore();
    }
}

// ============================================================================
// Segmented Bar Rendering
// ============================================================================

function renderSegmentedBar(
    ctx: CanvasRenderingContext2D,
    value: number,
    width: number,
    height: number,
    params: ShapeParams,
    isVertical: boolean
): void {
    const padding = 10;
    const segmentCount = params.segmentCount;
    const segmentGap = params.segmentGap;
    const activeSegments = Math.floor((value / 100) * segmentCount);

    let segmentWidth: number, segmentHeight: number;
    let startX: number, startY: number;

    if (isVertical) {
        segmentWidth = (params.thickness / 100) * (width - padding * 2);
        const totalHeight = height - padding * 2;
        segmentHeight = (totalHeight - (segmentCount - 1) * segmentGap) / segmentCount;
        startX = (width - segmentWidth) / 2;
        startY = height - padding - segmentHeight;
    } else {
        const totalWidth = width - padding * 2;
        segmentWidth = (totalWidth - (segmentCount - 1) * segmentGap) / segmentCount;
        segmentHeight = (params.thickness / 100) * (height - padding * 2);
        startX = padding;
        startY = (height - segmentHeight) / 2;
    }

    const cornerRadius = params.fillMode === 'chunky' ? Math.min(segmentWidth, segmentHeight) / 3 : 2;

    for (let i = 0; i < segmentCount; i++) {
        let x: number, y: number;
        if (isVertical) {
            x = startX;
            y = startY - i * (segmentHeight + segmentGap);
        } else {
            x = startX + i * (segmentWidth + segmentGap);
            y = startY;
        }

        const isActive = i < activeSegments;
        const segmentValue = ((i + 1) / segmentCount) * 100;

        ctx.save();

        if (isActive) {
            // Get color for this segment
            let segmentColor: string;
            if (params.useColorZones) {
                segmentColor = getColorForValue(segmentValue, params.colorZones, params.fillColor);
            } else if (params.gradient.enabled) {
                // For gradient, interpolate color based on position
                const pos = i / segmentCount;
                segmentColor = params.gradient.stops.length > 0
                    ? interpolateGradientColor(params.gradient.stops, pos * 100)
                    : params.fillColor;
            } else {
                segmentColor = params.fillColor;
            }

            if (params.glow.enabled) {
                const glowColor = params.useColorZones
                    ? getGlowColorForValue(segmentValue, params.colorZones, params.glow.color)
                    : params.glow.color;
                applyGlow(ctx, { ...params.glow, strength: params.glow.strength * 0.7 }, glowColor);
            }

            ctx.fillStyle = segmentColor;
        } else {
            ctx.fillStyle = params.backgroundColor;
        }

        ctx.beginPath();
        ctx.roundRect(x, y, segmentWidth, segmentHeight, cornerRadius);
        ctx.fill();

        if (isActive && params.effects.glossy) {
            clearGlow(ctx);
            ctx.beginPath();
            ctx.roundRect(x, y, segmentWidth, segmentHeight, cornerRadius);
            ctx.clip();
            applyGlossyEffect(ctx, x, y, segmentWidth, segmentHeight);
        }

        ctx.restore();
    }
}

function interpolateGradientColor(stops: { position: number; color: string }[], position: number): string {
    if (stops.length === 0) return '#ffffff';
    if (stops.length === 1) return stops[0].color;

    // Find the two stops to interpolate between
    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
        if (stops[i].position <= position && stops[i + 1].position >= position) {
            lower = stops[i];
            upper = stops[i + 1];
            break;
        }
    }

    if (lower.position === upper.position) return lower.color;

    const t = (position - lower.position) / (upper.position - lower.position);
    return lerpColor(lower.color, upper.color, t);
}

function lerpColor(color1: string, color2: string, t: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// ============================================================================
// Arc Rendering
// ============================================================================

function getArcAngles(shapeType: ShapeType, customStart: number, customEnd: number): { start: number; end: number } {
    switch (shapeType) {
        case 'circle':
            return { start: 0, end: 360 };
        case 'donut':
            return { start: 0, end: 360 };
        case 'semi_circle_top':
            return { start: 180, end: 360 };
        case 'semi_circle_bottom':
            return { start: 0, end: 180 };
        case 'semi_circle_left':
            return { start: 90, end: 270 };
        case 'semi_circle_right':
            return { start: -90, end: 90 };
        case 'quarter_tl':
            return { start: 180, end: 270 };
        case 'quarter_tr':
            return { start: 270, end: 360 };
        case 'quarter_bl':
            return { start: 90, end: 180 };
        case 'quarter_br':
            return { start: 0, end: 90 };
        case 'custom_arc':
            return { start: customStart, end: customEnd };
        default:
            return { start: 0, end: 360 };
    }
}

function renderArc(
    ctx: CanvasRenderingContext2D,
    value: number,
    width: number,
    height: number,
    params: ShapeParams
): void {
    const padding = 15;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - padding;

    const isDonut = params.shapeType === 'donut' || params.innerRadius > 0;
    const outerRadius = maxRadius;
    const innerRadius = isDonut ? (params.innerRadius / 100) * outerRadius : 0;
    const arcThickness = isDonut ? outerRadius - innerRadius : (params.thickness / 100) * outerRadius;
    const effectiveOuterRadius = isDonut ? outerRadius : outerRadius;
    const effectiveInnerRadius = isDonut ? innerRadius : outerRadius - arcThickness;

    const angles = getArcAngles(params.shapeType, params.startAngle, params.endAngle);
    const startAngle = degreesToRadians(angles.start - 90); // -90 to start from top
    const endAngle = degreesToRadians(angles.end - 90);
    const totalArc = endAngle - startAngle;
    const fillAngle = startAngle + (value / 100) * totalArc;

    // Get fill color
    let fillColor: string | CanvasGradient;
    if (params.useColorZones) {
        fillColor = getColorForValue(value, params.colorZones, params.fillColor);
    } else if (params.gradient.enabled) {
        fillColor = createGradient(
            ctx, params.gradient,
            0, 0, width, height,
            centerX, centerY, effectiveOuterRadius,
            angles.start, angles.end
        );
    } else {
        fillColor = params.fillColor;
    }

    // Draw background track
    if (params.showBackground) {
        ctx.fillStyle = params.backgroundColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, effectiveOuterRadius, startAngle, endAngle);
        ctx.arc(centerX, centerY, effectiveInnerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();

        if (params.effects.inset) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, effectiveOuterRadius - 1, startAngle, endAngle);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX, centerY, effectiveInnerRadius + 1, startAngle, endAngle);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Draw fill
    if (value > 0) {
        ctx.save();

        if (params.glow.enabled) {
            const glowColor = params.useColorZones
                ? getGlowColorForValue(value, params.colorZones, params.glow.color)
                : params.glow.color;
            applyGlow(ctx, params.glow, glowColor);
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, effectiveOuterRadius, startAngle, fillAngle);
        ctx.arc(centerX, centerY, effectiveInnerRadius, fillAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();

        clearGlow(ctx);

        if (params.effects.glossy) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, effectiveOuterRadius, startAngle, fillAngle);
            ctx.arc(centerX, centerY, effectiveInnerRadius, fillAngle, startAngle, true);
            ctx.closePath();
            ctx.clip();
            applyGlossyEffect(ctx, 0, 0, width, height, true, centerX, centerY, effectiveOuterRadius, effectiveInnerRadius);
        }

        ctx.restore();
    }
}

// ============================================================================
// Segmented Arc Rendering
// ============================================================================

function renderSegmentedArc(
    ctx: CanvasRenderingContext2D,
    value: number,
    width: number,
    height: number,
    params: ShapeParams
): void {
    const padding = 15;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - padding;

    const isDonut = params.shapeType === 'donut' || params.innerRadius > 0;
    const outerRadius = maxRadius;
    const innerRadius = isDonut ? (params.innerRadius / 100) * outerRadius : 0;
    const arcThickness = isDonut ? outerRadius - innerRadius : (params.thickness / 100) * outerRadius;
    const effectiveOuterRadius = isDonut ? outerRadius : outerRadius;
    const effectiveInnerRadius = isDonut ? innerRadius : outerRadius - arcThickness;

    const angles = getArcAngles(params.shapeType, params.startAngle, params.endAngle);
    const startAngle = angles.start - 90;
    const endAngle = angles.end - 90;
    const totalArcDegrees = endAngle - startAngle;

    const segmentCount = params.segmentCount;
    const segmentGapDegrees = (params.segmentGap / (2 * Math.PI * outerRadius)) * 360;
    const segmentArcDegrees = (totalArcDegrees - (segmentCount - 1) * segmentGapDegrees) / segmentCount;
    const activeSegments = Math.floor((value / 100) * segmentCount);

    for (let i = 0; i < segmentCount; i++) {
        const segmentStart = startAngle + i * (segmentArcDegrees + segmentGapDegrees);
        const segmentEnd = segmentStart + segmentArcDegrees;
        const isActive = i < activeSegments;
        const segmentValue = ((i + 1) / segmentCount) * 100;

        ctx.save();

        if (isActive) {
            let segmentColor: string;
            if (params.useColorZones) {
                segmentColor = getColorForValue(segmentValue, params.colorZones, params.fillColor);
            } else if (params.gradient.enabled) {
                const pos = i / segmentCount;
                segmentColor = interpolateGradientColor(params.gradient.stops, pos * 100);
            } else {
                segmentColor = params.fillColor;
            }

            if (params.glow.enabled) {
                const glowColor = params.useColorZones
                    ? getGlowColorForValue(segmentValue, params.colorZones, params.glow.color)
                    : params.glow.color;
                applyGlow(ctx, { ...params.glow, strength: params.glow.strength * 0.7 }, glowColor);
            }

            ctx.fillStyle = segmentColor;
        } else {
            ctx.fillStyle = params.backgroundColor;
        }

        const startRad = degreesToRadians(segmentStart);
        const endRad = degreesToRadians(segmentEnd);

        ctx.beginPath();
        ctx.arc(centerX, centerY, effectiveOuterRadius, startRad, endRad);
        ctx.arc(centerX, centerY, effectiveInnerRadius, endRad, startRad, true);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// ============================================================================
// Scale Rendering
// ============================================================================

function renderScale(
    _ctx: CanvasRenderingContext2D,
    _width: number,
    _height: number,
    _params: ShapeParams,
    scaleParams: ScaleParams
): void {
    if (!scaleParams.enabled) return;

    // TODO: Implement scale rendering for different shape types
    // This is a placeholder for future enhancement
}

// ============================================================================
// Value Label Rendering
// ============================================================================

function renderValueLabel(
    ctx: CanvasRenderingContext2D,
    value: number,
    width: number,
    height: number,
    _params: ShapeParams,
    labelParams: ValueLabelParams
): void {
    if (!labelParams.enabled) return;

    const text = labelParams.showUnit
        ? `${value.toFixed(labelParams.decimals)}${labelParams.unit}`
        : value.toFixed(labelParams.decimals);

    ctx.save();
    ctx.font = `${labelParams.fontSize}px ${labelParams.fontFamily}`;
    ctx.fillStyle = labelParams.fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let x = width / 2;
    let y = height / 2;

    switch (labelParams.position) {
        case 'below':
            y = height - 15;
            break;
        case 'above':
            y = 15;
            break;
        case 'inside':
        case 'outside':
            // For arcs, these could be positioned on the arc itself
            // For now, center works
            break;
    }

    ctx.fillText(text, x, y);
    ctx.restore();
}

// ============================================================================
// Main Render Function
// ============================================================================

export function renderShapeGauge(
    ctx: CanvasRenderingContext2D,
    value: number, // 0-100
    width: number,
    height: number,
    shapeParams: ShapeParams,
    scaleParams: ScaleParams,
    valueLabelParams: ValueLabelParams,
    transparent: boolean
): void {
    ctx.clearRect(0, 0, width, height);

    // Background
    if (!transparent) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
    }

    const isBar = shapeParams.shapeType === 'horizontal_bar' || shapeParams.shapeType === 'vertical_bar';
    const isVertical = shapeParams.shapeType === 'vertical_bar';
    const isSegmented = shapeParams.fillMode === 'segmented' || shapeParams.fillMode === 'chunky';

    if (isBar) {
        if (isSegmented) {
            renderSegmentedBar(ctx, value, width, height, shapeParams, isVertical);
        } else if (isVertical) {
            renderVerticalBar(ctx, value, width, height, shapeParams);
        } else {
            renderHorizontalBar(ctx, value, width, height, shapeParams);
        }
    } else {
        // Arc-based shapes
        if (isSegmented) {
            renderSegmentedArc(ctx, value, width, height, shapeParams);
        } else {
            renderArc(ctx, value, width, height, shapeParams);
        }
    }

    // Render scale
    renderScale(ctx, width, height, shapeParams, scaleParams);

    // Render value label
    renderValueLabel(ctx, value, width, height, shapeParams, valueLabelParams);
}

// ============================================================================
// Frame Generation
// ============================================================================

export async function generateShapeGaugeFrames(
    width: number,
    height: number,
    frameCount: number,
    shapeParams: ShapeParams,
    scaleParams: ScaleParams,
    valueLabelParams: ValueLabelParams,
    transparent: boolean,
    onProgress?: (progress: number) => void
): Promise<string[]> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
        const value = (i / (frameCount - 1)) * 100;

        renderShapeGauge(ctx, value, width, height, shapeParams, scaleParams, valueLabelParams, transparent);

        frames.push(canvas.toDataURL('image/png'));

        if (onProgress) {
            onProgress((i / frameCount) * 100);
        }

        // Yield to keep UI responsive
        if (i % 10 === 0) {
            await new Promise(r => setTimeout(r, 0));
        }
    }

    return frames;
}
