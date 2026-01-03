/**
 * Font definitions for the Gauge Foundry
 * Canvas-safe fonts with fallbacks
 */

export interface FontOption {
    value: string;
    label: string;
}

export interface FontWeightOption {
    value: string;
    label: string;
}

// Web-safe fonts that work reliably in Canvas
export const AVAILABLE_FONTS: FontOption[] = [
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Tahoma, sans-serif', label: 'Tahoma' },
    { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Palatino, serif', label: 'Palatino' },
    { value: 'Courier New, monospace', label: 'Courier New' },
    { value: 'Consolas, monospace', label: 'Consolas' },
    { value: 'Monaco, monospace', label: 'Monaco' },
    { value: 'Lucida Console, monospace', label: 'Lucida Console' },
    { value: 'Impact, sans-serif', label: 'Impact' },
    { value: 'Comic Sans MS, cursive', label: 'Comic Sans' },
];

// Numeric font weights
export const FONT_WEIGHTS: FontWeightOption[] = [
    { value: '100', label: 'Thin (100)' },
    { value: '200', label: 'Extra Light (200)' },
    { value: '300', label: 'Light (300)' },
    { value: 'normal', label: 'Normal (400)' },
    { value: '500', label: 'Medium (500)' },
    { value: '600', label: 'Semi Bold (600)' },
    { value: 'bold', label: 'Bold (700)' },
    { value: '800', label: 'Extra Bold (800)' },
    { value: '900', label: 'Black (900)' },
];

// Font styles
export const FONT_STYLES = [
    { value: 'normal', label: 'Normal' },
    { value: 'italic', label: 'Italic' },
];
