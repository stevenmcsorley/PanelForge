import { StaticShapeParams } from '@/stores/staticShapeFoundryStore';

export const renderStaticShape = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: StaticShapeParams
) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save state
    ctx.save();

    // Center the drawing
    const centerX = width / 2;
    const centerY = height / 2;

    const {
        shapeType,
        width: shapeWidth,
        height: shapeHeight,
        cornerRadius,
        lineThickness,
        fillColor,
        fillOpacity,
        strokeEnabled,
        strokeColor,
        strokeWidth,
        strokeOpacity,
        shadowEnabled,
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY,
        shadowOpacity
    } = params;

    // Apply shadow
    if (shadowEnabled) {
        ctx.shadowColor = hexToRgba(shadowColor, shadowOpacity / 100);
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
    } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // Set styles
    ctx.fillStyle = hexToRgba(fillColor, fillOpacity / 100);
    ctx.strokeStyle = hexToRgba(strokeColor, strokeOpacity / 100);
    ctx.lineWidth = strokeWidth;

    // Draw Shape
    if (shapeType === 'rectangle') {
        const x = centerX - shapeWidth / 2;
        const y = centerY - shapeHeight / 2;

        ctx.beginPath();
        if (cornerRadius > 0) {
            ctx.roundRect(x, y, shapeWidth, shapeHeight, cornerRadius);
        } else {
            ctx.rect(x, y, shapeWidth, shapeHeight);
        }

        ctx.fill();
        if (strokeEnabled) ctx.stroke();

    } else if (shapeType === 'circle') {
        // Use ellipse to support non-perfect circles if width != height
        const radiusX = shapeWidth / 2;
        const radiusY = shapeHeight / 2;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

        ctx.fill();
        if (strokeEnabled) ctx.stroke();

    } else if (shapeType === 'line') {
        // Horizontal line centered
        // Line thickness overrides height/strokeWidth depending on intention, but usually 'line' implies a stroke
        // Here we can draw a filled rectangle or a stroke. Since we have fill/stroke params, let's treat it as a filled rect
        // or just a stroke?
        // Let's treat it as a rectangle of set width and custom thickness (height) to allow for fills/borders

        const thick = lineThickness || 2;
        const w = shapeWidth; // Length

        // Draw as a filled rectangle
        const x = centerX - w / 2;
        const y = centerY - thick / 2;

        ctx.beginPath();
        ctx.rect(x, y, w, thick);

        ctx.fill();
        if (strokeEnabled) ctx.stroke();
    }

    // Clear drop shadow before rendering inner shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Apply inner shadow if enabled
    if (params.innerShadow.enabled) {
        renderInnerShadow(ctx, centerX, centerY, params);
    }

    // Restore state
    ctx.restore();
};

// Render inner shadow using gradient overlay technique
function renderInnerShadow(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    params: StaticShapeParams
) {
    const {
        shapeType,
        width: shapeWidth,
        height: shapeHeight,
        cornerRadius,
        lineThickness,
        innerShadow
    } = params;

    // Calculate offset from angle
    const angleRad = (innerShadow.angle * Math.PI) / 180;
    const offsetX = Math.cos(angleRad) * innerShadow.distance;
    const offsetY = Math.sin(angleRad) * innerShadow.distance;

    // Save state
    ctx.save();

    // Create clipping path for the shape
    ctx.beginPath();
    if (shapeType === 'rectangle') {
        const x = centerX - shapeWidth / 2;
        const y = centerY - shapeHeight / 2;
        if (cornerRadius > 0) {
            ctx.roundRect(x, y, shapeWidth, shapeHeight, cornerRadius);
        } else {
            ctx.rect(x, y, shapeWidth, shapeHeight);
        }
    } else if (shapeType === 'circle') {
        const radiusX = shapeWidth / 2;
        const radiusY = shapeHeight / 2;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    } else if (shapeType === 'line') {
        const thick = lineThickness || 2;
        const w = shapeWidth;
        const x = centerX - w / 2;
        const y = centerY - thick / 2;
        ctx.rect(x, y, w, thick);
    }
    ctx.clip();

    // Create gradient for inner shadow
    const maxDim = Math.max(shapeWidth, shapeHeight);
    const gradientRadius = maxDim / 2 + innerShadow.blur + innerShadow.spread;

    const gradient = ctx.createRadialGradient(
        centerX - offsetX,
        centerY - offsetY,
        Math.max(0, maxDim / 2 - innerShadow.blur - innerShadow.spread),
        centerX - offsetX,
        centerY - offsetY,
        gradientRadius
    );

    const shadowColor = innerShadow.color;
    const shadowOpacity = innerShadow.opacity / 100;

    // Create smooth gradient from transparent to shadow color
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, hexToRgba(shadowColor, shadowOpacity * 0.3));
    gradient.addColorStop(1, hexToRgba(shadowColor, shadowOpacity));

    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(
        centerX - shapeWidth / 2 - innerShadow.blur,
        centerY - shapeHeight / 2 - innerShadow.blur,
        shapeWidth + innerShadow.blur * 2,
        shapeHeight + innerShadow.blur * 2
    );

    // Restore state
    ctx.restore();
}

// Helper: Hex to RGBA
function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
