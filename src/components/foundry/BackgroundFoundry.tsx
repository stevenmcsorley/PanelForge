/**
 * BackgroundFoundry
 * Tab for creating procedural backgrounds and applying image filters
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useFoundryStore } from '@/stores/foundryStore';
import { Input, Slider, Button } from '@/components/ui';
import { generateProceduralTexture, TEXTURE_OPTIONS } from './proceduralTextures';
import { applyBackgroundEffects, applyColorOverlay } from './imageFilters';

const DebouncedColorInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with external updates
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = useCallback((newValue: string) => {
        setLocalValue(newValue);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            onChange(newValue);
        }, 50);
    }, [onChange]);

    return (
        <Input
            label={label}
            type="color"
            value={localValue}
            onChange={handleChange}
        />
    );
};

export const BackgroundFoundry: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const {
        outputWidth,
        outputHeight,
        backgroundFoundryParams,
        updateProceduralTexture,
        updateBackgroundEffects,
        updateBackgroundFoundryParams,
        applyGeneratedBackground,
        setActiveTab,
    } = useFoundryStore();

    const { proceduralTexture, imageEffects, overlayColor, overlayOpacity, overlayBlendMode } = backgroundFoundryParams;

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
        setIsGenerating(false);
    }, [proceduralTexture, imageEffects, overlayColor, overlayOpacity, overlayBlendMode]);

    // Update canvas size and debounce generation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            if (canvas.width !== outputWidth || canvas.height !== outputHeight) {
                canvas.width = outputWidth;
                canvas.height = outputHeight;
            }

            setIsGenerating(true);
            const timeoutId = setTimeout(() => {
                generatePreview();
            }, 100); // 100ms debounce

            return () => clearTimeout(timeoutId);
        }
    }, [outputWidth, outputHeight, generatePreview]);

    // Apply to gauge background
    const handleApply = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        updateBackgroundFoundryParams({ generatedBackground: dataUrl });
        applyGeneratedBackground();
        setActiveTab('gauge');
    }, [updateBackgroundFoundryParams, applyGeneratedBackground, setActiveTab]);

    // Export as PNG
    const handleExport = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'background.png';
        link.href = dataUrl;
        link.click();
    }, []);

    return (
        <div className="foundry-content" style={{ flexDirection: 'row' }}>
            {/* Left: Preview */}
            <div className="foundry-preview-section">
                <div className="foundry-section-title">Background Preview</div>
                <div
                    className="foundry-canvas-container"
                    style={{
                        background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px',
                        position: 'relative',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={outputWidth}
                        height={outputHeight}
                        style={{
                            maxWidth: '280px',
                            maxHeight: '280px',
                            objectFit: 'contain',
                            filter: isGenerating ? 'blur(2px)' : 'none',
                            transition: 'filter 0.2s',
                        }}
                    />
                    {isGenerating && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(0,0,0,0.6)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: 'white',
                            pointerEvents: 'none',
                        }}>
                            Updating...
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <Button variant="primary" onClick={handleApply} fullWidth>
                        Apply to Gauge
                    </Button>
                    <Button variant="secondary" onClick={handleExport}>
                        Export
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
                        onChange={(e) => updateProceduralTexture({ type: e.target.value as any })}
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
                            <DebouncedColorInput
                                label="Primary Color"
                                value={proceduralTexture.primaryColor}
                                onChange={(v) => updateProceduralTexture({ primaryColor: v })}
                            />
                            <DebouncedColorInput
                                label="Secondary Color"
                                value={proceduralTexture.secondaryColor}
                                onChange={(v) => updateProceduralTexture({ secondaryColor: v })}
                            />
                        </div>

                        <Slider
                            label={`Scale: ${proceduralTexture.scale.toFixed(1)}`}
                            value={proceduralTexture.scale}
                            onChange={(v) => updateProceduralTexture({ scale: v })}
                            min={0.5}
                            max={3}
                            step={0.1}
                        />

                        <Slider
                            label={`Angle: ${proceduralTexture.angle}`}
                            value={proceduralTexture.angle}
                            onChange={(v) => updateProceduralTexture({ angle: v })}
                            min={0}
                            max={360}
                        />

                        <Slider
                            label={`Intensity: ${Math.round(proceduralTexture.intensity * 100)}%`}
                            value={proceduralTexture.intensity}
                            onChange={(v) => updateProceduralTexture({ intensity: v })}
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
                        onChange={(v) => updateBackgroundEffects({ blur: v })}
                        min={0}
                        max={20}
                    />

                    <Slider
                        label={`Noise: ${Math.round(imageEffects.noise * 100)}%`}
                        value={imageEffects.noise}
                        onChange={(v) => updateBackgroundEffects({ noise: v })}
                        min={0}
                        max={1}
                        step={0.05}
                    />

                    <Slider
                        label={`Brightness: ${imageEffects.brightness}%`}
                        value={imageEffects.brightness}
                        onChange={(v) => updateBackgroundEffects({ brightness: v })}
                        min={0}
                        max={200}
                    />

                    <Slider
                        label={`Contrast: ${imageEffects.contrast}%`}
                        value={imageEffects.contrast}
                        onChange={(v) => updateBackgroundEffects({ contrast: v })}
                        min={0}
                        max={200}
                    />

                    <Slider
                        label={`Saturation: ${imageEffects.saturation}%`}
                        value={imageEffects.saturation}
                        onChange={(v) => updateBackgroundEffects({ saturation: v })}
                        min={0}
                        max={200}
                    />
                </div>

                {/* Color Overlay */}
                <div className="foundry-param-group">
                    <div className="foundry-param-group-title">Color Overlay</div>

                    <div className="foundry-param-row">
                        <DebouncedColorInput
                            label="Color"
                            value={overlayColor}
                            onChange={(v) => updateBackgroundFoundryParams({ overlayColor: v })}
                        />
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                                Blend Mode
                            </label>
                            <select
                                value={overlayBlendMode}
                                onChange={(e) => updateBackgroundFoundryParams({ overlayBlendMode: e.target.value as any })}
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
                        onChange={(v) => updateBackgroundFoundryParams({ overlayOpacity: v })}
                        min={0}
                        max={100}
                    />
                </div>
            </div>

            {/* Right: Info */}
            <div className="foundry-output-section">
                <div className="foundry-section-title">Output Info</div>

                <div className="foundry-param-group">
                    <div style={{ fontSize: '12px', color: '#888' }}>
                        <p>Size: {outputWidth} x {outputHeight} px</p>
                        <p style={{ marginTop: '8px' }}>
                            This background will be used as the base layer for your gauge.
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', fontSize: '11px', color: '#666' }}>
                    <p>Tip: Use transparent background on the gauge to show the texture through.</p>
                </div>
            </div>
        </div>
    );
};
