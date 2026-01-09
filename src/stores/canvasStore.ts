/**
 * Canvas Store
 * Manages canvas state: resolution, background, grid settings, AIDA64 mode
 */

import { create } from 'zustand';
import {
  CanvasResolution,
  SUPPORTED_RESOLUTIONS,
  AIDA64Settings,
  DEFAULT_AIDA64_SETTINGS,
} from '@/types';

// CSS/Canvas blend modes - 'normal' maps to 'source-over' in Canvas API
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light';

// Map our BlendMode to Canvas globalCompositeOperation values
export const blendModeToComposite: Record<BlendMode, string> = {
  'normal': 'source-over',
  'multiply': 'multiply',
  'screen': 'screen',
  'overlay': 'overlay',
  'darken': 'darken',
  'lighten': 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
};

interface CanvasState {
  // Canvas properties
  resolution: CanvasResolution;
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundImageOpacity: number;
  backgroundImageBlendMode: BlendMode;

  // Grid overlay
  showGrid: boolean;
  gridSize: number;
  showSafeArea: boolean;
  safeAreaMargin: number;

  // Viewport (for panning/zooming the editor view)
  zoom: number;
  panX: number;
  panY: number;

  // AIDA64 Compatibility Mode
  aida64Settings: AIDA64Settings;

  // Actions
  setResolution: (resolution: CanvasResolution) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundImageOpacity: (opacity: number) => void;
  setBackgroundImageBlendMode: (blendMode: BlendMode) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSafeArea: () => void;
  setSafeAreaMargin: (margin: number) => void;

  // Viewport Actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;

  // AIDA64 actions
  setAIDA64Settings: (settings: Partial<AIDA64Settings>) => void;
  toggleAIDA64CompatibilityMode: () => void;
  togglePixelPerfect: () => void;
  toggleDeprecationWarnings: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // Initial state
  resolution: SUPPORTED_RESOLUTIONS[0], // 800x480 default
  backgroundColor: '#1a1a1a',
  backgroundImage: null,
  backgroundImageOpacity: 1,
  backgroundImageBlendMode: 'normal' as BlendMode,

  showGrid: false,
  gridSize: 10,
  showSafeArea: false,
  safeAreaMargin: 20,

  zoom: 1,
  panX: 0,
  panY: 0,

  aida64Settings: { ...DEFAULT_AIDA64_SETTINGS },

  // Actions
  setResolution: (resolution) => set({
    resolution,
    // Reset zoom to 1 and pan to 0 when changing resolution
    zoom: 1,
    panX: 0,
    panY: 0,
  }),

  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),

  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),

  setBackgroundImageOpacity: (backgroundImageOpacity) => set({ backgroundImageOpacity }),

  setBackgroundImageBlendMode: (backgroundImageBlendMode) => set({ backgroundImageBlendMode }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  setGridSize: (gridSize) => set({ gridSize }),

  toggleSafeArea: () => set((state) => ({ showSafeArea: !state.showSafeArea })),
  setSafeAreaMargin: (safeAreaMargin) => set({ safeAreaMargin }),

  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 0.25), 4) }),

  setPan: (panX, panY) => set({ panX, panY }),

  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),

  // AIDA64 actions
  setAIDA64Settings: (settings) =>
    set((state) => ({
      aida64Settings: { ...state.aida64Settings, ...settings },
    })),

  toggleAIDA64CompatibilityMode: () =>
    set((state) => ({
      aida64Settings: {
        ...state.aida64Settings,
        compatibilityMode: !state.aida64Settings.compatibilityMode,
      },
    })),

  togglePixelPerfect: () =>
    set((state) => ({
      aida64Settings: {
        ...state.aida64Settings,
        pixelPerfect: !state.aida64Settings.pixelPerfect,
      },
    })),

  toggleDeprecationWarnings: () =>
    set((state) => ({
      aida64Settings: {
        ...state.aida64Settings,
        showDeprecationWarnings: !state.aida64Settings.showDeprecationWarnings,
      },
    })),
}));
