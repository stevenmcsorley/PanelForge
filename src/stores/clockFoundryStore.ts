/**
 * Clock Foundry Store
 * State management for the Clock Foundry authoring tool
 *
 * Supports three clock types:
 * - LCD: 7-segment digital display
 * - Flip: Split-flap mechanical display
 * - Analog: Traditional clock hands
 *
 * Output is PNG frame sequences for ImageSequenceWidget.
 */

import { create } from 'zustand';

export type ClockTemplate = 'lcd' | 'flip' | 'analog';
export type ClockDisplayMode = 'time_12h' | 'time_24h' | 'date' | 'countdown' | 'stopwatch';
export type ClockTimeUnit = 'hours' | 'minutes' | 'seconds';
export type ClockHourFormat = '12h' | '24h';

// ============================================================================
// LCD Clock Parameters (7-segment display)
// ============================================================================

export interface LcdSegmentStyle {
    onColor: string;
    offColor: string;
    glowStrength: number;
    glowColor: string;
    segmentWidth: number;        // Width of each segment bar
    segmentGap: number;          // Gap between segments
    skew: number;                // Italicize angle (-30 to 30)
    bevel: boolean;              // 3D beveled look
    rounded: boolean;            // Rounded segment ends
}

export interface LcdClockParams {
    digitCount: number;          // 2, 4, or 6 digits
    showColons: boolean;         // Show : separator
    colonStyle: 'dots' | 'bars'; // Colon appearance
    digitWidth: number;          // Width of each digit
    digitHeight: number;         // Height of each digit
    digitSpacing: number;        // Space between digits
    segmentStyle: LcdSegmentStyle;
    backgroundColor: string;
    showBackground: boolean;
    backgroundPadding: number;
    backgroundBorderRadius: number;
}

// ============================================================================
// Flip Clock Parameters (Split-flap display)
// ============================================================================

export interface FlipCardStyle {
    faceColor: string;           // Card background
    textColor: string;           // Digit color
    hingeColor: string;          // Center hinge line
    shadowIntensity: number;     // Shadow on bottom half
    borderRadius: number;
    borderColor: string;
    borderWidth: number;
    glossy: boolean;             // Glossy reflection
}

export interface FlipClockParams {
    digitCount: number;          // 2, 4, or 6 digits
    showColons: boolean;
    digitWidth: number;
    digitHeight: number;
    digitSpacing: number;
    flipGap: number;             // Gap at flip hinge
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    cardStyle: FlipCardStyle;
    backgroundColor: string;
    showBackground: boolean;
    animationFrames: number;     // Frames per flip animation
}

// ============================================================================
// Analog Clock Parameters
// ============================================================================

export interface ClockHandParams {
    enabled: boolean;
    length: number;              // As percentage of radius (0-100)
    width: number;               // Width in pixels
    color: string;
    tailLength: number;          // Counter-balance tail (0-30)
    shape: 'line' | 'arrow' | 'sword' | 'spade' | 'diamond';
    shadowEnabled: boolean;
    shadowOffset: number;
    shadowOpacity: number;
    // Per-hand offset from center (for eccentric/off-center designs)
    offsetX: number;
    offsetY: number;
}

export interface AnalogClockParams {
    hourHand: ClockHandParams;
    minuteHand: ClockHandParams;
    secondHand: ClockHandParams;
    // Center offset (moves entire clock face)
    centerOffsetX: number;
    centerOffsetY: number;
    // Clock face radius (as percentage of min dimension)
    faceRadius: number;
    // Hub
    hubRadius: number;           // Center hub size
    hubColor: string;
    hubStyle: 'solid' | 'ring' | 'dot';
    // Tick marks
    showTickMarks: boolean;
    majorTickCount: number;      // Usually 12
    minorTickCount: number;      // Usually 60
    majorTickLength: number;
    minorTickLength: number;
    majorTickWidth: number;
    minorTickWidth: number;
    tickColor: string;
    tickRadius: number;          // Distance from center for outer edge of ticks (0-100)
    tickOffsetX: number;         // X offset for tick marks
    tickOffsetY: number;         // Y offset for tick marks
    // Numerals
    showNumerals: boolean;
    numeralStyle: 'arabic' | 'roman' | 'dots' | 'lines';
    numeralFont: string;
    numeralSize: number;
    numeralColor: string;
    numeralRadius: number;       // Distance from center (0-100)
    numeralOffsetX: number;      // X offset for numerals
    numeralOffsetY: number;      // Y offset for numerals
    // Background
    backgroundColor: string;
    showBackground: boolean;
}

// ============================================================================
// Clock Foundry State
// ============================================================================

export interface ClockFoundryState {
    // UI State
    isOpen: boolean;
    editingWidgetId: string | null;  // Widget ID when regenerating
    selectedTemplate: ClockTemplate;
    displayMode: ClockDisplayMode;
    previewTime: string;         // HH:MM:SS format for preview
    timeUnit: ClockTimeUnit;     // For digital clocks: what time unit to generate
    hourFormat: ClockHourFormat; // 12h or 24h format for hours
    generateAsBundle: boolean;   // Generate HH:MM:SS as a bundle with colons

    // Output settings
    frameCount: number;
    outputWidth: number;
    outputHeight: number;
    useTransparentBackground: boolean;

    // Template parameters
    lcdParams: LcdClockParams;
    flipParams: FlipClockParams;
    analogParams: AnalogClockParams;

    // Generated frames
    generatedFrames: string[];
    isGenerating: boolean;
    generationProgress: number;

    // Actions
    openClockFoundry: () => void;
    openClockFoundryForWidget: (widgetId: string, width: number, height: number, savedParams?: Record<string, unknown> | null) => void;
    closeClockFoundry: () => void;
    setTemplate: (template: ClockTemplate) => void;
    setDisplayMode: (mode: ClockDisplayMode) => void;
    setPreviewTime: (time: string) => void;
    setTimeUnit: (unit: ClockTimeUnit) => void;
    setHourFormat: (format: ClockHourFormat) => void;
    setGenerateAsBundle: (bundle: boolean) => void;
    setFrameCount: (count: number) => void;
    setOutputSize: (width: number, height: number) => void;
    setTransparentBackground: (enabled: boolean) => void;

    // Parameter updates
    updateLcdParams: (params: Partial<LcdClockParams>) => void;
    updateLcdSegmentStyle: (params: Partial<LcdSegmentStyle>) => void;
    updateFlipParams: (params: Partial<FlipClockParams>) => void;
    updateFlipCardStyle: (params: Partial<FlipCardStyle>) => void;
    updateAnalogParams: (params: Partial<AnalogClockParams>) => void;
    updateHourHand: (params: Partial<ClockHandParams>) => void;
    updateMinuteHand: (params: Partial<ClockHandParams>) => void;
    updateSecondHand: (params: Partial<ClockHandParams>) => void;

    // Frame generation
    setGeneratedFrames: (frames: string[]) => void;
    setGenerating: (isGenerating: boolean, progress?: number) => void;

    resetToDefaults: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_LCD_SEGMENT_STYLE: LcdSegmentStyle = {
    onColor: '#00ff44',
    offColor: '#0a1a0a',
    glowStrength: 8,
    glowColor: '#00ff44',
    segmentWidth: 8,
    segmentGap: 2,
    skew: 0,
    bevel: true,
    rounded: true,
};

const DEFAULT_LCD_PARAMS: LcdClockParams = {
    digitCount: 4,
    showColons: true,
    colonStyle: 'dots',
    digitWidth: 40,
    digitHeight: 70,
    digitSpacing: 8,
    segmentStyle: { ...DEFAULT_LCD_SEGMENT_STYLE },
    backgroundColor: '#0a0a0f',
    showBackground: true,
    backgroundPadding: 12,
    backgroundBorderRadius: 4,
};

const DEFAULT_FLIP_CARD_STYLE: FlipCardStyle = {
    faceColor: '#1a1a1a',
    textColor: '#ffffff',
    hingeColor: '#0a0a0a',
    shadowIntensity: 0.3,
    borderRadius: 4,
    borderColor: '#333333',
    borderWidth: 1,
    glossy: true,
};

const DEFAULT_FLIP_PARAMS: FlipClockParams = {
    digitCount: 4,
    showColons: true,
    digitWidth: 50,
    digitHeight: 80,
    digitSpacing: 6,
    flipGap: 3,
    fontFamily: 'Arial Black',
    fontSize: 56,
    fontWeight: 'bold',
    cardStyle: { ...DEFAULT_FLIP_CARD_STYLE },
    backgroundColor: '#0a0a0f',
    showBackground: false,
    animationFrames: 8,
};

const DEFAULT_HOUR_HAND: ClockHandParams = {
    enabled: true,
    length: 50,
    width: 8,
    color: '#cccccc',
    tailLength: 10,
    shape: 'arrow',
    shadowEnabled: true,
    shadowOffset: 3,
    shadowOpacity: 0.4,
    offsetX: 0,
    offsetY: 0,
};

const DEFAULT_MINUTE_HAND: ClockHandParams = {
    enabled: true,
    length: 70,
    width: 6,
    color: '#ffffff',
    tailLength: 8,
    shape: 'arrow',
    shadowEnabled: true,
    shadowOffset: 2,
    shadowOpacity: 0.4,
    offsetX: 0,
    offsetY: 0,
};

const DEFAULT_SECOND_HAND: ClockHandParams = {
    enabled: true,
    length: 80,
    width: 2,
    color: '#ff3333',
    tailLength: 15,
    shape: 'line',
    shadowEnabled: true,
    shadowOffset: 1,
    shadowOpacity: 0.3,
    offsetX: 0,
    offsetY: 0,
};

const DEFAULT_ANALOG_PARAMS: AnalogClockParams = {
    hourHand: { ...DEFAULT_HOUR_HAND },
    minuteHand: { ...DEFAULT_MINUTE_HAND },
    secondHand: { ...DEFAULT_SECOND_HAND },
    // Center offset (moves entire clock face)
    centerOffsetX: 0,
    centerOffsetY: 0,
    // Clock face radius (as percentage of min dimension)
    faceRadius: 90,
    // Hub
    hubRadius: 8,
    hubColor: '#ff3333',
    hubStyle: 'solid',
    // Tick marks
    showTickMarks: true,
    majorTickCount: 12,
    minorTickCount: 60,
    majorTickLength: 12,
    minorTickLength: 6,
    majorTickWidth: 3,
    minorTickWidth: 1,
    tickColor: '#ffffff',
    tickRadius: 95,          // Distance from center for outer edge of ticks (0-100)
    tickOffsetX: 0,
    tickOffsetY: 0,
    // Numerals
    showNumerals: false,
    numeralStyle: 'arabic',
    numeralFont: 'Arial',
    numeralSize: 16,
    numeralColor: '#ffffff',
    numeralRadius: 80,
    numeralOffsetX: 0,
    numeralOffsetY: 0,
    backgroundColor: '#0a0a0f',
    showBackground: false,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useClockFoundryStore = create<ClockFoundryState>((set) => ({
    // Initial state
    isOpen: false,
    editingWidgetId: null,
    selectedTemplate: 'lcd',
    displayMode: 'time_24h',
    previewTime: '12:34:56',
    timeUnit: 'seconds',
    hourFormat: '24h',
    generateAsBundle: false,

    frameCount: 60,              // 60 frames for seconds
    outputWidth: 300,
    outputHeight: 100,
    useTransparentBackground: true,

    lcdParams: { ...DEFAULT_LCD_PARAMS },
    flipParams: { ...DEFAULT_FLIP_PARAMS },
    analogParams: { ...DEFAULT_ANALOG_PARAMS },

    generatedFrames: [],
    isGenerating: false,
    generationProgress: 0,

    // Actions
    openClockFoundry: () => set({ isOpen: true, editingWidgetId: null }),
    openClockFoundryForWidget: (widgetId, width, height, savedParams) => set(() => {
        // If we have saved params from the widget, restore them exactly
        if (savedParams) {
            return {
                isOpen: true,
                editingWidgetId: widgetId,
                outputWidth: Math.round(width),
                outputHeight: Math.round(height),
                generatedFrames: [],
                selectedTemplate: savedParams.selectedTemplate as ClockTemplate || 'lcd',
                timeUnit: savedParams.timeUnit as ClockTimeUnit || 'seconds',
                hourFormat: savedParams.hourFormat as ClockHourFormat || '24h',
                useTransparentBackground: savedParams.useTransparentBackground as boolean ?? true,
                lcdParams: savedParams.lcdParams as LcdClockParams || DEFAULT_LCD_PARAMS,
                flipParams: savedParams.flipParams as FlipClockParams || DEFAULT_FLIP_PARAMS,
                analogParams: savedParams.analogParams as AnalogClockParams || DEFAULT_ANALOG_PARAMS,
            };
        }

        // No saved params - just open with current size (legacy behavior)
        return {
            isOpen: true,
            editingWidgetId: widgetId,
            outputWidth: Math.round(width),
            outputHeight: Math.round(height),
            generatedFrames: [],
        };
    }),
    closeClockFoundry: () => set({ isOpen: false, editingWidgetId: null, generatedFrames: [], isGenerating: false }),

    setTemplate: (template) => set((state) => {
        // Adjust output size based on template
        let width = state.outputWidth;
        let height = state.outputHeight;

        if (template === 'analog') {
            width = 200;
            height = 200;
        } else if (template === 'lcd' || template === 'flip') {
            width = 300;
            height = 100;
        }

        return {
            selectedTemplate: template,
            generatedFrames: [],
            outputWidth: width,
            outputHeight: height,
        };
    }),

    setDisplayMode: (mode) => set({ displayMode: mode }),
    setPreviewTime: (time) => set({ previewTime: time }),
    setTimeUnit: (unit) => set({ timeUnit: unit, generatedFrames: [] }),
    setHourFormat: (format) => set({ hourFormat: format, generatedFrames: [] }),
    setGenerateAsBundle: (bundle) => set({ generateAsBundle: bundle, generatedFrames: [] }),

    setFrameCount: (count) => set({ frameCount: Math.max(2, Math.min(3600, count)) }),
    setOutputSize: (width, height) => set({
        outputWidth: Math.max(50, Math.min(1024, width)),
        outputHeight: Math.max(50, Math.min(1024, height)),
    }),
    setTransparentBackground: (enabled) => set({ useTransparentBackground: enabled, generatedFrames: [] }),

    // LCD updates
    updateLcdParams: (params) => set((state) => ({
        lcdParams: { ...state.lcdParams, ...params },
    })),
    updateLcdSegmentStyle: (params) => set((state) => ({
        lcdParams: {
            ...state.lcdParams,
            segmentStyle: { ...state.lcdParams.segmentStyle, ...params },
        },
    })),

    // Flip updates
    updateFlipParams: (params) => set((state) => ({
        flipParams: { ...state.flipParams, ...params },
    })),
    updateFlipCardStyle: (params) => set((state) => ({
        flipParams: {
            ...state.flipParams,
            cardStyle: { ...state.flipParams.cardStyle, ...params },
        },
    })),

    // Analog updates
    updateAnalogParams: (params) => set((state) => ({
        analogParams: { ...state.analogParams, ...params },
    })),
    updateHourHand: (params) => set((state) => ({
        analogParams: {
            ...state.analogParams,
            hourHand: { ...state.analogParams.hourHand, ...params },
        },
    })),
    updateMinuteHand: (params) => set((state) => ({
        analogParams: {
            ...state.analogParams,
            minuteHand: { ...state.analogParams.minuteHand, ...params },
        },
    })),
    updateSecondHand: (params) => set((state) => ({
        analogParams: {
            ...state.analogParams,
            secondHand: { ...state.analogParams.secondHand, ...params },
        },
    })),

    setGeneratedFrames: (frames) => set({ generatedFrames: frames }),
    setGenerating: (isGenerating, progress = 0) => set({ isGenerating, generationProgress: progress }),

    resetToDefaults: () => set({
        selectedTemplate: 'lcd',
        displayMode: 'time_24h',
        previewTime: '12:34:56',
        timeUnit: 'seconds',
        hourFormat: '24h',
        generateAsBundle: false,
        frameCount: 60,
        outputWidth: 300,
        outputHeight: 100,
        useTransparentBackground: true,
        lcdParams: { ...DEFAULT_LCD_PARAMS },
        flipParams: { ...DEFAULT_FLIP_PARAMS },
        analogParams: { ...DEFAULT_ANALOG_PARAMS },
        generatedFrames: [],
        isGenerating: false,
        generationProgress: 0,
    }),
}));
