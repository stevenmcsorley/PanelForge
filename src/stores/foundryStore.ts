/**
 * Foundry Store
 * State management for the Vector Gauge Foundry authoring tool
 * 
 * This is AUTHORING-ONLY - vectors never appear in runtime panels.
 * Output is PNG frame sequences for ImageSequenceWidget.
 */

import { create } from 'zustand';

export type FoundryTemplate = 'led_arc' | 'reactor_dial';

export interface LedArcParams {
    arcStartAngle: number;      // Start angle in degrees (0 = right, counter-clockwise)
    arcEndAngle: number;        // End angle in degrees
    segmentCount: number;       // Number of LED segments
    segmentGap: number;         // Gap between segments in degrees
    innerRadius: number;        // Inner radius of arc
    outerRadius: number;        // Outer radius of arc
    offColor: string;           // Color when segment is off
    onColor: string;            // Color when segment is on
    glowStrength: number;       // Glow intensity (0-20)
    backgroundColor: string;    // Background color
}

export interface FoundryState {
    // UI State
    isOpen: boolean;
    selectedTemplate: FoundryTemplate;
    previewValue: number;       // 0-100, for live preview

    // Output settings
    frameCount: number;
    outputWidth: number;
    outputHeight: number;

    // Template parameters
    ledArcParams: LedArcParams;

    // Generated frames
    generatedFrames: string[];
    isGenerating: boolean;
    generationProgress: number;

    // Actions
    openFoundry: () => void;
    closeFoundry: () => void;
    setTemplate: (template: FoundryTemplate) => void;
    setPreviewValue: (value: number) => void;
    setFrameCount: (count: number) => void;
    setOutputSize: (width: number, height: number) => void;
    updateLedArcParams: (params: Partial<LedArcParams>) => void;
    setGeneratedFrames: (frames: string[]) => void;
    setGenerating: (isGenerating: boolean, progress?: number) => void;
    resetToDefaults: () => void;
}

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
};

export const useFoundryStore = create<FoundryState>((set) => ({
    // Initial state
    isOpen: false,
    selectedTemplate: 'led_arc',
    previewValue: 65,

    frameCount: 32,
    outputWidth: 200,
    outputHeight: 200,

    ledArcParams: { ...DEFAULT_LED_ARC_PARAMS },

    generatedFrames: [],
    isGenerating: false,
    generationProgress: 0,

    // Actions
    openFoundry: () => set({ isOpen: true }),
    closeFoundry: () => set({ isOpen: false, generatedFrames: [], isGenerating: false }),

    setTemplate: (template) => set({ selectedTemplate: template }),
    setPreviewValue: (value) => set({ previewValue: Math.max(0, Math.min(100, value)) }),

    setFrameCount: (count) => set({ frameCount: Math.max(2, Math.min(128, count)) }),
    setOutputSize: (width, height) => set({
        outputWidth: Math.max(50, Math.min(1024, width)),
        outputHeight: Math.max(50, Math.min(1024, height)),
    }),

    updateLedArcParams: (params) => set((state) => ({
        ledArcParams: { ...state.ledArcParams, ...params },
    })),

    setGeneratedFrames: (frames) => set({ generatedFrames: frames }),
    setGenerating: (isGenerating, progress = 0) => set({ isGenerating, generationProgress: progress }),

    resetToDefaults: () => set({
        ledArcParams: { ...DEFAULT_LED_ARC_PARAMS },
        previewValue: 65,
        frameCount: 32,
        outputWidth: 200,
        outputHeight: 200,
        generatedFrames: [],
    }),
}));
