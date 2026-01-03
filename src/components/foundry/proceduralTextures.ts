/**
 * Procedural Texture Generators
 * Canvas 2D based texture generation for gauge backgrounds
 */

import { ProceduralTextureParams, ProceduralTextureType } from '@/stores/foundryStore';

// Simple Perlin-like noise for textures
function noise2D(x: number, y: number, seed: number = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number = 0): number {
    const corners = (
        noise2D(x - 1, y - 1, seed) + noise2D(x + 1, y - 1, seed) +
        noise2D(x - 1, y + 1, seed) + noise2D(x + 1, y + 1, seed)
    ) / 16;
    const sides = (
        noise2D(x - 1, y, seed) + noise2D(x + 1, y, seed) +
        noise2D(x, y - 1, seed) + noise2D(x, y + 1, seed)
    ) / 8;
    const center = noise2D(x, y, seed) / 4;
    return corners + sides + center;
}

function interpolatedNoise(x: number, y: number, seed: number = 0): number {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const intY = Math.floor(y);
    const fracY = y - intY;

    const v1 = smoothNoise(intX, intY, seed);
    const v2 = smoothNoise(intX + 1, intY, seed);
    const v3 = smoothNoise(intX, intY + 1, seed);
    const v4 = smoothNoise(intX + 1, intY + 1, seed);

    const i1 = v1 * (1 - fracX) + v2 * fracX;
    const i2 = v3 * (1 - fracX) + v4 * fracX;

    return i1 * (1 - fracY) + i2 * fracY;
}

function perlinNoise(x: number, y: number, octaves: number = 4, seed: number = 0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += interpolatedNoise(x * frequency, y * frequency, seed) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }

    return total / maxValue;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function lerpColor(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }, t: number): { r: number; g: number; b: number } {
    return {
        r: Math.round(c1.r + (c2.r - c1.r) * t),
        g: Math.round(c1.g + (c2.g - c1.g) * t),
        b: Math.round(c1.b + (c2.b - c1.b) * t)
    };
}

/**
 * Generate carbon fiber texture
 */
export function generateCarbonFiber(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProceduralTextureParams
): void {
    const { scale, angle, primaryColor, secondaryColor, intensity } = params;
    const primary = hexToRgb(primaryColor);
    const secondary = hexToRgb(secondaryColor);

    const cellSize = 8 * scale;
    const rad = angle * Math.PI / 180;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Rotate coordinates
            const rx = x * Math.cos(rad) - y * Math.sin(rad);
            const ry = x * Math.sin(rad) + y * Math.cos(rad);

            // Create weave pattern
            const cellX = Math.floor(rx / cellSize) % 2;
            const cellY = Math.floor(ry / cellSize) % 2;
            const inCell = (cellX + cellY) % 2;

            // Position within cell
            const localX = (rx % cellSize + cellSize) % cellSize;
            const localY = (ry % cellSize + cellSize) % cellSize;

            // Create fiber texture within cell
            let brightness = 0.5;
            if (inCell === 0) {
                brightness = 0.3 + (localX / cellSize) * 0.4;
            } else {
                brightness = 0.3 + (localY / cellSize) * 0.4;
            }

            // Add subtle noise
            brightness += (noise2D(x * 0.1, y * 0.1) - 0.5) * 0.1 * intensity;
            brightness = Math.max(0, Math.min(1, brightness));

            const color = lerpColor(secondary, primary, brightness);
            const idx = (y * width + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate brushed metal texture
 */
export function generateBrushedMetal(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProceduralTextureParams
): void {
    const { scale, angle, primaryColor, secondaryColor, intensity } = params;
    const primary = hexToRgb(primaryColor);
    const secondary = hexToRgb(secondaryColor);
    const rad = angle * Math.PI / 180;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Rotate coordinates for brush direction
            const rx = x * Math.cos(rad) - y * Math.sin(rad);

            // Create horizontal brush lines
            const lineNoise = noise2D(rx * 0.5 / scale, y * 0.01 / scale) * intensity;
            const fineNoise = noise2D(rx * 2 / scale, y * 0.1 / scale) * 0.3 * intensity;

            let brightness = 0.4 + lineNoise * 0.3 + fineNoise * 0.2;

            // Add occasional bright streaks
            const streak = noise2D(rx * 0.1 / scale, Math.floor(y / 3)) > 0.9 ? 0.2 : 0;
            brightness += streak * intensity;

            brightness = Math.max(0, Math.min(1, brightness));

            const color = lerpColor(secondary, primary, brightness);
            const idx = (y * width + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate perforated metal texture
 */
export function generatePerforated(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProceduralTextureParams
): void {
    const { scale, primaryColor, secondaryColor, intensity } = params;
    const primary = hexToRgb(primaryColor);
    const secondary = hexToRgb(secondaryColor);

    const spacing = 12 * scale;
    const holeRadius = 4 * scale;

    // Fill with primary color
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Calculate nearest hole center
            const holeX = Math.round(x / spacing) * spacing;
            const holeY = Math.round(y / spacing) * spacing;

            // Distance to hole center
            const dx = x - holeX;
            const dy = y - holeY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const idx = (y * width + x) * 4;

            if (dist < holeRadius) {
                // Inside hole - dark
                data[idx] = secondary.r;
                data[idx + 1] = secondary.g;
                data[idx + 2] = secondary.b;
            } else if (dist < holeRadius + 2 * scale) {
                // Edge shadow
                const edgeFade = (dist - holeRadius) / (2 * scale);
                const shadowColor = lerpColor(secondary, primary, edgeFade * intensity);
                data[idx] = shadowColor.r;
                data[idx + 1] = shadowColor.g;
                data[idx + 2] = shadowColor.b;
            }
            // else keep primary color
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate leather texture
 */
export function generateLeather(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProceduralTextureParams
): void {
    const { scale, primaryColor, secondaryColor, intensity } = params;
    const primary = hexToRgb(primaryColor);
    const secondary = hexToRgb(secondaryColor);

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Multi-octave noise for leather grain
            const grain = perlinNoise(x / (20 * scale), y / (20 * scale), 4, 42);

            // Wrinkle pattern
            const wrinkle = perlinNoise(x / (50 * scale), y / (50 * scale), 2, 123);

            // Pore pattern (small dots)
            const pores = noise2D(x / (3 * scale), y / (3 * scale), 789) > 0.85 ? 0.2 : 0;

            let brightness = 0.4 + grain * 0.3 * intensity + wrinkle * 0.2 * intensity - pores * intensity;
            brightness = Math.max(0, Math.min(1, brightness));

            const color = lerpColor(secondary, primary, brightness);
            const idx = (y * width + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate wood grain texture
 */
export function generateWoodGrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProceduralTextureParams
): void {
    const { scale, angle, primaryColor, secondaryColor, intensity } = params;
    const primary = hexToRgb(primaryColor);
    const secondary = hexToRgb(secondaryColor);
    const rad = angle * Math.PI / 180;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Rotate for grain direction
            const rx = x * Math.cos(rad) - y * Math.sin(rad);
            const ry = x * Math.sin(rad) + y * Math.cos(rad);

            // Wood grain rings
            const ringFreq = 0.05 / scale;
            const ringOffset = perlinNoise(rx * 0.01, ry * 0.01, 2, 55) * 20;
            const rings = Math.sin((rx + ringOffset) * ringFreq) * 0.5 + 0.5;

            // Fine grain lines
            const fineGrain = perlinNoise(rx * 0.2 / scale, ry * 0.02 / scale, 3, 77);

            // Knots (rare)
            const knotNoise = perlinNoise(rx * 0.02, ry * 0.02, 2, 99);
            const knot = knotNoise > 0.85 ? (knotNoise - 0.85) * 2 : 0;

            let brightness = 0.4 + rings * 0.3 * intensity + fineGrain * 0.2 * intensity - knot * 0.3;
            brightness = Math.max(0, Math.min(1, brightness));

            const color = lerpColor(secondary, primary, brightness);
            const idx = (y * width + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate diamond plate texture
 */
export function generateDiamondPlate(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProceduralTextureParams
): void {
    const { scale, angle, primaryColor, secondaryColor, intensity } = params;
    const primary = hexToRgb(primaryColor);
    const secondary = hexToRgb(secondaryColor);
    const rad = angle * Math.PI / 180;

    const cellSize = 20 * scale;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Rotate coordinates
            const rx = x * Math.cos(rad) - y * Math.sin(rad);
            const ry = x * Math.sin(rad) + y * Math.cos(rad);

            // Diamond pattern
            const cellX = ((rx % cellSize) + cellSize) % cellSize;
            const cellY = ((ry % cellSize) + cellSize) % cellSize;

            // Distance from diamond center
            const dx = Math.abs(cellX - cellSize / 2);
            const dy = Math.abs(cellY - cellSize / 2);
            const diamondDist = dx + dy;

            let brightness = 0.3;
            const raisedSize = cellSize * 0.35;

            if (diamondDist < raisedSize) {
                // Raised diamond
                const raise = 1 - diamondDist / raisedSize;
                brightness = 0.5 + raise * 0.4 * intensity;

                // Add highlight on one edge
                if (cellX < cellSize / 2 && cellY < cellSize / 2) {
                    brightness += 0.15 * intensity;
                }
            }

            const color = lerpColor(secondary, primary, brightness);
            const idx = (y * width + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate circuit board texture
 */
export function generateCircuitBoard(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProceduralTextureParams
): void {
    const { scale, primaryColor, secondaryColor } = params;

    // Fill base
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, width, height);

    // Draw traces
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2 * scale;

    const gridSize = 20 * scale;
    const seed = 12345;

    for (let gx = 0; gx < width / gridSize; gx++) {
        for (let gy = 0; gy < height / gridSize; gy++) {
            const x = gx * gridSize;
            const y = gy * gridSize;

            // Random trace directions
            const n = noise2D(gx, gy, seed);

            ctx.beginPath();
            if (n > 0.7) {
                // Horizontal trace
                ctx.moveTo(x, y + gridSize / 2);
                ctx.lineTo(x + gridSize, y + gridSize / 2);
            } else if (n > 0.4) {
                // Vertical trace
                ctx.moveTo(x + gridSize / 2, y);
                ctx.lineTo(x + gridSize / 2, y + gridSize);
            } else if (n > 0.2) {
                // Corner
                ctx.moveTo(x, y + gridSize / 2);
                ctx.lineTo(x + gridSize / 2, y + gridSize / 2);
                ctx.lineTo(x + gridSize / 2, y + gridSize);
            }
            ctx.stroke();

            // Pads/vias
            if (noise2D(gx + 100, gy + 100, seed) > 0.8) {
                ctx.beginPath();
                ctx.arc(x + gridSize / 2, y + gridSize / 2, 3 * scale, 0, Math.PI * 2);
                ctx.fillStyle = secondaryColor;
                ctx.fill();
            }
        }
    }
}

/**
 * Generate texture based on type
 */
export function generateProceduralTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProceduralTextureParams
): void {
    switch (params.type) {
        case 'carbon_fiber':
            generateCarbonFiber(ctx, width, height, params);
            break;
        case 'brushed_metal':
            generateBrushedMetal(ctx, width, height, params);
            break;
        case 'perforated':
            generatePerforated(ctx, width, height, params);
            break;
        case 'leather':
            generateLeather(ctx, width, height, params);
            break;
        case 'wood_grain':
            generateWoodGrain(ctx, width, height, params);
            break;
        case 'diamond_plate':
            generateDiamondPlate(ctx, width, height, params);
            break;
        case 'circuit_board':
            generateCircuitBoard(ctx, width, height, params);
            break;
        case 'none':
        default:
            // Solid color
            ctx.fillStyle = params.primaryColor;
            ctx.fillRect(0, 0, width, height);
            break;
    }
}

export const TEXTURE_OPTIONS: { value: ProceduralTextureType; label: string }[] = [
    { value: 'none', label: 'Solid Color' },
    { value: 'carbon_fiber', label: 'Carbon Fiber' },
    { value: 'brushed_metal', label: 'Brushed Metal' },
    { value: 'perforated', label: 'Perforated' },
    { value: 'diamond_plate', label: 'Diamond Plate' },
    { value: 'leather', label: 'Leather' },
    { value: 'wood_grain', label: 'Wood Grain' },
    { value: 'circuit_board', label: 'Circuit Board' },
];
