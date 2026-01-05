/**
 * LCD Gauge Rendering Utilities
 * Canvas 2D rendering functions for LCD-style gauges
 * - Numeric displays (7-segment digits)
 * - Text labels (7-segment letters)
 * - Bar graphs (VU meter style)
 */

import {
    LcdSegmentStyle,
    LcdNumericParams,
    LcdTextParams,
    LcdBarParams,
    ColorSplit,
} from '@/stores/lcdGaugeFoundryStore';

// ============================================================================
// 7-Segment Character Map
// ============================================================================

// Segment layout for 7-segment display:
//   _0_
//  |   |
//  1   2
//  |_3_|
//  |   |
//  4   5
//  |_6_|

const SEGMENT_CHARACTERS: Record<string, number[]> = {
    // Digits
    '0': [0, 1, 2, 4, 5, 6],
    '1': [2, 5],
    '2': [0, 2, 3, 4, 6],
    '3': [0, 2, 3, 5, 6],
    '4': [1, 2, 3, 5],
    '5': [0, 1, 3, 5, 6],
    '6': [0, 1, 3, 4, 5, 6],
    '7': [0, 2, 5],
    '8': [0, 1, 2, 3, 4, 5, 6],
    '9': [0, 1, 2, 3, 5, 6],

    // Letters (approximated for 7-segment display)
    'A': [0, 1, 2, 3, 4, 5],
    'B': [1, 3, 4, 5, 6],       // Lowercase b shape
    'C': [0, 1, 4, 6],
    'D': [2, 3, 4, 5, 6],       // Lowercase d shape
    'E': [0, 1, 3, 4, 6],
    'F': [0, 1, 3, 4],
    'G': [0, 1, 4, 5, 6],
    'H': [1, 2, 3, 4, 5],
    'I': [1, 4],
    'J': [2, 4, 5, 6],
    'K': [1, 3, 4, 5],          // Approximation
    'L': [1, 4, 6],
    'M': [0, 1, 2, 4, 5],       // Approximation (missing middle top)
    'N': [3, 4, 5],             // Lowercase n shape
    'O': [0, 1, 2, 4, 5, 6],
    'P': [0, 1, 2, 3, 4],
    'Q': [0, 1, 2, 3, 5],
    'R': [3, 4],                // Lowercase r shape
    'S': [0, 1, 3, 5, 6],
    'T': [1, 3, 4, 6],          // Lowercase t shape
    'U': [1, 2, 4, 5, 6],
    'V': [1, 4, 5, 6],          // Approximation
    'W': [1, 2, 4, 5, 6],       // Same as U
    'X': [1, 2, 3, 4, 5],       // Same as H
    'Y': [1, 2, 3, 5, 6],
    'Z': [0, 2, 3, 4, 6],       // Same as 2

    // Symbols
    '-': [3],
    '_': [6],
    '°': [0, 1, 2, 3],          // Degree symbol
    ' ': [],
    '.': [],                     // Special handling
    ':': [],                     // Special handling
    '%': [0, 2, 3, 4, 6],       // Approximation
    '+': [1, 2, 3],             // Approximation
};

// ============================================================================
// Segment Path Generation
// ============================================================================

interface SegmentPath {
    points: [number, number][];
}

function getSegmentPaths(
    x: number,
    y: number,
    width: number,
    height: number,
    segmentWidth: number,
    gap: number
): SegmentPath[] {
    const sw = segmentWidth;
    const hw = sw / 2;
    const midY = y + height / 2;

    // Horizontal segments (0, 3, 6)
    const horzLength = width - sw * 2 - gap * 2;

    // Vertical segments height
    const vertHeight = (height - sw * 3) / 2 - gap;

    const segments: SegmentPath[] = [];

    // Segment 0 (top horizontal)
    segments.push({
        points: [
            [x + sw + gap, y],
            [x + sw + gap + horzLength, y],
            [x + sw + gap + horzLength - hw, y + sw],
            [x + sw + gap + hw, y + sw],
        ],
    });

    // Segment 1 (upper left vertical)
    segments.push({
        points: [
            [x, y + sw + gap],
            [x + sw, y + sw + gap + hw],
            [x + sw, y + sw + gap + vertHeight - hw],
            [x + hw, midY],
            [x, y + sw + gap + vertHeight],
        ],
    });

    // Segment 2 (upper right vertical)
    segments.push({
        points: [
            [x + width, y + sw + gap],
            [x + width, y + sw + gap + vertHeight],
            [x + width - hw, midY],
            [x + width - sw, y + sw + gap + vertHeight - hw],
            [x + width - sw, y + sw + gap + hw],
        ],
    });

    // Segment 3 (middle horizontal)
    segments.push({
        points: [
            [x + sw + gap + hw, midY - hw],
            [x + sw + gap + horzLength - hw, midY - hw],
            [x + sw + gap + horzLength, midY],
            [x + sw + gap + horzLength - hw, midY + hw],
            [x + sw + gap + hw, midY + hw],
            [x + sw + gap, midY],
        ],
    });

    // Segment 4 (lower left vertical)
    segments.push({
        points: [
            [x + hw, midY],
            [x + sw, midY + gap + hw],
            [x + sw, midY + gap + vertHeight - hw],
            [x, midY + gap + vertHeight],
            [x, midY + gap],
        ],
    });

    // Segment 5 (lower right vertical)
    segments.push({
        points: [
            [x + width - hw, midY],
            [x + width, midY + gap],
            [x + width, midY + gap + vertHeight],
            [x + width - sw, midY + gap + vertHeight - hw],
            [x + width - sw, midY + gap + hw],
        ],
    });

    // Segment 6 (bottom horizontal)
    segments.push({
        points: [
            [x + sw + gap + hw, y + height - sw],
            [x + sw + gap + horzLength - hw, y + height - sw],
            [x + sw + gap + horzLength, y + height],
            [x + sw + gap, y + height],
        ],
    });

    return segments;
}

// ============================================================================
// Segment Drawing
// ============================================================================

function drawSegment(
    ctx: CanvasRenderingContext2D,
    segment: SegmentPath,
    color: string,
    glowStrength: number,
    glowColor: string,
    bevel: boolean
): void {
    ctx.save();

    if (glowStrength > 0 && color !== '#0a1a0a' && color !== '#1a0a0a') {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowStrength;
    }

    ctx.fillStyle = color;
    ctx.beginPath();

    const points = segment.points;
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    // Add bevel effect for "on" segments
    if (bevel && color !== '#0a1a0a' && color !== '#1a0a0a') {
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-atop';

        // Highlight on top edge
        const gradient = ctx.createLinearGradient(
            points[0][0], points[0][1],
            points[0][0], points[0][1] + 5
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    ctx.restore();
}

// ============================================================================
// Character Drawing
// ============================================================================

export function drawLcdCharacter(
    ctx: CanvasRenderingContext2D,
    char: string,
    x: number,
    y: number,
    digitWidth: number,
    digitHeight: number,
    style: LcdSegmentStyle
): void {
    const { onColor, offColor, glowStrength, glowColor, segmentWidth, segmentGap, bevel, skew } = style;

    // Get segment paths
    const segments = getSegmentPaths(x, y, digitWidth, digitHeight, segmentWidth, segmentGap);

    // Lookup active segments for this character
    const upperChar = char.toUpperCase();
    const activeSegments = SEGMENT_CHARACTERS[upperChar] || [];

    // Apply skew if needed
    if (skew !== 0) {
        ctx.save();
        ctx.transform(1, 0, Math.tan(skew * Math.PI / 180), 1, 0, 0);
    }

    // Draw all segments
    for (let i = 0; i < 7; i++) {
        const isOn = activeSegments.includes(i);
        drawSegment(
            ctx,
            segments[i],
            isOn ? onColor : offColor,
            isOn ? glowStrength : 0,
            glowColor,
            bevel
        );
    }

    if (skew !== 0) {
        ctx.restore();
    }
}

export function drawDecimalPoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    digitHeight: number,
    style: LcdSegmentStyle,
    on: boolean = true
): void {
    const { onColor, offColor, glowStrength, glowColor, segmentWidth } = style;
    const dotRadius = segmentWidth * 0.6;
    const color = on ? onColor : offColor;

    ctx.save();

    if (on && glowStrength > 0) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowStrength;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y + digitHeight - dotRadius, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ============================================================================
// Numeric Display Rendering
// ============================================================================

export function renderNumericDisplay(
    ctx: CanvasRenderingContext2D,
    value: number,
    width: number,
    height: number,
    params: LcdNumericParams,
    style: LcdSegmentStyle,
    transparent: boolean,
    backgroundColor: string,
    padding: number,
    borderRadius: number,
    showBackground: boolean
): void {
    ctx.clearRect(0, 0, width, height);

    // Draw background if needed
    if (!transparent && showBackground) {
        ctx.fillStyle = backgroundColor;
        ctx.beginPath();
        ctx.roundRect(padding / 2, padding / 2, width - padding, height - padding, borderRadius);
        ctx.fill();
    }

    // Format the value
    let valueStr: string;
    if (params.showDecimal && params.decimalPlaces > 0) {
        valueStr = value.toFixed(params.decimalPlaces);
    } else {
        valueStr = Math.round(value).toString();
    }

    // Handle sign
    const isNegative = value < 0;
    if (isNegative) {
        valueStr = valueStr.substring(1); // Remove the minus sign, we'll add it separately
    }

    // Pad with leading zeros or spaces
    const [intPart, decPart] = valueStr.split('.');
    const intDigits = params.digitCount - (params.showDecimal ? params.decimalPlaces + 1 : 0) - (params.showSign ? 1 : 0);

    let paddedInt: string;
    if (params.showLeadingZeros) {
        paddedInt = intPart.padStart(intDigits, '0');
    } else {
        paddedInt = intPart.padStart(intDigits, ' ');
    }

    // Build final display string
    let displayStr = '';
    if (params.showSign) {
        displayStr += isNegative ? '-' : (value > 0 ? '+' : ' ');
    }
    displayStr += paddedInt;
    if (params.showDecimal && params.decimalPlaces > 0) {
        displayStr += '.' + (decPart || '').padEnd(params.decimalPlaces, '0');
    }

    // Calculate total width
    const hasDecimal = displayStr.includes('.');
    const charCount = displayStr.replace('.', '').length;
    const decimalWidth = hasDecimal ? style.segmentWidth * 2 : 0;
    const totalWidth = charCount * params.digitWidth + (charCount - 1) * params.digitSpacing + decimalWidth;

    // Calculate starting position based on alignment
    let startX: number;
    switch (params.alignment) {
        case 'left':
            startX = padding;
            break;
        case 'center':
            startX = (width - totalWidth) / 2;
            break;
        case 'right':
            startX = width - totalWidth - padding;
            break;
    }
    const startY = (height - params.digitHeight) / 2;

    // Draw each character
    for (let i = 0; i < displayStr.length; i++) {
        const char = displayStr[i];

        if (char === '.') {
            // Draw decimal point
            drawDecimalPoint(ctx, startX + style.segmentWidth, startY, params.digitHeight, style, true);
            startX += style.segmentWidth * 2;
        } else {
            drawLcdCharacter(ctx, char, startX, startY, params.digitWidth, params.digitHeight, style);
            startX += params.digitWidth + params.digitSpacing;
        }
    }
}

// ============================================================================
// Text Display Rendering
// ============================================================================

export function renderTextDisplay(
    ctx: CanvasRenderingContext2D,
    text: string,
    width: number,
    height: number,
    params: LcdTextParams,
    style: LcdSegmentStyle,
    transparent: boolean,
    backgroundColor: string,
    padding: number,
    borderRadius: number,
    showBackground: boolean
): void {
    ctx.clearRect(0, 0, width, height);

    // Draw background if needed
    if (!transparent && showBackground) {
        ctx.fillStyle = backgroundColor;
        ctx.beginPath();
        ctx.roundRect(padding / 2, padding / 2, width - padding, height - padding, borderRadius);
        ctx.fill();
    }

    // Prepare text
    let displayText = params.uppercase ? text.toUpperCase() : text;
    displayText = displayText.substring(0, 12); // Max 12 characters

    // Calculate total width
    const totalWidth = displayText.length * params.digitWidth + (displayText.length - 1) * params.digitSpacing;

    // Center the text
    const startX = (width - totalWidth) / 2;
    const startY = (height - params.digitHeight) / 2;

    // Draw each character
    for (let i = 0; i < displayText.length; i++) {
        const char = displayText[i];
        const x = startX + i * (params.digitWidth + params.digitSpacing);
        drawLcdCharacter(ctx, char, x, startY, params.digitWidth, params.digitHeight, style);
    }
}

// ============================================================================
// Bar Graph Rendering
// ============================================================================

function getColorForSegment(segmentIndex: number, totalSegments: number, colorSplits: ColorSplit[]): string {
    const percentage = ((segmentIndex + 1) / totalSegments) * 100;

    // Find the color split this segment belongs to
    for (const split of colorSplits) {
        if (percentage <= split.threshold) {
            return split.color;
        }
    }

    // Default to last color if no split matches
    return colorSplits[colorSplits.length - 1]?.color || '#00ff44';
}

export function renderBarGraph(
    ctx: CanvasRenderingContext2D,
    value: number, // 0-100
    width: number,
    height: number,
    params: LcdBarParams,
    style: LcdSegmentStyle,
    transparent: boolean,
    backgroundColor: string,
    padding: number,
    borderRadius: number,
    showBackground: boolean
): void {
    ctx.clearRect(0, 0, width, height);

    // Draw background if needed
    if (!transparent && showBackground) {
        ctx.fillStyle = backgroundColor;
        ctx.beginPath();
        ctx.roundRect(padding / 2, padding / 2, width - padding, height - padding, borderRadius);
        ctx.fill();
    }

    const isHorizontal = params.orientation === 'horizontal';
    const segmentCount = params.segmentCount;
    const activeSegments = Math.round((value / 100) * segmentCount);

    // Calculate segment dimensions
    let segWidth: number, segHeight: number, segGap: number;
    if (isHorizontal) {
        segGap = params.segmentGap;
        segWidth = Math.max(1, (width - padding * 2 - (segmentCount - 1) * segGap) / segmentCount);
        segHeight = Math.max(1, Math.min(params.segmentHeight, height - padding * 2));
    } else {
        segGap = params.segmentGap;
        segHeight = Math.max(1, (height - padding * 2 - (segmentCount - 1) * segGap) / segmentCount);
        segWidth = Math.max(1, Math.min(params.segmentWidth, width - padding * 2));
    }

    // Starting position
    const startX = isHorizontal ? padding : (width - segWidth) / 2;
    const startY = isHorizontal ? (height - segHeight) / 2 : height - padding - segHeight;

    // Determine fill direction
    const reverseOrder = (params.fillDirection === 'right_to_left' || params.fillDirection === 'top_to_bottom');

    // Draw each segment
    for (let i = 0; i < segmentCount; i++) {
        const segmentIndex = reverseOrder ? (segmentCount - 1 - i) : i;
        const isActive = segmentIndex < activeSegments;

        let x: number, y: number;
        if (isHorizontal) {
            x = startX + i * (segWidth + segGap);
            y = startY;
        } else {
            x = startX;
            y = startY - i * (segHeight + segGap);
        }

        ctx.save();

        if (isActive) {
            const segmentColor = getColorForSegment(segmentIndex, segmentCount, params.colorSplits);

            if (style.glowStrength > 0) {
                ctx.shadowColor = segmentColor;
                ctx.shadowBlur = style.glowStrength;
            }
            ctx.fillStyle = segmentColor;
        } else {
            ctx.fillStyle = style.offColor;
        }

        // Draw segment with optional rounding
        if (style.rounded) {
            const radius = Math.min(segWidth, segHeight) / 4;
            ctx.beginPath();
            ctx.roundRect(x, y, segWidth, segHeight, radius);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, segWidth, segHeight);
        }

        // Add bevel effect for active segments
        if (isActive && style.bevel) {
            ctx.shadowBlur = 0;
            const gradient = ctx.createLinearGradient(x, y, x, y + segHeight / 3);
            gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            if (style.rounded) {
                const radius = Math.min(segWidth, segHeight) / 4;
                ctx.beginPath();
                ctx.roundRect(x, y, segWidth, segHeight, radius);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, segWidth, segHeight);
            }
        }

        ctx.restore();
    }

    // Draw peak hold indicator if enabled
    if (params.showPeakHold && activeSegments > 0) {
        const peakIndex = activeSegments - 1;
        const displayIndex = reverseOrder ? (segmentCount - 1 - peakIndex) : peakIndex;

        let peakX: number, peakY: number;
        if (isHorizontal) {
            peakX = startX + displayIndex * (segWidth + segGap);
            peakY = startY;
        } else {
            peakX = startX;
            peakY = startY - displayIndex * (segHeight + segGap);
        }

        ctx.save();
        ctx.fillStyle = params.peakColor;

        if (style.glowStrength > 0) {
            ctx.shadowColor = params.peakColor;
            ctx.shadowBlur = style.glowStrength * 1.5;
        }

        if (style.rounded) {
            const radius = Math.min(segWidth, segHeight) / 4;
            ctx.beginPath();
            ctx.roundRect(peakX, peakY, segWidth, segHeight, radius);
            ctx.fill();
        } else {
            ctx.fillRect(peakX, peakY, segWidth, segHeight);
        }
        ctx.restore();
    }
}

// ============================================================================
// Main Render Function
// ============================================================================

export function renderLcdGauge(
    ctx: CanvasRenderingContext2D,
    displayType: 'numeric' | 'text' | 'bar',
    value: number,
    text: string,
    width: number,
    height: number,
    numericParams: LcdNumericParams,
    textParams: LcdTextParams,
    barParams: LcdBarParams,
    style: LcdSegmentStyle,
    transparent: boolean,
    backgroundColor: string,
    padding: number,
    borderRadius: number,
    showBackground: boolean
): void {
    switch (displayType) {
        case 'numeric':
            renderNumericDisplay(ctx, value, width, height, numericParams, style, transparent, backgroundColor, padding, borderRadius, showBackground);
            break;
        case 'text':
            renderTextDisplay(ctx, text, width, height, textParams, style, transparent, backgroundColor, padding, borderRadius, showBackground);
            break;
        case 'bar':
            renderBarGraph(ctx, value, width, height, barParams, style, transparent, backgroundColor, padding, borderRadius, showBackground);
            break;
    }
}
