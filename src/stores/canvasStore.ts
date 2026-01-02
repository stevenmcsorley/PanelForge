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

interface CanvasState {
  // Canvas properties
  resolution: CanvasResolution;
  backgroundColor: string;
  backgroundImage: string | null;

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
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSafeArea: () => void;
  setSafeAreaMargin: (margin: number) => void;
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

  showGrid: false,
  gridSize: 10,
  showSafeArea: false,
  safeAreaMargin: 20,

  zoom: 1,
  panX: 0,
  panY: 0,

  aida64Settings: { ...DEFAULT_AIDA64_SETTINGS },

  // Actions
  setResolution: (resolution) => set({ resolution }),

  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),

  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),

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
