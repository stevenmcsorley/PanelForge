/**
 * Foundry Store
 * State management for the Vector Gauge Foundry authoring tool
 *
 * This is AUTHORING-ONLY - vectors never appear in runtime panels.
 * Output is PNG frame sequences for ImageSequenceWidget.
 */

import { create } from 'zustand';

export type FoundryTemplate = 'led_arc' | 'needle' | 'composite';
export type FoundryTab = 'gauge' | 'background';
export type LayerType = 'background' | 'ticks' | 'labels' | 'leds' | 'needle';

export interface ColorSplit {
    threshold: number;          // Percentage threshold (0-100) where this split starts
    onColor: string;            // Color when segment is on in this range
    offColor: string;           // Color when segment is off in this range
}

// LED Effects for texture overlays and blending
export interface LedEffectsParams {
    // Texture overlays
    dustEnabled: boolean;
    dustIntensity: number;          // 0-1
    dustSeed: number;               // Random seed for consistent patterns

    bulbShapeEnabled: boolean;      // 3D rounded look
    bulbIntensity: number;          // 0-1

    glassOverlayEnabled: boolean;   // Reflections/highlights
    glassIntensity: number;         // 0-1
    glassAngle: number;             // Reflection angle

    // Blending effects
    insetShadowEnabled: boolean;    // Embedded/recessed look
    insetShadowDepth: number;       // Shadow depth in pixels
    insetShadowColor: string;

    segmentOpacity: number;         // Base opacity for all segments 0-1
}

export interface LedArcParams {
    arcStartAngle: number;      // Start angle in degrees (0 = right, counter-clockwise)
    arcEndAngle: number;        // End angle in degrees
    segmentCount: number;       // Number of LED segments
    segmentGap: number;         // Gap between segments in degrees
    innerRadius: number;        // Inner radius of arc
    outerRadius: number;        // Outer radius of arc
    offColor: string;           // Base color when segment is off
    onColor: string;            // Base color when segment is on
    glowStrength: number;       // Glow intensity (0-20)
    backgroundColor: string;    // Background color
    orientation: 'arc' | 'horizontal' | 'vertical';
    colorSplits: ColorSplit[];  // Optional color splits (empty = no splits)
    effects: LedEffectsParams;  // Texture and blending effects
}

export interface NeedleParams {
    needleLength: number;       // Length in px
    needleWidth: number;        // Width at base in px
    hubRadius: number;          // Center hub radius in px
    needleColor: string;        // Needle color (hex)
    hubColor: string;           // Hub color (hex)
    shadowOffset: number;       // Shadow offset in px
    shadowOpacity: number;      // Shadow opacity (0-1)
    pivotX: number;             // Pivot X normalized (0-1)
    pivotY: number;             // Pivot Y normalized (0-1)
    minAngle: number;           // Minimum angle (degrees)
    maxAngle: number;           // Maximum angle (degrees)
    backgroundColor: string;    // Background color (hex)
    orientation: 'arc' | 'horizontal' | 'vertical';
}

export interface BackgroundParams {
    src: string;
    opacity: number;
    scale: number;
    x: number;
    y: number;
    locked: boolean;
}

export interface TickParams {
    enabled: boolean;
    mode: 'arc' | 'horizontal' | 'vertical';
    startAngle: number;
    endAngle: number;
    majorCount: number;
    minorSteps: number;
    majorLength: number;
    minorLength: number;
    majorWidth: number;
    minorWidth: number;
    color: string;
    opacity: number;
    radius: number;
    offset: number;
}

export interface LabelParams {
    enabled: boolean;
    minValue: number;
    maxValue: number;
    step: number;
    fontSize: number;
    fontWeight: string;
    fontFamily: string;
    fontStyle: 'normal' | 'italic';
    letterSpacing: number;
    color: string;
    opacity: number;
    offset: number;
    upright: boolean;
    reversed: boolean;
    unit: string;
}

// Procedural texture generation for backgrounds
export type ProceduralTextureType = 'none' | 'carbon_fiber' | 'brushed_metal' | 'perforated' | 'leather' | 'wood_grain' | 'diamond_plate' | 'circuit_board';

export interface ProceduralTextureParams {
    type: ProceduralTextureType;
    scale: number;
    angle: number;
    primaryColor: string;
    secondaryColor: string;
    intensity: number;
}

export interface BackgroundEffectsParams {
    blur: number;
    noise: number;
    brightness: number;
    contrast: number;
    saturation: number;
}

export interface BackgroundFoundryParams {
    proceduralTexture: ProceduralTextureParams;
    imageEffects: BackgroundEffectsParams;
    overlayColor: string;
    overlayOpacity: number;
    overlayBlendMode: 'normal' | 'multiply' | 'overlay' | 'screen' | 'soft-light';
    generatedBackground: string;  // Base64 result
}

// Gauge encasing (rim, glass, screws)
export interface RimParams {
    enabled: boolean;
    width: number;
    color: string;
    metallic: boolean;
    bevelWidth: number;
    highlightColor: string;
    shadowColor: string;
    innerShadow: boolean;
    outerShadow: boolean;
    outerShadowBlur: number;
}

export interface GlassParams {
    enabled: boolean;
    reflectionIntensity: number;
    reflectionAngle: number;
    reflectionWidth: number;
    tint: string;
    tintOpacity: number;
    curvature: number;
}

export interface ScrewParams {
    enabled: boolean;
    count: 4 | 6 | 8;
    style: 'phillips' | 'hex' | 'slotted' | 'torx';
    size: number;
    color: string;
    inset: number;  // Distance from edge
}

export interface SealParams {
    enabled: boolean;
    width: number;
    color: string;
    texture: 'smooth' | 'ribbed';
}

export interface EncasingParams {
    rim: RimParams;
    glass: GlassParams;
    screws: ScrewParams;
    rubberSeal: SealParams;
}

// Export options for AIDA64
export interface ExportOptions {
    prefix: string;
    padding: number;
}

export interface FoundryState {
    // UI State
    isOpen: boolean;
    activeTab: FoundryTab;
    selectedTemplate: FoundryTemplate;
    previewValue: number;       // 0-100, for live preview

    // Editing existing widget
    editingWidgetId: string | null;  // If set, we're editing an existing widget

    // Output settings
    frameCount: number;
    outputWidth: number;
    outputHeight: number;
    useTransparentBackground: boolean;

    // Layer ordering
    layerOrder: LayerType[];

    // Template parameters
    ledArcParams: LedArcParams;
    needleParams: NeedleParams;
    backgroundParams: BackgroundParams;
    tickParams: TickParams;
    labelParams: LabelParams;

    // Background Foundry
    backgroundFoundryParams: BackgroundFoundryParams;

    // Encasing
    encasingParams: EncasingParams;

    // Export options
    exportOptions: ExportOptions;

    // Generated frames
    generatedFrames: string[];
    isGenerating: boolean;
    generationProgress: number;
    isExporting: boolean;
    exportProgress: number;

    // Actions
    openFoundry: () => void;
    openFoundryForWidget: (widgetId: string, width: number, height: number) => void;
    closeFoundry: () => void;
    setActiveTab: (tab: FoundryTab) => void;
    setTemplate: (template: FoundryTemplate) => void;
    setPreviewValue: (value: number) => void;
    setFrameCount: (count: number) => void;
    setOutputSize: (width: number, height: number) => void;
    setTransparentBackground: (enabled: boolean) => void;

    // Layer ordering
    moveLayerUp: (layer: LayerType) => void;
    moveLayerDown: (layer: LayerType) => void;
    resetLayerOrder: () => void;

    // Parameter updates
    updateLedArcParams: (params: Partial<LedArcParams>) => void;
    updateLedEffects: (params: Partial<LedEffectsParams>) => void;
    updateNeedleParams: (params: Partial<NeedleParams>) => void;
    updateBackgroundParams: (params: Partial<BackgroundParams>) => void;
    updateTickParams: (params: Partial<TickParams>) => void;
    updateLabelParams: (params: Partial<LabelParams>) => void;
    updateBackgroundFoundryParams: (params: Partial<BackgroundFoundryParams>) => void;
    updateProceduralTexture: (params: Partial<ProceduralTextureParams>) => void;
    updateBackgroundEffects: (params: Partial<BackgroundEffectsParams>) => void;
    updateEncasingParams: (params: Partial<EncasingParams>) => void;
    updateRimParams: (params: Partial<RimParams>) => void;
    updateGlassParams: (params: Partial<GlassParams>) => void;
    updateScrewParams: (params: Partial<ScrewParams>) => void;
    updateSealParams: (params: Partial<SealParams>) => void;
    updateExportOptions: (params: Partial<ExportOptions>) => void;

    // Frame generation
    setGeneratedFrames: (frames: string[]) => void;
    setGenerating: (isGenerating: boolean, progress?: number) => void;
    setExporting: (isExporting: boolean, progress?: number) => void;

    // Background foundry
    applyGeneratedBackground: () => void;

    resetToDefaults: () => void;
}

const DEFAULT_LED_EFFECTS: LedEffectsParams = {
    dustEnabled: false,
    dustIntensity: 0.3,
    dustSeed: 12345,
    bulbShapeEnabled: false,
    bulbIntensity: 0.5,
    glassOverlayEnabled: false,
    glassIntensity: 0.3,
    glassAngle: -30,
    insetShadowEnabled: false,
    insetShadowDepth: 3,
    insetShadowColor: '#000000',
    segmentOpacity: 1.0,
};

const DEFAULT_LED_ARC_PARAMS: LedArcParams = {
    arcStartAngle: 135,
    arcEndAngle: 405,
    segmentCount: 20,
    segmentGap: 2,
    innerRadius: 60,
    outerRadius: 90,
    offColor: '#1a3a1a',
    onColor: '#00ff44',
    glowStrength: 8,
    backgroundColor: '#0a0a0f',
    orientation: 'arc',
    colorSplits: [],
    effects: { ...DEFAULT_LED_EFFECTS },
};

const DEFAULT_NEEDLE_PARAMS: NeedleParams = {
    needleLength: 70,
    needleWidth: 6,
    hubRadius: 12,
    needleColor: '#ff3333',
    hubColor: '#333333',
    shadowOffset: 3,
    shadowOpacity: 0.4,
    pivotX: 0.5,
    pivotY: 0.5,
    minAngle: 135,
    maxAngle: 405,
    backgroundColor: '#0a0a0f',
    orientation: 'arc',
};

const DEFAULT_BACKGROUND_PARAMS: BackgroundParams = {
    src: '',
    opacity: 100,
    scale: 1,
    x: 0,
    y: 0,
    locked: false,
};

const DEFAULT_TICK_PARAMS: TickParams = {
    enabled: false,
    mode: 'arc',
    startAngle: 135,
    endAngle: 405,
    majorCount: 6,
    minorSteps: 4,
    majorLength: 15,
    minorLength: 8,
    majorWidth: 2,
    minorWidth: 1,
    color: '#ffffff',
    opacity: 1,
    radius: 80,
    offset: 0,
};

const DEFAULT_LABEL_PARAMS: LabelParams = {
    enabled: false,
    minValue: 0,
    maxValue: 100,
    step: 20,
    fontSize: 14,
    fontWeight: 'normal',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    letterSpacing: 0,
    color: '#ffffff',
    opacity: 1,
    offset: 20,
    upright: true,
    reversed: false,
    unit: '',
};

const DEFAULT_PROCEDURAL_TEXTURE: ProceduralTextureParams = {
    type: 'none',
    scale: 1,
    angle: 0,
    primaryColor: '#1a1a2a',
    secondaryColor: '#0a0a14',
    intensity: 1,
};

const DEFAULT_BACKGROUND_EFFECTS: BackgroundEffectsParams = {
    blur: 0,
    noise: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
};

const DEFAULT_BACKGROUND_FOUNDRY: BackgroundFoundryParams = {
    proceduralTexture: { ...DEFAULT_PROCEDURAL_TEXTURE },
    imageEffects: { ...DEFAULT_BACKGROUND_EFFECTS },
    overlayColor: '#000000',
    overlayOpacity: 0,
    overlayBlendMode: 'normal',
    generatedBackground: '',
};

const DEFAULT_RIM_PARAMS: RimParams = {
    enabled: false,
    width: 12,
    color: '#4a4a5a',
    metallic: true,
    bevelWidth: 3,
    highlightColor: '#8888aa',
    shadowColor: '#1a1a2a',
    innerShadow: true,
    outerShadow: true,
    outerShadowBlur: 8,
};

const DEFAULT_GLASS_PARAMS: GlassParams = {
    enabled: false,
    reflectionIntensity: 0.3,
    reflectionAngle: -45,
    reflectionWidth: 0.4,
    tint: '#ffffff',
    tintOpacity: 0.05,
    curvature: 0.3,
};

const DEFAULT_SCREW_PARAMS: ScrewParams = {
    enabled: false,
    count: 4,
    style: 'phillips',
    size: 8,
    color: '#3a3a4a',
    inset: 8,
};

const DEFAULT_SEAL_PARAMS: SealParams = {
    enabled: false,
    width: 4,
    color: '#1a1a1a',
    texture: 'smooth',
};

const DEFAULT_ENCASING: EncasingParams = {
    rim: { ...DEFAULT_RIM_PARAMS },
    glass: { ...DEFAULT_GLASS_PARAMS },
    screws: { ...DEFAULT_SCREW_PARAMS },
    rubberSeal: { ...DEFAULT_SEAL_PARAMS },
};

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
    prefix: 'frame',
    padding: 3,
};

const DEFAULT_LAYER_ORDER: LayerType[] = ['background', 'ticks', 'labels', 'leds', 'needle'];

export const useFoundryStore = create<FoundryState>((set) => ({
    // Initial state
    isOpen: false,
    activeTab: 'gauge',
    selectedTemplate: 'led_arc',
    previewValue: 65,

    editingWidgetId: null,

    frameCount: 32,
    outputWidth: 200,
    outputHeight: 200,
    useTransparentBackground: false,

    layerOrder: [...DEFAULT_LAYER_ORDER],

    ledArcParams: { ...DEFAULT_LED_ARC_PARAMS },
    needleParams: { ...DEFAULT_NEEDLE_PARAMS },
    backgroundParams: { ...DEFAULT_BACKGROUND_PARAMS },
    tickParams: { ...DEFAULT_TICK_PARAMS },
    labelParams: { ...DEFAULT_LABEL_PARAMS },
    backgroundFoundryParams: { ...DEFAULT_BACKGROUND_FOUNDRY },
    encasingParams: { ...DEFAULT_ENCASING },
    exportOptions: { ...DEFAULT_EXPORT_OPTIONS },

    generatedFrames: [],
    isGenerating: false,
    generationProgress: 0,
    isExporting: false,
    exportProgress: 0,

    // Actions
    openFoundry: () => set({ isOpen: true, editingWidgetId: null }),
    openFoundryForWidget: (widgetId, width, height) => set((state) => {
        // Calculate scale factor: new size relative to current output size
        const currentSize = Math.min(state.outputWidth, state.outputHeight);
        const newSize = Math.min(width, height);
        const scaleFactor = newSize / currentSize;

        // Scale LED Arc params (all size-related properties)
        const scaledLedArc: LedArcParams = {
            ...state.ledArcParams,
            innerRadius: Math.round(state.ledArcParams.innerRadius * scaleFactor),
            outerRadius: Math.round(state.ledArcParams.outerRadius * scaleFactor),
            segmentGap: Math.max(1, Math.round(state.ledArcParams.segmentGap * scaleFactor)),
            glowStrength: Math.max(1, Math.round(state.ledArcParams.glowStrength * scaleFactor)),
        };

        // Scale Needle params
        const scaledNeedle: NeedleParams = {
            ...state.needleParams,
            needleLength: Math.round(state.needleParams.needleLength * scaleFactor),
            needleWidth: Math.max(2, Math.round(state.needleParams.needleWidth * scaleFactor)),
            hubRadius: Math.round(state.needleParams.hubRadius * scaleFactor),
            shadowOffset: Math.round(state.needleParams.shadowOffset * scaleFactor),
        };

        // Scale Tick params
        const scaledTicks: TickParams = {
            ...state.tickParams,
            majorLength: Math.round(state.tickParams.majorLength * scaleFactor),
            minorLength: Math.round(state.tickParams.minorLength * scaleFactor),
            majorWidth: Math.max(1, Math.round(state.tickParams.majorWidth * scaleFactor)),
            minorWidth: Math.max(1, Math.round(state.tickParams.minorWidth * scaleFactor)),
            radius: Math.round(state.tickParams.radius * scaleFactor),
        };

        // Scale Label params
        const scaledLabels: LabelParams = {
            ...state.labelParams,
            fontSize: Math.max(8, Math.round(state.labelParams.fontSize * scaleFactor)),
            offset: Math.round(state.labelParams.offset * scaleFactor),
            letterSpacing: Math.round(state.labelParams.letterSpacing * scaleFactor),
        };

        // Scale Encasing params
        const scaledEncasing: EncasingParams = {
            ...state.encasingParams,
            rim: {
                ...state.encasingParams.rim,
                width: Math.max(2, Math.round(state.encasingParams.rim.width * scaleFactor)),
                bevelWidth: Math.max(0, Math.round(state.encasingParams.rim.bevelWidth * scaleFactor)),
            },
            glass: { ...state.encasingParams.glass },
            screws: {
                ...state.encasingParams.screws,
                size: Math.max(4, Math.round(state.encasingParams.screws.size * scaleFactor)),
                inset: Math.round(state.encasingParams.screws.inset * scaleFactor),
            },
            rubberSeal: {
                ...state.encasingParams.rubberSeal,
                width: Math.max(2, Math.round(state.encasingParams.rubberSeal.width * scaleFactor)),
            },
        };

        // Scale LED effects depth
        const scaledEffects: LedEffectsParams = {
            ...state.ledArcParams.effects,
            insetShadowDepth: Math.max(1, Math.round(state.ledArcParams.effects.insetShadowDepth * scaleFactor)),
        };
        scaledLedArc.effects = scaledEffects;

        return {
            isOpen: true,
            editingWidgetId: widgetId,
            outputWidth: Math.round(width),
            outputHeight: Math.round(height),
            generatedFrames: [],
            ledArcParams: scaledLedArc,
            needleParams: scaledNeedle,
            tickParams: scaledTicks,
            labelParams: scaledLabels,
            encasingParams: scaledEncasing,
        };
    }),
    closeFoundry: () => set({ isOpen: false, editingWidgetId: null, generatedFrames: [], isGenerating: false }),

    setActiveTab: (tab) => set({ activeTab: tab }),
    setTemplate: (template) => set({ selectedTemplate: template, generatedFrames: [] }),
    setPreviewValue: (value) => set({ previewValue: Math.max(0, Math.min(100, value)) }),

    setFrameCount: (count) => set({ frameCount: Math.max(2, Math.min(128, count)) }),
    setOutputSize: (width, height) => set({
        outputWidth: Math.max(50, Math.min(1024, width)),
        outputHeight: Math.max(50, Math.min(1024, height)),
    }),
    setTransparentBackground: (enabled) => set({ useTransparentBackground: enabled, generatedFrames: [] }),

    // Layer ordering
    moveLayerUp: (layer) => set((state) => {
        const order = [...state.layerOrder];
        const index = order.indexOf(layer);
        if (index > 0) {
            [order[index - 1], order[index]] = [order[index], order[index - 1]];
        }
        return { layerOrder: order };
    }),

    moveLayerDown: (layer) => set((state) => {
        const order = [...state.layerOrder];
        const index = order.indexOf(layer);
        if (index < order.length - 1) {
            [order[index], order[index + 1]] = [order[index + 1], order[index]];
        }
        return { layerOrder: order };
    }),

    resetLayerOrder: () => set({ layerOrder: [...DEFAULT_LAYER_ORDER] }),

    // Parameter updates
    updateLedArcParams: (params) => set((state) => ({
        ledArcParams: { ...state.ledArcParams, ...params },
    })),

    updateLedEffects: (params) => set((state) => ({
        ledArcParams: {
            ...state.ledArcParams,
            effects: { ...state.ledArcParams.effects, ...params },
        },
    })),

    updateNeedleParams: (params) => set((state) => ({
        needleParams: { ...state.needleParams, ...params },
    })),

    updateBackgroundParams: (params) => set((state) => ({
        backgroundParams: { ...state.backgroundParams, ...params },
    })),

    updateTickParams: (params) => set((state) => ({
        tickParams: { ...state.tickParams, ...params },
    })),

    updateLabelParams: (params) => set((state) => ({
        labelParams: { ...state.labelParams, ...params },
    })),

    updateBackgroundFoundryParams: (params) => set((state) => ({
        backgroundFoundryParams: { ...state.backgroundFoundryParams, ...params },
    })),

    updateProceduralTexture: (params) => set((state) => ({
        backgroundFoundryParams: {
            ...state.backgroundFoundryParams,
            proceduralTexture: { ...state.backgroundFoundryParams.proceduralTexture, ...params },
        },
    })),

    updateBackgroundEffects: (params) => set((state) => ({
        backgroundFoundryParams: {
            ...state.backgroundFoundryParams,
            imageEffects: { ...state.backgroundFoundryParams.imageEffects, ...params },
        },
    })),

    updateEncasingParams: (params) => set((state) => ({
        encasingParams: { ...state.encasingParams, ...params },
    })),

    updateRimParams: (params) => set((state) => ({
        encasingParams: {
            ...state.encasingParams,
            rim: { ...state.encasingParams.rim, ...params },
        },
    })),

    updateGlassParams: (params) => set((state) => ({
        encasingParams: {
            ...state.encasingParams,
            glass: { ...state.encasingParams.glass, ...params },
        },
    })),

    updateScrewParams: (params) => set((state) => ({
        encasingParams: {
            ...state.encasingParams,
            screws: { ...state.encasingParams.screws, ...params },
        },
    })),

    updateSealParams: (params) => set((state) => ({
        encasingParams: {
            ...state.encasingParams,
            rubberSeal: { ...state.encasingParams.rubberSeal, ...params },
        },
    })),

    updateExportOptions: (params) => set((state) => ({
        exportOptions: { ...state.exportOptions, ...params },
    })),

    setGeneratedFrames: (frames) => set({ generatedFrames: frames }),
    setGenerating: (isGenerating, progress = 0) => set({ isGenerating, generationProgress: progress }),
    setExporting: (isExporting, progress = 0) => set({ isExporting, exportProgress: progress }),

    applyGeneratedBackground: () => set((state) => ({
        backgroundParams: {
            ...state.backgroundParams,
            src: state.backgroundFoundryParams.generatedBackground,
        },
    })),

    resetToDefaults: () => set({
        selectedTemplate: 'composite',
        previewValue: 65,
        frameCount: 32,
        outputWidth: 256,
        outputHeight: 256,
        useTransparentBackground: true,
        layerOrder: [...DEFAULT_LAYER_ORDER],
        ledArcParams: {
            ...DEFAULT_LED_ARC_PARAMS,
            outerRadius: 100,
            innerRadius: 85,
            arcStartAngle: 150,
            arcEndAngle: 390,
            onColor: '#ff3300',
            offColor: '#330000',
            glowStrength: 10,
            orientation: 'arc',
            colorSplits: [],
            effects: { ...DEFAULT_LED_EFFECTS },
        },
        needleParams: {
            ...DEFAULT_NEEDLE_PARAMS,
            needleLength: 90,
            minAngle: 150,
            maxAngle: 390,
            needleColor: '#ffffff',
            hubRadius: 8,
            shadowOpacity: 0.6,
            orientation: 'arc',
        },
        tickParams: {
            enabled: true,
            mode: 'arc',
            startAngle: 150,
            endAngle: 390,
            majorCount: 11,
            minorSteps: 4,
            majorLength: 15,
            minorLength: 8,
            majorWidth: 2,
            minorWidth: 1,
            color: '#ffffff',
            opacity: 0.8,
            radius: 110,
            offset: 0,
        },
        labelParams: {
            enabled: true,
            minValue: 0,
            maxValue: 1000,
            step: 100,
            fontSize: 14,
            fontWeight: 'normal',
            fontFamily: 'Inter, sans-serif',
            fontStyle: 'normal',
            letterSpacing: 0,
            color: '#ffffff',
            opacity: 0.9,
            offset: 25,
            upright: true,
            reversed: false,
            unit: '',
        },
        backgroundParams: { ...DEFAULT_BACKGROUND_PARAMS },
        backgroundFoundryParams: { ...DEFAULT_BACKGROUND_FOUNDRY },
        encasingParams: { ...DEFAULT_ENCASING },
        exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
        generatedFrames: [],
        isGenerating: false,
        generationProgress: 0,
    }),
}));
