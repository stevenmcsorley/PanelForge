/**
 * Image Filters for Background Foundry
 * Canvas 2D based image processing
 */

import { BackgroundEffectsParams } from '@/stores/foundryStore';

/**
 * Apply blur effect using box blur approximation
 */
export function applyBlur(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    radius: number
): void {
    if (radius <= 0) return;

    // Use CSS filter for performance
    ctx.filter = `blur(${radius}px)`;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCtx.drawImage(ctx.canvas, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
}

/**
 * Apply noise overlay
 */
export function applyNoise(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
): void {
    if (intensity <= 0) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity * 50;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply brightness adjustment
 * @param brightness - 0-200, 100 is normal
 */
export function applyBrightness(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    brightness: number
): void {
    if (brightness === 100) return;

    const factor = brightness / 100;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, data[i] * factor));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor));
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply contrast adjustment
 * @param contrast - 0-200, 100 is normal
 */
export function applyContrast(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    contrast: number
): void {
    if (contrast === 100) return;

    const factor = (contrast / 100 - 1) * 255;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, ((data[i] - 128) * (contrast / 100)) + 128 + factor * 0.01));
        data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - 128) * (contrast / 100)) + 128 + factor * 0.01));
        data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - 128) * (contrast / 100)) + 128 + factor * 0.01));
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply saturation adjustment
 * @param saturation - 0-200, 100 is normal
 */
export function applySaturation(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    saturation: number
): void {
    if (saturation === 100) return;

    const factor = saturation / 100;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate grayscale value
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;

        // Interpolate between gray and original
        data[i] = Math.max(0, Math.min(255, gray + (r - gray) * factor));
        data[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * factor));
        data[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * factor));
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply color overlay with blend mode
 */
export function applyColorOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string,
    opacity: number,
    blendMode: GlobalCompositeOperation
): void {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = blendMode;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

/**
 * Apply all background effects
 */
export function applyBackgroundEffects(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    effects: BackgroundEffectsParams
): void {
    // Apply in order: blur, brightness, contrast, saturation, noise
    applyBlur(ctx, width, height, effects.blur);
    applyBrightness(ctx, width, height, effects.brightness);
    applyContrast(ctx, width, height, effects.contrast);
    applySaturation(ctx, width, height, effects.saturation);
    applyNoise(ctx, width, height, effects.noise);
}

/**
 * Load an image from data URL and draw to canvas
 */
export function loadImageToCanvas(
    ctx: CanvasRenderingContext2D,
    src: string,
    width: number,
    height: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!src) {
            resolve();
            return;
        }

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            resolve();
        };
        img.onerror = reject;
        img.src = src;
    });
}
