/**
 * Clock Rendering Utilities
 * Canvas 2D rendering functions for LCD, Flip, and Analog clocks
 */

import {
    LcdClockParams,
    FlipClockParams,
    AnalogClockParams,
    ClockHandParams,
} from '@/stores/clockFoundryStore';

// ============================================================================
// 7-Segment Display Rendering
// ============================================================================

// Segment layout for 7-segment display:
//   _0_
//  |   |
//  1   2
//  |_3_|
//  |   |
//  4   5
//  |_6_|

const DIGIT_SEGMENTS: Record<string, number[]> = {
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
    '-': [3],
    ' ': [],
};

interface SegmentPath {
    points: [number, number][];
}

function getSegmentPaths(
    x: number,
    y: number,
    width: number,
    height: number,
    segmentWidth: number,
    gap: number,
    _rounded: boolean  // Reserved for future rounded segment support
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

function drawSegment(
    ctx: CanvasRenderingContext2D,
    segment: SegmentPath,
    color: string,
    glowStrength: number,
    glowColor: string,
    bevel: boolean
): void {
    ctx.save();

    if (glowStrength > 0) {
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

    // Add bevel effect
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

export function drawLcdDigit(
    ctx: CanvasRenderingContext2D,
    digit: string,
    x: number,
    y: number,
    params: LcdClockParams
): void {
    const { digitWidth, digitHeight, segmentStyle } = params;
    const { onColor, offColor, glowStrength, glowColor, segmentWidth, segmentGap, bevel } = segmentStyle;

    const segments = getSegmentPaths(x, y, digitWidth, digitHeight, segmentWidth, segmentGap, segmentStyle.rounded);
    const activeSegments = DIGIT_SEGMENTS[digit] || [];

    // Apply skew if needed
    if (segmentStyle.skew !== 0) {
        ctx.save();
        ctx.transform(1, 0, Math.tan(segmentStyle.skew * Math.PI / 180), 1, 0, 0);
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

    if (segmentStyle.skew !== 0) {
        ctx.restore();
    }
}

export function drawLcdColon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    params: LcdClockParams,
    on: boolean = true
): void {
    const { digitHeight, segmentStyle } = params;
    const { onColor, offColor, glowStrength, glowColor, segmentWidth } = segmentStyle;

    const dotRadius = segmentWidth * 0.6;
    const spacing = digitHeight / 4;
    const color = on ? onColor : offColor;

    ctx.save();

    if (on && glowStrength > 0) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowStrength;
    }

    ctx.fillStyle = color;

    if (params.colonStyle === 'dots') {
        // Top dot
        ctx.beginPath();
        ctx.arc(x, y + spacing, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Bottom dot
        ctx.beginPath();
        ctx.arc(x, y + spacing * 3, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Bars style
        const barWidth = segmentWidth * 0.8;
        const barHeight = segmentWidth * 2;

        ctx.fillRect(x - barWidth / 2, y + spacing - barHeight / 2, barWidth, barHeight);
        ctx.fillRect(x - barWidth / 2, y + spacing * 3 - barHeight / 2, barWidth, barHeight);
    }

    ctx.restore();
}

export function renderLcdClock(
    ctx: CanvasRenderingContext2D,
    time: string,
    width: number,
    height: number,
    params: LcdClockParams,
    transparent: boolean
): void {
    ctx.clearRect(0, 0, width, height);

    // Draw background if needed
    if (!transparent && params.showBackground) {
        const padding = params.backgroundPadding;
        const radius = params.backgroundBorderRadius;

        ctx.fillStyle = params.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(padding / 2, padding / 2, width - padding, height - padding, radius);
        ctx.fill();
    }

    // Parse time string (e.g., "12:34:56" or "12:34")
    const digits = time.replace(/:/g, '').split('');
    const hasColons = params.showColons && time.includes(':');

    // Calculate total width
    const colonWidth = params.segmentStyle.segmentWidth * 2;
    const colonCount = hasColons ? (digits.length / 2 - 1) : 0;
    const totalWidth = digits.length * params.digitWidth +
        (digits.length - 1) * params.digitSpacing +
        colonCount * (colonWidth + params.digitSpacing * 2);

    // Center the display
    let startX = (width - totalWidth) / 2;
    const startY = (height - params.digitHeight) / 2;

    let digitIndex = 0;
    for (let i = 0; i < time.length; i++) {
        const char = time[i];

        if (char === ':') {
            if (hasColons) {
                startX += params.digitSpacing;
                drawLcdColon(ctx, startX + colonWidth / 2, startY, params, true);
                startX += colonWidth + params.digitSpacing;
            }
        } else {
            drawLcdDigit(ctx, char, startX, startY, params);
            startX += params.digitWidth + params.digitSpacing;
            digitIndex++;
        }
    }
}

// ============================================================================
// Flip Clock Rendering
// ============================================================================

/**
 * Draw a single flip card half (top or bottom)
 * @param flipProgress - 0 to 1, where 0.5 is halfway through flip
 * @param isFlipping - whether this card is currently flipping
 */
function drawFlipCardHalf(
    ctx: CanvasRenderingContext2D,
    digit: string,
    x: number,
    y: number,
    width: number,
    height: number,
    params: FlipClockParams,
    isTop: boolean,
    flipProgress: number = 0,
    isFlipping: boolean = false
): void {
    const { cardStyle, fontFamily, fontSize, fontWeight } = params;
    const halfHeight = height / 2;
    const cardY = isTop ? y : y + halfHeight + params.flipGap / 2;
    const cardHeight = halfHeight - params.flipGap / 2;

    ctx.save();

    // Apply 3D flip transform for flipping cards
    if (isFlipping && flipProgress > 0) {
        const centerY = y + height / 2;

        if (isTop) {
            // Top half flips down (0 to 0.5 progress)
            const angle = Math.min(flipProgress * 2, 1) * Math.PI / 2;
            const scaleY = Math.cos(angle);

            if (scaleY <= 0) {
                ctx.restore();
                return; // Card has flipped past 90 degrees, don't draw
            }

            ctx.translate(x + width / 2, centerY);
            ctx.scale(1, scaleY);
            ctx.translate(-(x + width / 2), -centerY);
        } else {
            // Bottom half flips up (0.5 to 1 progress)
            const adjustedProgress = Math.max(0, (flipProgress - 0.5) * 2);
            const angle = (1 - adjustedProgress) * Math.PI / 2;
            const scaleY = Math.cos(angle);

            if (scaleY <= 0) {
                ctx.restore();
                return;
            }

            ctx.translate(x + width / 2, centerY);
            ctx.scale(1, scaleY);
            ctx.translate(-(x + width / 2), -centerY);
        }
    }

    // Clip to half
    ctx.beginPath();
    if (isTop) {
        ctx.roundRect(x, cardY, width, cardHeight, [cardStyle.borderRadius, cardStyle.borderRadius, 0, 0]);
    } else {
        ctx.roundRect(x, cardY, width, cardHeight, [0, 0, cardStyle.borderRadius, cardStyle.borderRadius]);
    }
    ctx.clip();

    // Card background
    ctx.fillStyle = cardStyle.faceColor;
    ctx.fillRect(x, cardY, width, cardHeight);

    // Add shadow on bottom half
    if (!isTop && cardStyle.shadowIntensity > 0) {
        const gradient = ctx.createLinearGradient(x, cardY, x, cardY + cardHeight);
        gradient.addColorStop(0, `rgba(0,0,0,${cardStyle.shadowIntensity})`);
        gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, cardY, width, cardHeight);
    }

    // Glossy reflection on top half
    if (isTop && cardStyle.glossy) {
        const gradient = ctx.createLinearGradient(x, cardY, x, cardY + cardHeight);
        gradient.addColorStop(0, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, cardY, width, cardHeight);
    }

    // Draw digit
    ctx.fillStyle = cardStyle.textColor;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(digit, x + width / 2, y + height / 2);

    ctx.restore();

    // Draw border (only if not mid-flip)
    if (cardStyle.borderWidth > 0 && (!isFlipping || flipProgress === 0 || flipProgress === 1)) {
        ctx.strokeStyle = cardStyle.borderColor;
        ctx.lineWidth = cardStyle.borderWidth;
        ctx.beginPath();
        if (isTop) {
            ctx.roundRect(x, cardY, width, cardHeight, [cardStyle.borderRadius, cardStyle.borderRadius, 0, 0]);
        } else {
            ctx.roundRect(x, cardY, width, cardHeight, [0, 0, cardStyle.borderRadius, cardStyle.borderRadius]);
        }
        ctx.stroke();
    }
}

/**
 * Draw a flip digit with animation
 * @param currentDigit - The digit currently showing
 * @param nextDigit - The digit being flipped to
 * @param flipProgress - 0 to 1 animation progress
 */
function drawFlipDigitAnimated(
    ctx: CanvasRenderingContext2D,
    currentDigit: string,
    nextDigit: string,
    x: number,
    y: number,
    params: FlipClockParams,
    flipProgress: number
): void {
    const { digitWidth, digitHeight, cardStyle } = params;

    if (flipProgress === 0 || currentDigit === nextDigit) {
        // No flip, just draw static digit
        drawFlipCardHalf(ctx, currentDigit, x, y, digitWidth, digitHeight, params, true, 0, false);
        drawFlipCardHalf(ctx, currentDigit, x, y, digitWidth, digitHeight, params, false, 0, false);
    } else {
        // Animation in progress

        // Layer 1: New digit's bottom half (revealed as old flips down)
        drawFlipCardHalf(ctx, nextDigit, x, y, digitWidth, digitHeight, params, false, 0, false);

        // Layer 2: Old digit's top half (static, behind the flipping card)
        if (flipProgress < 0.5) {
            drawFlipCardHalf(ctx, currentDigit, x, y, digitWidth, digitHeight, params, true, 0, false);
        } else {
            // After halfway, show new digit's top
            drawFlipCardHalf(ctx, nextDigit, x, y, digitWidth, digitHeight, params, true, 0, false);
        }

        // Layer 3: The flipping card
        if (flipProgress < 0.5) {
            // First half: old digit's top flipping down
            drawFlipCardHalf(ctx, currentDigit, x, y, digitWidth, digitHeight, params, true, flipProgress, true);
        } else {
            // Second half: new digit's bottom flipping up into place
            drawFlipCardHalf(ctx, nextDigit, x, y, digitWidth, digitHeight, params, false, flipProgress, true);
        }
    }

    // Draw hinge line
    ctx.fillStyle = cardStyle.hingeColor;
    ctx.fillRect(x, y + digitHeight / 2 - params.flipGap / 2, digitWidth, params.flipGap);
}

/**
 * Render flip clock with animation support
 * @param animationFrame - Frame number within a second (0 to animationFrames-1)
 */
export function renderFlipClock(
    ctx: CanvasRenderingContext2D,
    time: string,
    width: number,
    height: number,
    params: FlipClockParams,
    transparent: boolean,
    prevTime?: string,
    animationFrame: number = 0
): void {
    ctx.clearRect(0, 0, width, height);

    // Draw background
    if (!transparent && params.showBackground) {
        ctx.fillStyle = params.backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }

    // Parse time strings
    const currentDigits = time.replace(/:/g, '').split('');
    const prevDigits = prevTime ? prevTime.replace(/:/g, '').split('') : currentDigits;
    const hasColons = params.showColons && time.includes(':');

    // Calculate flip progress (0 to 1 over animation frames)
    const flipProgress = params.animationFrames > 1 ? animationFrame / (params.animationFrames - 1) : 0;

    // Calculate total width
    const colonWidth = 20;
    const colonCount = hasColons ? Math.floor(currentDigits.length / 2) - 1 : 0;
    const totalWidth = currentDigits.length * params.digitWidth +
        (currentDigits.length - 1) * params.digitSpacing +
        colonCount * colonWidth;

    let startX = (width - totalWidth) / 2;
    const startY = (height - params.digitHeight) / 2;

    let digitIndex = 0;
    for (let i = 0; i < time.length; i++) {
        const char = time[i];

        if (char === ':') {
            if (hasColons) {
                // Draw colon dots
                const dotRadius = 4;
                ctx.fillStyle = params.cardStyle.textColor;
                ctx.beginPath();
                ctx.arc(startX + colonWidth / 2, startY + params.digitHeight * 0.3, dotRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(startX + colonWidth / 2, startY + params.digitHeight * 0.7, dotRadius, 0, Math.PI * 2);
                ctx.fill();
                startX += colonWidth;
            }
        } else {
            const prevDigit = prevDigits[digitIndex] || char;
            const isChanging = prevDigit !== char;

            drawFlipDigitAnimated(
                ctx,
                prevDigit,
                char,
                startX,
                startY,
                params,
                isChanging ? flipProgress : 0
            );

            startX += params.digitWidth + params.digitSpacing;
            digitIndex++;
        }
    }
}

// ============================================================================
// Analog Clock Rendering
// ============================================================================

function drawClockHand(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    angle: number, // in degrees, 0 = 12 o'clock
    params: ClockHandParams
): void {
    if (!params.enabled) return;

    // Apply per-hand offset (for eccentric/off-center designs)
    const handCenterX = centerX + params.offsetX;
    const handCenterY = centerY + params.offsetY;

    const radians = (angle - 90) * Math.PI / 180;
    const length = (params.length / 100) * radius;
    const tailLength = (params.tailLength / 100) * radius;

    const tipX = handCenterX + Math.cos(radians) * length;
    const tipY = handCenterY + Math.sin(radians) * length;
    const tailX = handCenterX - Math.cos(radians) * tailLength;
    const tailY = handCenterY - Math.sin(radians) * tailLength;

    ctx.save();

    // Draw shadow first
    if (params.shadowEnabled) {
        ctx.save();
        ctx.translate(params.shadowOffset, params.shadowOffset);
        ctx.strokeStyle = `rgba(0,0,0,${params.shadowOpacity})`;
        ctx.lineWidth = params.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.restore();
    }

    // Draw hand based on shape
    ctx.strokeStyle = params.color;
    ctx.fillStyle = params.color;
    ctx.lineWidth = params.width;
    ctx.lineCap = 'round';

    switch (params.shape) {
        case 'line':
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            break;

        case 'arrow':
            // Main line
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            // Arrow head
            const arrowSize = params.width * 2;
            const arrowAngle = Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(
                tipX - arrowSize * Math.cos(radians - arrowAngle),
                tipY - arrowSize * Math.sin(radians - arrowAngle)
            );
            ctx.lineTo(
                tipX - arrowSize * Math.cos(radians + arrowAngle),
                tipY - arrowSize * Math.sin(radians + arrowAngle)
            );
            ctx.closePath();
            ctx.fill();
            break;

        case 'sword':
            // Tapered shape
            const perpX = Math.cos(radians + Math.PI / 2);
            const perpY = Math.sin(radians + Math.PI / 2);
            const halfWidth = params.width / 2;
            const baseWidth = params.width * 1.5;

            ctx.beginPath();
            ctx.moveTo(tipX, tipY); // Tip
            ctx.lineTo(handCenterX + perpX * halfWidth, handCenterY + perpY * halfWidth);
            ctx.lineTo(tailX + perpX * baseWidth, tailY + perpY * baseWidth);
            ctx.lineTo(tailX - perpX * baseWidth, tailY - perpY * baseWidth);
            ctx.lineTo(handCenterX - perpX * halfWidth, handCenterY - perpY * halfWidth);
            ctx.closePath();
            ctx.fill();
            break;

        case 'spade':
        case 'diamond':
            // Diamond/spade shape
            const midLength = length * 0.7;
            const midX = handCenterX + Math.cos(radians) * midLength;
            const midY = handCenterY + Math.sin(radians) * midLength;
            const sideOffset = params.width * 1.5;

            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(midX + Math.cos(radians + Math.PI / 2) * sideOffset, midY + Math.sin(radians + Math.PI / 2) * sideOffset);
            ctx.lineTo(handCenterX, handCenterY);
            ctx.lineTo(midX + Math.cos(radians - Math.PI / 2) * sideOffset, midY + Math.sin(radians - Math.PI / 2) * sideOffset);
            ctx.closePath();
            ctx.fill();

            // Tail
            if (tailLength > 0) {
                ctx.beginPath();
                ctx.moveTo(handCenterX, handCenterY);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
            }
            break;
    }

    ctx.restore();
}

function drawTickMarks(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    params: AnalogClockParams
): void {
    if (!params.showTickMarks) return;

    // Apply tick offset
    const tickCenterX = centerX + (params.tickOffsetX || 0);
    const tickCenterY = centerY + (params.tickOffsetY || 0);

    ctx.save();
    ctx.strokeStyle = params.tickColor;

    // Minor ticks
    for (let i = 0; i < params.minorTickCount; i++) {
        const angle = (i / params.minorTickCount) * 360 - 90;
        const radians = angle * Math.PI / 180;

        const isMajor = i % (params.minorTickCount / params.majorTickCount) === 0;
        if (isMajor) continue; // Skip major tick positions

        const outerX = tickCenterX + Math.cos(radians) * radius;
        const outerY = tickCenterY + Math.sin(radians) * radius;
        const innerX = tickCenterX + Math.cos(radians) * (radius - params.minorTickLength);
        const innerY = tickCenterY + Math.sin(radians) * (radius - params.minorTickLength);

        ctx.lineWidth = params.minorTickWidth;
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
    }

    // Major ticks
    for (let i = 0; i < params.majorTickCount; i++) {
        const angle = (i / params.majorTickCount) * 360 - 90;
        const radians = angle * Math.PI / 180;

        const outerX = tickCenterX + Math.cos(radians) * radius;
        const outerY = tickCenterY + Math.sin(radians) * radius;
        const innerX = tickCenterX + Math.cos(radians) * (radius - params.majorTickLength);
        const innerY = tickCenterY + Math.sin(radians) * (radius - params.majorTickLength);

        ctx.lineWidth = params.majorTickWidth;
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
    }

    ctx.restore();
}

function drawNumerals(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    params: AnalogClockParams
): void {
    if (!params.showNumerals) return;

    // Apply numeral offset
    const numeralCenterX = centerX + (params.numeralOffsetX || 0);
    const numeralCenterY = centerY + (params.numeralOffsetY || 0);

    ctx.save();
    ctx.fillStyle = params.numeralColor;
    ctx.font = `${params.numeralSize}px ${params.numeralFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const numeralRadius = (params.numeralRadius / 100) * radius;
    const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * 360 - 90;
        const radians = angle * Math.PI / 180;

        const x = numeralCenterX + Math.cos(radians) * numeralRadius;
        const y = numeralCenterY + Math.sin(radians) * numeralRadius;

        let text = '';
        switch (params.numeralStyle) {
            case 'arabic':
                text = i === 0 ? '12' : String(i);
                break;
            case 'roman':
                text = romanNumerals[i];
                break;
            case 'dots':
                ctx.beginPath();
                ctx.arc(x, y, params.numeralSize / 4, 0, Math.PI * 2);
                ctx.fill();
                continue;
            case 'lines':
                // Already handled by tick marks
                continue;
        }

        ctx.fillText(text, x, y);
    }

    ctx.restore();
}

function drawHub(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    params: AnalogClockParams
): void {
    ctx.save();
    ctx.fillStyle = params.hubColor;

    switch (params.hubStyle) {
        case 'solid':
            ctx.beginPath();
            ctx.arc(centerX, centerY, params.hubRadius, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'ring':
            ctx.strokeStyle = params.hubColor;
            ctx.lineWidth = params.hubRadius / 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, params.hubRadius, 0, Math.PI * 2);
            ctx.stroke();
            break;

        case 'dot':
            ctx.beginPath();
            ctx.arc(centerX, centerY, params.hubRadius / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
    }

    ctx.restore();
}

export function renderAnalogClock(
    ctx: CanvasRenderingContext2D,
    hours: number,
    minutes: number,
    seconds: number,
    width: number,
    height: number,
    params: AnalogClockParams,
    transparent: boolean
): void {
    ctx.clearRect(0, 0, width, height);

    // Apply center offset for the entire clock face
    const centerX = width / 2 + (params.centerOffsetX || 0);
    const centerY = height / 2 + (params.centerOffsetY || 0);

    // Face radius as percentage of min dimension
    const maxRadius = Math.min(width, height) / 2 - 5;
    const faceRadius = (params.faceRadius || 90) / 100;
    const radius = maxRadius * faceRadius;

    // Tick radius as percentage of face radius
    const tickRadiusPct = (params.tickRadius || 95) / 100;
    const tickRadius = radius * tickRadiusPct;

    // Draw background
    if (!transparent && params.showBackground) {
        ctx.fillStyle = params.backgroundColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw tick marks (using tick radius for positioning)
    drawTickMarks(ctx, centerX, centerY, tickRadius, params);

    // Draw numerals
    drawNumerals(ctx, centerX, centerY, radius, params);

    // Calculate angles
    const secondAngle = (seconds / 60) * 360;
    const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
    const hourAngle = ((hours % 12 + minutes / 60) / 12) * 360;

    // Draw hands (order matters for layering)
    drawClockHand(ctx, centerX, centerY, radius, hourAngle, params.hourHand);
    drawClockHand(ctx, centerX, centerY, radius, minuteAngle, params.minuteHand);
    drawClockHand(ctx, centerX, centerY, radius, secondAngle, params.secondHand);

    // Draw center hub
    drawHub(ctx, centerX, centerY, params);
}

// ============================================================================
// Time Parsing Utilities
// ============================================================================

export function parseTimeString(timeStr: string): { hours: number; minutes: number; seconds: number } {
    const parts = timeStr.split(':').map(p => parseInt(p, 10) || 0);
    return {
        hours: parts[0] || 0,
        minutes: parts[1] || 0,
        seconds: parts[2] || 0,
    };
}

export function formatTime(hours: number, minutes: number, seconds: number, mode: 'time_12h' | 'time_24h' = 'time_24h'): string {
    const h = mode === 'time_12h' ? (hours % 12 || 12) : hours;
    const hStr = h.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
}
