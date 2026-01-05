/**
 * LCD Gauge Foundry Store
 * State management for the LCD Gauge Foundry authoring tool
 *
 * Creates LCD-style displays:
 * - Numeric: 7-segment digit displays for values (animated frames 0-99, 0-999, etc.)
 * - Text: LCD-style text labels (static single image)
 * - Bar: VU meter style segmented bar graphs (animated frames 0-100%)
 *
 * Numeric and Bar output PNG frame sequences for ImageSequenceWidget.
 * Text outputs a single static PNG image.
 */

import { create } from 'zustand';

export type LcdDisplayType = 'numeric' | 'text' | 'bar';

// ============================================================================
// LCD Segment Style
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

// ============================================================================
// Numeric Display Parameters
// ============================================================================

export interface LcdNumericParams {
    digitCount: number;          // 1-8
    showDecimal: boolean;
    decimalPlaces: number;       // 0-3
    showLeadingZeros: boolean;
    showSign: boolean;           // +/- prefix
    alignment: 'left' | 'center' | 'right';
    digitWidth: number;          // Width of each digit
    digitHeight: number;         // Height of each digit
    digitSpacing: number;        // Space between digits
    // Value range for frame generation
    minValue: number;            // Minimum value (e.g., 0)
    maxValue: number;            // Maximum value (e.g., 100)
}

// ============================================================================
// Text Display Parameters
// ============================================================================

export interface LcdTextParams {
    text: string;                // Max 12 chars
    uppercase: boolean;
    digitWidth: number;
    digitHeight: number;
    digitSpacing: number;
}

// ============================================================================
// Bar Graph Parameters
// ============================================================================

export interface ColorSplit {
    threshold: number;           // 0-100 percentage
    color: string;
}

export interface LcdBarParams {
    segmentCount: number;        // 10-50
    orientation: 'horizontal' | 'vertical';
    fillDirection: 'left_to_right' | 'right_to_left' | 'bottom_to_top' | 'top_to_bottom';
    showPeakHold: boolean;
    peakColor: string;
    colorSplits: ColorSplit[];   // Green/Yellow/Red zones
    segmentWidth: number;        // Width of each segment
    segmentHeight: number;       // Height of each segment
    segmentGap: number;          // Gap between segments
}

// ============================================================================
// LCD Gauge Foundry State
// ============================================================================

export interface LcdGaugeFoundryState {
    // UI State
    isOpen: boolean;
    editingWidgetId: string | null;  // Widget ID when regenerating
    displayType: LcdDisplayType;
    previewValue: number;        // 0-100 for preview

    // Output settings
    outputWidth: number;
    outputHeight: number;
    useTransparentBackground: boolean;
    backgroundColor: string;
    backgroundPadding: number;
    backgroundBorderRadius: number;
    showBackground: boolean;

    // Shared segment style
    segmentStyle: LcdSegmentStyle;

    // Type-specific params
    numericParams: LcdNumericParams;
    textParams: LcdTextParams;
    barParams: LcdBarParams;

    // Generated frames (for numeric/bar) or single image (for text)
    generatedFrames: string[];
    generatedImage: string | null;  // For text only (static)
    isGenerating: boolean;
    generationProgress: number;
    frameCount: number;             // Number of frames to generate

    // Actions
    openLcdGaugeFoundry: () => void;
    openLcdGaugeFoundryForWidget: (widgetId: string, width: number, height: number, savedParams?: Record<string, unknown> | null) => void;
    closeLcdGaugeFoundry: () => void;
    setDisplayType: (type: LcdDisplayType) => void;
    setPreviewValue: (value: number) => void;
    setOutputSize: (width: number, height: number) => void;
    setTransparentBackground: (enabled: boolean) => void;
    setBackgroundColor: (color: string) => void;
    setBackgroundPadding: (padding: number) => void;
    setBackgroundBorderRadius: (radius: number) => void;
    setShowBackground: (show: boolean) => void;

    // Segment style updates
    updateSegmentStyle: (params: Partial<LcdSegmentStyle>) => void;

    // Numeric params updates
    updateNumericParams: (params: Partial<LcdNumericParams>) => void;

    // Text params updates
    updateTextParams: (params: Partial<LcdTextParams>) => void;

    // Bar params updates
    updateBarParams: (params: Partial<LcdBarParams>) => void;
    addColorSplit: (split: ColorSplit) => void;
    removeColorSplit: (index: number) => void;
    updateColorSplit: (index: number, split: Partial<ColorSplit>) => void;

    // Generation
    setGeneratedFrames: (frames: string[]) => void;
    setGeneratedImage: (image: string | null) => void;
    setGenerating: (isGenerating: boolean, progress?: number) => void;
    setFrameCount: (count: number) => void;

    resetToDefaults: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SEGMENT_STYLE: LcdSegmentStyle = {
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

const DEFAULT_NUMERIC_PARAMS: LcdNumericParams = {
    digitCount: 4,
    showDecimal: true,
    decimalPlaces: 1,
    showLeadingZeros: false,
    showSign: false,
    alignment: 'right',
    digitWidth: 40,
    digitHeight: 70,
    digitSpacing: 8,
    minValue: 0,
    maxValue: 100,
};

const DEFAULT_TEXT_PARAMS: LcdTextParams = {
    text: 'CPU',
    uppercase: true,
    digitWidth: 35,
    digitHeight: 60,
    digitSpacing: 6,
};

const DEFAULT_BAR_PARAMS: LcdBarParams = {
    segmentCount: 20,
    orientation: 'horizontal',
    fillDirection: 'left_to_right',
    showPeakHold: false,
    peakColor: '#ff0000',
    colorSplits: [
        { threshold: 70, color: '#00ff44' },   // Green up to 70%
        { threshold: 90, color: '#ffff00' },   // Yellow 70-90%
        { threshold: 100, color: '#ff0000' },  // Red 90-100%
    ],
    segmentWidth: 12,
    segmentHeight: 30,
    segmentGap: 3,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useLcdGaugeFoundryStore = create<LcdGaugeFoundryState>((set) => ({
    // Initial state
    isOpen: false,
    editingWidgetId: null,
    displayType: 'numeric',
    previewValue: 75,

    outputWidth: 200,
    outputHeight: 80,
    useTransparentBackground: true,
    backgroundColor: '#0a0a0f',
    backgroundPadding: 12,
    backgroundBorderRadius: 4,
    showBackground: true,

    segmentStyle: { ...DEFAULT_SEGMENT_STYLE },
    numericParams: { ...DEFAULT_NUMERIC_PARAMS },
    textParams: { ...DEFAULT_TEXT_PARAMS },
    barParams: { ...DEFAULT_BAR_PARAMS },

    generatedFrames: [],
    generatedImage: null,
    isGenerating: false,
    generationProgress: 0,
    frameCount: 101,  // 0-100 for percentage-based displays

    // Actions
    openLcdGaugeFoundry: () => set({ isOpen: true, editingWidgetId: null }),
    openLcdGaugeFoundryForWidget: (widgetId, width, height, savedParams) => set(() => {
        // If we have saved params from the widget, restore them exactly
        if (savedParams) {
            return {
                isOpen: true,
                editingWidgetId: widgetId,
                outputWidth: Math.round(width),
                outputHeight: Math.round(height),
                generatedFrames: [],
                generatedImage: null,
                displayType: savedParams.displayType as LcdDisplayType || 'numeric',
                frameCount: savedParams.frameCount as number || 101,
                useTransparentBackground: savedParams.useTransparentBackground as boolean ?? true,
                backgroundColor: savedParams.backgroundColor as string || '#0a0a0f',
                backgroundPadding: savedParams.backgroundPadding as number || 12,
                backgroundBorderRadius: savedParams.backgroundBorderRadius as number || 4,
                showBackground: savedParams.showBackground as boolean ?? true,
                segmentStyle: savedParams.segmentStyle as LcdSegmentStyle || DEFAULT_SEGMENT_STYLE,
                numericParams: savedParams.numericParams as LcdNumericParams || DEFAULT_NUMERIC_PARAMS,
                textParams: savedParams.textParams as LcdTextParams || DEFAULT_TEXT_PARAMS,
                barParams: savedParams.barParams as LcdBarParams || DEFAULT_BAR_PARAMS,
            };
        }

        // No saved params - just open with current size (legacy behavior)
        return {
            isOpen: true,
            editingWidgetId: widgetId,
            outputWidth: Math.round(width),
            outputHeight: Math.round(height),
            generatedFrames: [],
            generatedImage: null,
        };
    }),
    closeLcdGaugeFoundry: () => set({ isOpen: false, editingWidgetId: null, generatedFrames: [], generatedImage: null, isGenerating: false }),

    setDisplayType: (displayType) => set((state) => {
        // Adjust output size based on display type
        let width = state.outputWidth;
        let height = state.outputHeight;

        if (displayType === 'numeric') {
            width = 200;
            height = 80;
        } else if (displayType === 'text') {
            width = 150;
            height = 70;
        } else if (displayType === 'bar') {
            width = state.barParams.orientation === 'horizontal' ? 300 : 60;
            height = state.barParams.orientation === 'horizontal' ? 50 : 200;
        }

        return {
            displayType,
            generatedFrames: [],
            generatedImage: null,
            outputWidth: width,
            outputHeight: height,
        };
    }),

    setPreviewValue: (previewValue) => set({ previewValue: Math.max(0, Math.min(100, previewValue)) }),

    setOutputSize: (width, height) => set({
        outputWidth: Math.max(50, Math.min(1024, width)),
        outputHeight: Math.max(50, Math.min(1024, height)),
    }),

    setTransparentBackground: (useTransparentBackground) => set({ useTransparentBackground, generatedFrames: [], generatedImage: null }),
    setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
    setBackgroundPadding: (backgroundPadding) => set({ backgroundPadding: Math.max(0, Math.min(50, backgroundPadding)) }),
    setBackgroundBorderRadius: (backgroundBorderRadius) => set({ backgroundBorderRadius: Math.max(0, Math.min(50, backgroundBorderRadius)) }),
    setShowBackground: (showBackground) => set({ showBackground }),

    // Segment style updates
    updateSegmentStyle: (params) => set((state) => ({
        segmentStyle: { ...state.segmentStyle, ...params },
    })),

    // Numeric params updates
    updateNumericParams: (params) => set((state) => ({
        numericParams: { ...state.numericParams, ...params },
    })),

    // Text params updates
    updateTextParams: (params) => set((state) => ({
        textParams: { ...state.textParams, ...params },
    })),

    // Bar params updates
    updateBarParams: (params) => set((state) => ({
        barParams: { ...state.barParams, ...params },
    })),

    addColorSplit: (split) => set((state) => ({
        barParams: {
            ...state.barParams,
            colorSplits: [...state.barParams.colorSplits, split].sort((a, b) => a.threshold - b.threshold),
        },
    })),

    removeColorSplit: (index) => set((state) => ({
        barParams: {
            ...state.barParams,
            colorSplits: state.barParams.colorSplits.filter((_, i) => i !== index),
        },
    })),

    updateColorSplit: (index, split) => set((state) => ({
        barParams: {
            ...state.barParams,
            colorSplits: state.barParams.colorSplits.map((s, i) =>
                i === index ? { ...s, ...split } : s
            ).sort((a, b) => a.threshold - b.threshold),
        },
    })),

    // Generation
    setGeneratedFrames: (generatedFrames) => set({ generatedFrames }),
    setGeneratedImage: (generatedImage) => set({ generatedImage }),
    setGenerating: (isGenerating, progress = 0) => set({ isGenerating, generationProgress: progress }),
    setFrameCount: (frameCount) => set({ frameCount: Math.max(2, Math.min(1000, frameCount)) }),

    resetToDefaults: () => set({
        displayType: 'numeric',
        previewValue: 75,
        outputWidth: 200,
        outputHeight: 80,
        useTransparentBackground: true,
        backgroundColor: '#0a0a0f',
        backgroundPadding: 12,
        backgroundBorderRadius: 4,
        showBackground: true,
        segmentStyle: { ...DEFAULT_SEGMENT_STYLE },
        numericParams: { ...DEFAULT_NUMERIC_PARAMS },
        textParams: { ...DEFAULT_TEXT_PARAMS },
        barParams: { ...DEFAULT_BAR_PARAMS },
        generatedFrames: [],
        generatedImage: null,
        isGenerating: false,
        generationProgress: 0,
        frameCount: 101,
    }),
}));
