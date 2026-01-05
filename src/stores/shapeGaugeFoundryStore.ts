/**
 * Shape Gauge Foundry Store
 * State management for the Shape Gauge Foundry authoring tool
 *
 * Creates animated gauge widgets with modern styling:
 * - Horizontal/Vertical bars
 * - Circles, Donuts
 * - Semi-circles, Quarter-circles
 * - Custom arcs
 *
 * Supports pro features:
 * - Multi-stop gradients (linear, radial, sweep)
 * - Glow effects
 * - Glossy/metallic finishes
 * - Color zones based on value thresholds
 *
 * Output is PNG frame sequences for ImageSequenceWidget.
 */

import { create } from 'zustand';

// ============================================================================
// Shape Types
// ============================================================================

export type ShapeType =
    | 'horizontal_bar'
    | 'vertical_bar'
    | 'circle'
    | 'donut'
    | 'semi_circle_top'
    | 'semi_circle_bottom'
    | 'semi_circle_left'
    | 'semi_circle_right'
    | 'quarter_tl'
    | 'quarter_tr'
    | 'quarter_bl'
    | 'quarter_br'
    | 'custom_arc';

export type FillMode = 'smooth' | 'segmented' | 'chunky';

// ============================================================================
// Gradient Parameters
// ============================================================================

export interface GradientStop {
    position: number;       // 0-100%
    color: string;
}

export interface GradientParams {
    enabled: boolean;
    type: 'linear' | 'radial' | 'sweep';  // sweep = along the fill direction
    stops: GradientStop[];
    angle: number;          // For linear gradient (0-360)
}

// ============================================================================
// Effect Parameters
// ============================================================================

export interface GlowParams {
    enabled: boolean;
    color: string;
    strength: number;       // 0-30
    spread: number;         // 0-20
}

export interface EffectsParams {
    glossy: boolean;        // Adds highlight reflection
    metallic: boolean;      // Metallic sheen effect
    inset: boolean;         // Recessed/embossed look
}

// ============================================================================
// Color Zone Parameters
// ============================================================================

export interface ColorZone {
    threshold: number;      // 0-100 percentage
    color: string;
    glowColor?: string;
}

// ============================================================================
// Shape Parameters
// ============================================================================

export interface ShapeParams {
    // Shape
    shapeType: ShapeType;
    fillMode: FillMode;

    // Dimensions (scaled to output)
    thickness: number;      // Bar height or arc thickness (10-100)
    cornerRadius: number;   // For bars (0-50)

    // Arc-specific
    startAngle: number;     // 0-360
    endAngle: number;       // 0-360
    innerRadius: number;    // For donut (0-90% of outer)

    // Segmented mode
    segmentCount: number;   // 10-100
    segmentGap: number;     // 1-20px

    // Colors
    fillColor: string;
    backgroundColor: string;  // Track/unfilled color
    showBackground: boolean;

    // Gradient (Pro)
    gradient: GradientParams;

    // Glow (Pro)
    glow: GlowParams;

    // Effects (Pro)
    effects: EffectsParams;

    // Value zones (Pro)
    colorZones: ColorZone[];
    useColorZones: boolean;
}

// ============================================================================
// Scale Parameters
// ============================================================================

export interface ScaleParams {
    enabled: boolean;
    tickCount: number;
    tickLength: number;
    tickWidth: number;
    tickColor: string;
    showLabels: boolean;
    labelColor: string;
    labelSize: number;
    minLabel: string;
    maxLabel: string;
}

// ============================================================================
// Value Label Parameters
// ============================================================================

export interface ValueLabelParams {
    enabled: boolean;
    position: 'center' | 'below' | 'above' | 'inside' | 'outside';
    fontSize: number;
    fontFamily: string;
    fontColor: string;
    showUnit: boolean;
    unit: string;
    decimals: number;
}

// ============================================================================
// Shape Gauge Foundry State
// ============================================================================

export interface ShapeGaugeFoundryState {
    // UI State
    isOpen: boolean;
    editingWidgetId: string | null;  // Widget ID when regenerating
    previewValue: number;

    // Output settings
    outputWidth: number;
    outputHeight: number;
    frameCount: number;     // 32-128
    useTransparentBackground: boolean;

    // Shape params
    shapeParams: ShapeParams;

    // Scale/labels
    scaleParams: ScaleParams;
    valueLabelParams: ValueLabelParams;

    // Generated frames
    generatedFrames: string[];
    isGenerating: boolean;
    generationProgress: number;

    // Actions
    openShapeGaugeFoundry: () => void;
    openShapeGaugeFoundryForWidget: (widgetId: string, width: number, height: number, savedParams?: Record<string, unknown> | null) => void;
    closeShapeGaugeFoundry: () => void;
    setPreviewValue: (value: number) => void;
    setOutputSize: (width: number, height: number) => void;
    setFrameCount: (count: number) => void;
    setTransparentBackground: (enabled: boolean) => void;

    // Shape params updates
    updateShapeParams: (params: Partial<ShapeParams>) => void;
    updateGradient: (params: Partial<GradientParams>) => void;
    addGradientStop: (stop: GradientStop) => void;
    removeGradientStop: (index: number) => void;
    updateGradientStop: (index: number, stop: Partial<GradientStop>) => void;
    updateGlow: (params: Partial<GlowParams>) => void;
    updateEffects: (params: Partial<EffectsParams>) => void;
    addColorZone: (zone: ColorZone) => void;
    removeColorZone: (index: number) => void;
    updateColorZone: (index: number, zone: Partial<ColorZone>) => void;

    // Scale/label updates
    updateScaleParams: (params: Partial<ScaleParams>) => void;
    updateValueLabelParams: (params: Partial<ValueLabelParams>) => void;

    // Frame generation
    setGeneratedFrames: (frames: string[]) => void;
    setGenerating: (isGenerating: boolean, progress?: number) => void;

    resetToDefaults: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_GRADIENT: GradientParams = {
    enabled: false,
    type: 'linear',
    stops: [
        { position: 0, color: '#00aaff' },
        { position: 100, color: '#00ff88' },
    ],
    angle: 90,
};

const DEFAULT_GLOW: GlowParams = {
    enabled: true,
    color: '#00aaff',
    strength: 12,
    spread: 8,
};

const DEFAULT_EFFECTS: EffectsParams = {
    glossy: true,
    metallic: false,
    inset: false,
};

const DEFAULT_COLOR_ZONES: ColorZone[] = [
    { threshold: 70, color: '#00ff44' },
    { threshold: 90, color: '#ffff00' },
    { threshold: 100, color: '#ff0000' },
];

const DEFAULT_SHAPE_PARAMS: ShapeParams = {
    shapeType: 'horizontal_bar',
    fillMode: 'smooth',
    thickness: 30,
    cornerRadius: 8,
    startAngle: -135,
    endAngle: 135,
    innerRadius: 70,
    segmentCount: 20,
    segmentGap: 3,
    fillColor: '#00aaff',
    backgroundColor: '#1a2a3a',
    showBackground: true,
    gradient: { ...DEFAULT_GRADIENT },
    glow: { ...DEFAULT_GLOW },
    effects: { ...DEFAULT_EFFECTS },
    colorZones: [...DEFAULT_COLOR_ZONES],
    useColorZones: false,
};

const DEFAULT_SCALE_PARAMS: ScaleParams = {
    enabled: false,
    tickCount: 10,
    tickLength: 8,
    tickWidth: 2,
    tickColor: '#666666',
    showLabels: false,
    labelColor: '#888888',
    labelSize: 10,
    minLabel: '0',
    maxLabel: '100',
};

const DEFAULT_VALUE_LABEL_PARAMS: ValueLabelParams = {
    enabled: false,
    position: 'center',
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: '#ffffff',
    showUnit: true,
    unit: '%',
    decimals: 0,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useShapeGaugeFoundryStore = create<ShapeGaugeFoundryState>((set) => ({
    // Initial state
    isOpen: false,
    editingWidgetId: null,
    previewValue: 65,

    outputWidth: 256,
    outputHeight: 256,
    frameCount: 64,
    useTransparentBackground: true,

    shapeParams: { ...DEFAULT_SHAPE_PARAMS },
    scaleParams: { ...DEFAULT_SCALE_PARAMS },
    valueLabelParams: { ...DEFAULT_VALUE_LABEL_PARAMS },

    generatedFrames: [],
    isGenerating: false,
    generationProgress: 0,

    // Actions
    openShapeGaugeFoundry: () => set({ isOpen: true, editingWidgetId: null }),
    openShapeGaugeFoundryForWidget: (widgetId, width, height, savedParams) => set(() => {
        // If we have saved params from the widget, restore them exactly
        if (savedParams) {
            return {
                isOpen: true,
                editingWidgetId: widgetId,
                outputWidth: Math.round(width),
                outputHeight: Math.round(height),
                generatedFrames: [],
                frameCount: savedParams.frameCount as number || 64,
                useTransparentBackground: savedParams.useTransparentBackground as boolean ?? true,
                shapeParams: savedParams.shapeParams as ShapeParams || DEFAULT_SHAPE_PARAMS,
                scaleParams: savedParams.scaleParams as ScaleParams || DEFAULT_SCALE_PARAMS,
                valueLabelParams: savedParams.valueLabelParams as ValueLabelParams || DEFAULT_VALUE_LABEL_PARAMS,
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
    closeShapeGaugeFoundry: () => set({ isOpen: false, editingWidgetId: null, generatedFrames: [], isGenerating: false }),

    setPreviewValue: (previewValue) => set({ previewValue: Math.max(0, Math.min(100, previewValue)) }),

    setOutputSize: (width, height) => set({
        outputWidth: Math.max(64, Math.min(512, width)),
        outputHeight: Math.max(64, Math.min(512, height)),
    }),

    setFrameCount: (frameCount) => set({ frameCount: Math.max(16, Math.min(128, frameCount)) }),

    setTransparentBackground: (useTransparentBackground) => set({ useTransparentBackground, generatedFrames: [] }),

    // Shape params updates
    updateShapeParams: (params) => set((state) => ({
        shapeParams: { ...state.shapeParams, ...params },
    })),

    updateGradient: (params) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            gradient: { ...state.shapeParams.gradient, ...params },
        },
    })),

    addGradientStop: (stop) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            gradient: {
                ...state.shapeParams.gradient,
                stops: [...state.shapeParams.gradient.stops, stop].sort((a, b) => a.position - b.position),
            },
        },
    })),

    removeGradientStop: (index) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            gradient: {
                ...state.shapeParams.gradient,
                stops: state.shapeParams.gradient.stops.filter((_, i) => i !== index),
            },
        },
    })),

    updateGradientStop: (index, stop) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            gradient: {
                ...state.shapeParams.gradient,
                stops: state.shapeParams.gradient.stops.map((s, i) =>
                    i === index ? { ...s, ...stop } : s
                ).sort((a, b) => a.position - b.position),
            },
        },
    })),

    updateGlow: (params) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            glow: { ...state.shapeParams.glow, ...params },
        },
    })),

    updateEffects: (params) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            effects: { ...state.shapeParams.effects, ...params },
        },
    })),

    addColorZone: (zone) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            colorZones: [...state.shapeParams.colorZones, zone].sort((a, b) => a.threshold - b.threshold),
        },
    })),

    removeColorZone: (index) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            colorZones: state.shapeParams.colorZones.filter((_, i) => i !== index),
        },
    })),

    updateColorZone: (index, zone) => set((state) => ({
        shapeParams: {
            ...state.shapeParams,
            colorZones: state.shapeParams.colorZones.map((z, i) =>
                i === index ? { ...z, ...zone } : z
            ).sort((a, b) => a.threshold - b.threshold),
        },
    })),

    // Scale/label updates
    updateScaleParams: (params) => set((state) => ({
        scaleParams: { ...state.scaleParams, ...params },
    })),

    updateValueLabelParams: (params) => set((state) => ({
        valueLabelParams: { ...state.valueLabelParams, ...params },
    })),

    // Frame generation
    setGeneratedFrames: (frames) => set({ generatedFrames: frames }),
    setGenerating: (isGenerating, progress = 0) => set({ isGenerating, generationProgress: progress }),

    resetToDefaults: () => set({
        previewValue: 65,
        outputWidth: 256,
        outputHeight: 256,
        frameCount: 64,
        useTransparentBackground: true,
        shapeParams: { ...DEFAULT_SHAPE_PARAMS },
        scaleParams: { ...DEFAULT_SCALE_PARAMS },
        valueLabelParams: { ...DEFAULT_VALUE_LABEL_PARAMS },
        generatedFrames: [],
        isGenerating: false,
        generationProgress: 0,
    }),
}));
