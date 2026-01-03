/**
 * PanelBackgroundFoundry
 * Standalone modal for creating procedural backgrounds for the main panel
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useCanvasStore } from '@/stores';
import { Input, Slider, Button } from '@/components/ui';
import { generateProceduralTexture, TEXTURE_OPTIONS } from './proceduralTextures';
import { applyBackgroundEffects, applyColorOverlay } from './imageFilters';
import { ProceduralTextureParams, BackgroundEffectsParams } from '@/stores/foundryStore';

interface PanelBackgroundFoundryProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_TEXTURE: ProceduralTextureParams = {
    type: 'carbon_fiber',
    scale: 1,
    angle: 0,
    primaryColor: '#1a1a2a',
    secondaryColor: '#0a0a14',
    intensity: 1,
};

const DEFAULT_EFFECTS: BackgroundEffectsParams = {
    blur: 0,
    noise: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
};

export const PanelBackgroundFoundry: React.FC<PanelBackgroundFoundryProps> = ({
    isOpen,
    onClose,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { resolution, setBackgroundImage } = useCanvasStore();

    // Local state for texture params
    const [proceduralTexture, setProceduralTexture] = useState<ProceduralTextureParams>(DEFAULT_TEXTURE);
    const [imageEffects, setImageEffects] = useState<BackgroundEffectsParams>(DEFAULT_EFFECTS);
    const [overlayColor, setOverlayColor] = useState('#000000');
    const [overlayOpacity, setOverlayOpacity] = useState(0);
    const [overlayBlendMode, setOverlayBlendMode] = useState<string>('normal');

    const updateTexture = (updates: Partial<ProceduralTextureParams>) => {
        setProceduralTexture((prev) => ({ ...prev, ...updates }));
    };

    const updateEffects = (updates: Partial<BackgroundEffectsParams>) => {
        setImageEffects((prev) => ({ ...prev, ...updates }));
    };

    // Generate preview
    const generatePreview = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Generate procedural texture
        generateProceduralTexture(ctx, canvas.width, canvas.height, proceduralTexture);

        // Apply effects
        applyBackgroundEffects(ctx, canvas.width, canvas.height, imageEffects);

        // Apply overlay
        if (overlayOpacity > 0) {
            applyColorOverlay(
                ctx,
                canvas.width,
                canvas.height,
                overlayColor,
                overlayOpacity / 100,
                overlayBlendMode as GlobalCompositeOperation
            );
        }
    }, [proceduralTexture, imageEffects, overlayColor, overlayOpacity, overlayBlendMode]);

    useEffect(() => {
        if (isOpen) {
            generatePreview();
        }
    }, [generatePreview, isOpen]);

    // Update canvas size when resolution changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && isOpen) {
            canvas.width = resolution.width;
            canvas.height = resolution.height;
            generatePreview();
        }
    }, [resolution.width, resolution.height, generatePreview, isOpen]);

    // Apply to panel background
    const handleApplyToPanel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        setBackgroundImage(dataUrl);
        onClose();
    }, [setBackgroundImage, onClose]);

    // Export as PNG
    const handleExport = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `panel-background-${resolution.width}x${resolution.height}.png`;
        link.href = dataUrl;
        link.click();
    }, [resolution]);

    // Reset to defaults
    const handleReset = () => {
        setProceduralTexture(DEFAULT_TEXTURE);
        setImageEffects(DEFAULT_EFFECTS);
        setOverlayColor('#000000');
        setOverlayOpacity(0);
        setOverlayBlendMode('normal');
    };

    if (!isOpen) return null;

    // Calculate preview scale to fit in container
    const maxPreviewSize = 400;
    const previewScale = Math.min(
        maxPreviewSize / resolution.width,
        maxPreviewSize / resolution.height,
        1
    );

    return (
        <div className="foundry-overlay">
            <div className="foundry-modal" style={{ maxWidth: '1100px', width: '95vw' }}>
                {/* Header */}
                <div className="foundry-header">
                    <div className="foundry-title">
                        <span className="foundry-icon">🎨</span>
                        Panel Background Foundry
                    </div>
                    <div className="foundry-subtitle" style={{ marginLeft: 'auto' }}>
                        Create procedural backgrounds for your panel
                    </div>
                    <button className="foundry-close" onClick={onClose}>✕</button>
                </div>

                <div className="foundry-content" style={{ flexDirection: 'row' }}>
                    {/* Left: Preview */}
                    <div className="foundry-preview-section" style={{ minWidth: '320px' }}>
                        <div className="foundry-section-title">Background Preview</div>
                        <div
                            className="foundry-canvas-container"
                            style={{
                                background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '300px',
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                width={resolution.width}
                                height={resolution.height}
                                style={{
                                    width: resolution.width * previewScale,
                                    height: resolution.height * previewScale,
                                    border: '1px solid #444',
                                }}
                            />
                        </div>

                        <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                            Output: {resolution.width} x {resolution.height} px
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                            <Button variant="primary" onClick={handleApplyToPanel} fullWidth>
                                Apply to Panel
                            </Button>
                            <Button variant="secondary" onClick={handleExport}>
                                Export PNG
                            </Button>
                        </div>
                    </div>

                    {/* Middle: Texture Controls */}
                    <div className="foundry-params-section" style={{ overflowY: 'auto', maxHeight: '72vh' }}>
                        <div className="foundry-section-title">Procedural Texture</div>

                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Texture Type</div>
                            <select
                                value={proceduralTexture.type}
                                onChange={(e) => updateTexture({ type: e.target.value as any })}
                                style={{
                                    width: '100%',
                                    background: '#1a1a2a',
                                    color: '#fff',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    fontSize: '12px',
                                }}
                            >
                                {TEXTURE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            <div style={{ marginTop: '12px' }}>
                                <div className="foundry-param-row">
                                    <Input
                                        label="Primary Color"
                                        type="color"
                                        value={proceduralTexture.primaryColor}
                                        onChange={(v) => updateTexture({ primaryColor: v })}
                                    />
                                    <Input
                                        label="Secondary Color"
                                        type="color"
                                        value={proceduralTexture.secondaryColor}
                                        onChange={(v) => updateTexture({ secondaryColor: v })}
                                    />
                                </div>

                                <Slider
                                    label={`Scale: ${proceduralTexture.scale.toFixed(1)}`}
                                    value={proceduralTexture.scale}
                                    onChange={(v) => updateTexture({ scale: v })}
                                    min={0.5}
                                    max={3}
                                    step={0.1}
                                />

                                <Slider
                                    label={`Angle: ${proceduralTexture.angle}°`}
                                    value={proceduralTexture.angle}
                                    onChange={(v) => updateTexture({ angle: v })}
                                    min={0}
                                    max={360}
                                />

                                <Slider
                                    label={`Intensity: ${Math.round(proceduralTexture.intensity * 100)}%`}
                                    value={proceduralTexture.intensity}
                                    onChange={(v) => updateTexture({ intensity: v })}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                            </div>
                        </div>

                        {/* Image Effects */}
                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Image Effects</div>

                            <Slider
                                label={`Blur: ${imageEffects.blur}px`}
                                value={imageEffects.blur}
                                onChange={(v) => updateEffects({ blur: v })}
                                min={0}
                                max={20}
                            />

                            <Slider
                                label={`Noise: ${Math.round(imageEffects.noise * 100)}%`}
                                value={imageEffects.noise}
                                onChange={(v) => updateEffects({ noise: v })}
                                min={0}
                                max={1}
                                step={0.05}
                            />

                            <Slider
                                label={`Brightness: ${imageEffects.brightness}%`}
                                value={imageEffects.brightness}
                                onChange={(v) => updateEffects({ brightness: v })}
                                min={0}
                                max={200}
                            />

                            <Slider
                                label={`Contrast: ${imageEffects.contrast}%`}
                                value={imageEffects.contrast}
                                onChange={(v) => updateEffects({ contrast: v })}
                                min={0}
                                max={200}
                            />

                            <Slider
                                label={`Saturation: ${imageEffects.saturation}%`}
                                value={imageEffects.saturation}
                                onChange={(v) => updateEffects({ saturation: v })}
                                min={0}
                                max={200}
                            />
                        </div>

                        {/* Color Overlay */}
                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Color Overlay</div>

                            <div className="foundry-param-row">
                                <Input
                                    label="Color"
                                    type="color"
                                    value={overlayColor}
                                    onChange={setOverlayColor}
                                />
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                                        Blend Mode
                                    </label>
                                    <select
                                        value={overlayBlendMode}
                                        onChange={(e) => setOverlayBlendMode(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: '#1a1a2a',
                                            color: '#fff',
                                            border: '1px solid #333',
                                            borderRadius: '4px',
                                            padding: '4px',
                                            fontSize: '11px',
                                        }}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="multiply">Multiply</option>
                                        <option value="screen">Screen</option>
                                        <option value="overlay">Overlay</option>
                                        <option value="soft-light">Soft Light</option>
                                    </select>
                                </div>
                            </div>

                            <Slider
                                label={`Opacity: ${overlayOpacity}%`}
                                value={overlayOpacity}
                                onChange={setOverlayOpacity}
                                min={0}
                                max={100}
                            />
                        </div>

                        <Button variant="secondary" onClick={handleReset} fullWidth>
                            Reset to Defaults
                        </Button>
                    </div>

                    {/* Right: Info & Presets */}
                    <div className="foundry-output-section">
                        <div className="foundry-section-title">Quick Start</div>

                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Texture Presets</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        updateTexture({
                                            type: 'carbon_fiber',
                                            primaryColor: '#1a1a2a',
                                            secondaryColor: '#0a0a14',
                                            scale: 1,
                                        });
                                    }}
                                    fullWidth
                                >
                                    Dark Carbon
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        updateTexture({
                                            type: 'brushed_metal',
                                            primaryColor: '#3a3a4a',
                                            secondaryColor: '#2a2a3a',
                                            scale: 1,
                                            angle: 0,
                                        });
                                    }}
                                    fullWidth
                                >
                                    Brushed Steel
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        updateTexture({
                                            type: 'perforated',
                                            primaryColor: '#1a1a1a',
                                            secondaryColor: '#0a0a0a',
                                            scale: 1.5,
                                        });
                                    }}
                                    fullWidth
                                >
                                    Speaker Mesh
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        updateTexture({
                                            type: 'diamond_plate',
                                            primaryColor: '#3a3a3a',
                                            secondaryColor: '#4a4a4a',
                                            scale: 1,
                                        });
                                    }}
                                    fullWidth
                                >
                                    Industrial
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        updateTexture({
                                            type: 'circuit_board',
                                            primaryColor: '#0a1a0a',
                                            secondaryColor: '#1a4a2a',
                                            scale: 1,
                                        });
                                    }}
                                    fullWidth
                                >
                                    Tech Circuit
                                </Button>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', fontSize: '11px', color: '#666' }}>
                            <p style={{ marginBottom: '8px' }}>
                                Create custom procedural backgrounds for your AIDA64 panel.
                            </p>
                            <p>
                                The generated texture will be applied as the panel background image.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="foundry-footer">
                    <span className="foundry-note">
                        Procedural textures are generated at your panel's resolution ({resolution.width}x{resolution.height})
                    </span>
                </div>
            </div>
        </div>
    );
};
