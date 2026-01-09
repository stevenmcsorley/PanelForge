import { create } from 'zustand';

export type StaticShapeType = 'rectangle' | 'circle' | 'line';

export interface InnerShadowParams {
    enabled: boolean;
    color: string;
    opacity: number;    // 0-100
    angle: number;      // 0-360 degrees
    distance: number;   // 0-50 (range)
    blur: number;       // 0-50 (size)
    spread: number;     // 0-20
}

export interface StaticShapeParams {
    shapeType: StaticShapeType;
    width: number;
    height: number;
    cornerRadius: number;   // For rectangle
    lineThickness: number;  // For line

    fillColor: string;
    fillOpacity: number;    // 0-100

    strokeEnabled: boolean;
    strokeColor: string;
    strokeWidth: number;
    strokeOpacity: number;  // 0-100

    shadowEnabled: boolean;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    shadowOpacity: number;  // 0-100

    innerShadow: InnerShadowParams;
}

export interface StaticShapeFoundryState {
    isOpen: boolean;
    editingWidgetId: string | null;

    // Output settings
    outputWidth: number;
    outputHeight: number;

    params: StaticShapeParams;

    // Actions
    openStaticShapeFoundry: () => void;
    loadForEdit: (widgetId: string, params: StaticShapeParams) => void;
    closeStaticShapeFoundry: () => void;

    updateParams: (params: Partial<StaticShapeParams>) => void;
    setOutputSize: (width: number, height: number) => void;
    resetToDefaults: () => void;
}

const DEFAULT_PARAMS: StaticShapeParams = {
    shapeType: 'rectangle',
    width: 200,
    height: 100,
    cornerRadius: 10,
    lineThickness: 2,

    fillColor: '#334455',
    fillOpacity: 100,

    strokeEnabled: true,
    strokeColor: '#667788',
    strokeWidth: 2,
    strokeOpacity: 100,

    shadowEnabled: true,
    shadowColor: '#000000',
    shadowBlur: 10,
    shadowOffsetX: 4,
    shadowOffsetY: 4,
    shadowOpacity: 50,

    innerShadow: {
        enabled: false,
        color: '#000000',
        opacity: 50,
        angle: 135,      // Top-left light source
        distance: 4,
        blur: 8,
        spread: 0,
    },
};

export const useStaticShapeFoundryStore = create<StaticShapeFoundryState>((set) => ({
    isOpen: false,
    editingWidgetId: null,
    outputWidth: 256,
    outputHeight: 256,
    params: { ...DEFAULT_PARAMS },

    openStaticShapeFoundry: () => set({
        isOpen: true,
        editingWidgetId: null,
        params: { ...DEFAULT_PARAMS }
    }),
    loadForEdit: (widgetId, params) => set({
        isOpen: true,
        editingWidgetId: widgetId,
        params: { ...params }
    }),
    closeStaticShapeFoundry: () => set({ isOpen: false, editingWidgetId: null }),

    updateParams: (params) => set((state) => ({
        params: { ...state.params, ...params }
    })),

    setOutputSize: (width, height) => set({ outputWidth: width, outputHeight: height }),

    resetToDefaults: () => set({
        params: { ...DEFAULT_PARAMS },
        editingWidgetId: null,
        outputWidth: 256,
        outputHeight: 256
    }),
}));
