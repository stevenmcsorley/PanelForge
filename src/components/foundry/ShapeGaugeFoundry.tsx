/**
 * ShapeGaugeFoundry Component
 * Modal interface for creating animated shape gauges
 * - Bars (horizontal, vertical)
 * - Circles, Donuts
 * - Semi-circles, Quarter-circles
 * - Custom arcs
 *
 * Pro features: Gradients, Glow, Glossy/Metallic effects, Color Zones
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useShapeGaugeFoundryStore, ShapeType, FillMode } from '@/stores/shapeGaugeFoundryStore';
import { useWidgetStore, createDefaultImageSequenceWidget } from '@/stores';
import { Button, Slider, Input, Checkbox, Select } from '@/components/ui';
import { renderShapeGauge, generateShapeGaugeFrames } from './shapeGaugeRenderUtils';

// ============================================================================
// Preview Canvas Component
// ============================================================================

const ShapeGaugePreviewCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const store = useShapeGaugeFoundryStore();
    const {
        previewValue,
        outputWidth,
        outputHeight,
        useTransparentBackground,
        shapeParams,
        scaleParams,
        valueLabelParams,
    } = store;

    const paramsKey = JSON.stringify({ shapeParams, scaleParams, valueLabelParams });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        renderShapeGauge(
            ctx,
            previewValue,
            outputWidth,
            outputHeight,
            shapeParams,
            scaleParams,
            valueLabelParams,
            useTransparentBackground
        );
    }, [previewValue, outputWidth, outputHeight, useTransparentBackground, paramsKey, shapeParams, scaleParams, valueLabelParams]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <canvas
                ref={canvasRef}
                width={outputWidth}
                height={outputHeight}
                style={{
                    background: useTransparentBackground ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px' : '#0a0a0f',
                    border: '1px solid #333',
                    borderRadius: 4,
                    maxWidth: '100%',
                }}
            />
            <div style={{ fontSize: 11, color: '#888' }}>
                {previewValue.toFixed(0)}%
            </div>
        </div>
    );
};

// ============================================================================
// Shape Type Selector
// ============================================================================

const ShapeTypeSelector: React.FC = () => {
    const { shapeParams, updateShapeParams } = useShapeGaugeFoundryStore();

    const shapeOptions: { value: ShapeType; label: string; icon: string }[] = [
        { value: 'horizontal_bar', label: 'H-Bar', icon: '▬' },
        { value: 'vertical_bar', label: 'V-Bar', icon: '▮' },
        { value: 'circle', label: 'Circle', icon: '●' },
        { value: 'donut', label: 'Donut', icon: '◯' },
        { value: 'semi_circle_top', label: 'Semi ⌢', icon: '⌢' },
        { value: 'semi_circle_bottom', label: 'Semi ⌣', icon: '⌣' },
        { value: 'quarter_tl', label: 'Q-TL', icon: '◜' },
        { value: 'quarter_tr', label: 'Q-TR', icon: '◝' },
        { value: 'quarter_bl', label: 'Q-BL', icon: '◟' },
        { value: 'quarter_br', label: 'Q-BR', icon: '◞' },
        { value: 'custom_arc', label: 'Arc', icon: '⌓' },
    ];

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Shape</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {shapeOptions.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => updateShapeParams({ shapeType: opt.value })}
                        style={{
                            padding: '6px 4px',
                            background: shapeParams.shapeType === opt.value ? '#0088ff' : '#2a2a3a',
                            border: 'none',
                            borderRadius: 4,
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <span style={{ fontSize: 14 }}>{opt.icon}</span>
                        <span>{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// Shape Parameters Editor
// ============================================================================

const ShapeParamsEditor: React.FC = () => {
    const { shapeParams, updateShapeParams } = useShapeGaugeFoundryStore();
    const isBar = shapeParams.shapeType === 'horizontal_bar' || shapeParams.shapeType === 'vertical_bar';
    const isCustomArc = shapeParams.shapeType === 'custom_arc';
    const isDonut = shapeParams.shapeType === 'donut';

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Dimensions</div>

            <Select
                label="Fill Mode"
                value={shapeParams.fillMode}
                options={[
                    { value: 'smooth', label: 'Smooth' },
                    { value: 'segmented', label: 'Segmented' },
                    { value: 'chunky', label: 'Chunky' },
                ]}
                onChange={(v) => updateShapeParams({ fillMode: v as FillMode })}
            />

            <Slider
                label="Thickness"
                value={shapeParams.thickness}
                onChange={(v) => updateShapeParams({ thickness: v })}
                min={10}
                max={100}
            />

            {isBar && (
                <Slider
                    label="Corner Radius"
                    value={shapeParams.cornerRadius}
                    onChange={(v) => updateShapeParams({ cornerRadius: v })}
                    min={0}
                    max={50}
                />
            )}

            {(isDonut || !isBar) && (
                <Slider
                    label="Inner Radius %"
                    value={shapeParams.innerRadius}
                    onChange={(v) => updateShapeParams({ innerRadius: v })}
                    min={0}
                    max={90}
                />
            )}

            {isCustomArc && (
                <>
                    <div className="foundry-param-row">
                        <Slider
                            label="Start Angle"
                            value={shapeParams.startAngle}
                            onChange={(v) => updateShapeParams({ startAngle: v })}
                            min={-180}
                            max={180}
                        />
                        <Slider
                            label="End Angle"
                            value={shapeParams.endAngle}
                            onChange={(v) => updateShapeParams({ endAngle: v })}
                            min={-180}
                            max={180}
                        />
                    </div>
                </>
            )}

            {(shapeParams.fillMode === 'segmented' || shapeParams.fillMode === 'chunky') && (
                <div className="foundry-param-row">
                    <Slider
                        label="Segments"
                        value={shapeParams.segmentCount}
                        onChange={(v) => updateShapeParams({ segmentCount: v })}
                        min={5}
                        max={60}
                    />
                    <Slider
                        label="Gap"
                        value={shapeParams.segmentGap}
                        onChange={(v) => updateShapeParams({ segmentGap: v })}
                        min={1}
                        max={15}
                    />
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Colors Editor
// ============================================================================

const ColorsEditor: React.FC = () => {
    const { shapeParams, updateShapeParams } = useShapeGaugeFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Colors</div>

            <div className="foundry-param-row">
                <Input
                    label="Fill Color"
                    type="color"
                    value={shapeParams.fillColor}
                    onChange={(v) => updateShapeParams({ fillColor: v })}
                />
                <Input
                    label="Track Color"
                    type="color"
                    value={shapeParams.backgroundColor}
                    onChange={(v) => updateShapeParams({ backgroundColor: v })}
                />
            </div>

            <Checkbox
                label="Show Track"
                checked={shapeParams.showBackground}
                onChange={(v) => updateShapeParams({ showBackground: v })}
            />
        </div>
    );
};

// ============================================================================
// Gradient Editor
// ============================================================================

const GradientEditor: React.FC = () => {
    const { shapeParams, updateGradient, addGradientStop, removeGradientStop, updateGradientStop } = useShapeGaugeFoundryStore();
    const { gradient } = shapeParams;

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Gradient</div>

            <Checkbox
                label="Enable Gradient"
                checked={gradient.enabled}
                onChange={(v) => updateGradient({ enabled: v })}
            />

            {gradient.enabled && (
                <>
                    <Select
                        label="Type"
                        value={gradient.type}
                        options={[
                            { value: 'linear', label: 'Linear' },
                            { value: 'radial', label: 'Radial' },
                            { value: 'sweep', label: 'Sweep (Along Fill)' },
                        ]}
                        onChange={(v) => updateGradient({ type: v as any })}
                    />

                    {gradient.type === 'linear' && (
                        <Slider
                            label="Angle"
                            value={gradient.angle}
                            onChange={(v) => updateGradient({ angle: v })}
                            min={0}
                            max={360}
                        />
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {gradient.stops.map((stop, index) => (
                            <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Input
                                    label=""
                                    type="color"
                                    value={stop.color}
                                    onChange={(v) => updateGradientStop(index, { color: v })}
                                />
                                <div style={{ flex: 1 }}>
                                    <Slider
                                        label={`${stop.position}%`}
                                        value={stop.position}
                                        onChange={(v) => updateGradientStop(index, { position: v })}
                                        min={0}
                                        max={100}
                                    />
                                </div>
                                {gradient.stops.length > 2 && (
                                    <button
                                        onClick={() => removeGradientStop(index)}
                                        style={{
                                            background: '#ff4444',
                                            border: 'none',
                                            borderRadius: 4,
                                            color: 'white',
                                            cursor: 'pointer',
                                            padding: '2px 8px',
                                            fontSize: 12,
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {gradient.stops.length < 5 && (
                        <Button
                            variant="secondary"
                            onClick={() => addGradientStop({ position: 50, color: '#ffff00' })}
                        >
                            + Add Stop
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

// ============================================================================
// Glow Editor
// ============================================================================

const GlowEditor: React.FC = () => {
    const { shapeParams, updateGlow } = useShapeGaugeFoundryStore();
    const { glow } = shapeParams;

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Glow</div>

            <Checkbox
                label="Enable Glow"
                checked={glow.enabled}
                onChange={(v) => updateGlow({ enabled: v })}
            />

            {glow.enabled && (
                <>
                    <Input
                        label="Glow Color"
                        type="color"
                        value={glow.color}
                        onChange={(v) => updateGlow({ color: v })}
                    />
                    <div className="foundry-param-row">
                        <Slider
                            label="Strength"
                            value={glow.strength}
                            onChange={(v) => updateGlow({ strength: v })}
                            min={0}
                            max={30}
                        />
                        <Slider
                            label="Spread"
                            value={glow.spread}
                            onChange={(v) => updateGlow({ spread: v })}
                            min={0}
                            max={20}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

// ============================================================================
// Effects Editor
// ============================================================================

const EffectsEditor: React.FC = () => {
    const { shapeParams, updateEffects } = useShapeGaugeFoundryStore();
    const { effects } = shapeParams;

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Effects</div>

            <div className="foundry-param-row">
                <Checkbox
                    label="Glossy"
                    checked={effects.glossy}
                    onChange={(v) => updateEffects({ glossy: v })}
                />
                <Checkbox
                    label="Metallic"
                    checked={effects.metallic}
                    onChange={(v) => updateEffects({ metallic: v })}
                />
                <Checkbox
                    label="Inset"
                    checked={effects.inset}
                    onChange={(v) => updateEffects({ inset: v })}
                />
            </div>
        </div>
    );
};

// ============================================================================
// Color Zones Editor
// ============================================================================

const ColorZonesEditor: React.FC = () => {
    const { shapeParams, updateShapeParams, addColorZone, removeColorZone, updateColorZone } = useShapeGaugeFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Color Zones</div>

            <Checkbox
                label="Use Color Zones"
                checked={shapeParams.useColorZones}
                onChange={(v) => updateShapeParams({ useColorZones: v })}
            />

            {shapeParams.useColorZones && (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {shapeParams.colorZones.map((zone, index) => (
                            <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Input
                                    label=""
                                    type="color"
                                    value={zone.color}
                                    onChange={(v) => updateColorZone(index, { color: v })}
                                />
                                <div style={{ flex: 1 }}>
                                    <Slider
                                        label={`Up to ${zone.threshold}%`}
                                        value={zone.threshold}
                                        onChange={(v) => updateColorZone(index, { threshold: v })}
                                        min={1}
                                        max={100}
                                    />
                                </div>
                                {shapeParams.colorZones.length > 1 && (
                                    <button
                                        onClick={() => removeColorZone(index)}
                                        style={{
                                            background: '#ff4444',
                                            border: 'none',
                                            borderRadius: 4,
                                            color: 'white',
                                            cursor: 'pointer',
                                            padding: '2px 8px',
                                            fontSize: 12,
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {shapeParams.colorZones.length < 5 && (
                        <Button
                            variant="secondary"
                            onClick={() => addColorZone({ threshold: 100, color: '#ff0000' })}
                        >
                            + Add Zone
                        </Button>
                    )}

                    <div style={{
                        fontSize: 10,
                        color: '#888',
                        marginTop: 4,
                        padding: '6px 8px',
                        background: 'rgba(0,150,255,0.1)',
                        borderRadius: 4,
                    }}>
                        💡 Zones define color based on value. E.g., 0-70% green, 70-90% yellow, 90-100% red.
                    </div>
                </>
            )}
        </div>
    );
};

// ============================================================================
// Main ShapeGaugeFoundry Component
// ============================================================================

export const ShapeGaugeFoundry: React.FC = () => {
    const {
        isOpen,
        editingWidgetId,
        previewValue,
        outputWidth,
        outputHeight,
        frameCount,
        useTransparentBackground,
        shapeParams,
        scaleParams,
        valueLabelParams,
        generatedFrames,
        isGenerating,
        generationProgress,
        closeShapeGaugeFoundry,
        setPreviewValue,
        setOutputSize,
        setFrameCount,
        setTransparentBackground,
        setGeneratedFrames,
        setGenerating,
    } = useShapeGaugeFoundryStore();

    const { addWidget, updateWidget } = useWidgetStore();

    const generateFrames = useCallback(async () => {
        setGenerating(true, 0);

        const frames = await generateShapeGaugeFrames(
            outputWidth,
            outputHeight,
            frameCount,
            shapeParams,
            scaleParams,
            valueLabelParams,
            useTransparentBackground,
            (progress) => setGenerating(true, progress)
        );

        setGeneratedFrames(frames);
        setGenerating(false, 100);
    }, [outputWidth, outputHeight, frameCount, shapeParams, scaleParams, valueLabelParams, useTransparentBackground, setGeneratedFrames, setGenerating]);

    const addToCanvas = useCallback(() => {
        if (generatedFrames.length === 0) return;

        // Build foundry params to save with widget for regeneration
        const foundryParams = {
            frameCount,
            useTransparentBackground,
            shapeParams: { ...shapeParams },
            scaleParams: { ...scaleParams },
            valueLabelParams: { ...valueLabelParams },
        };

        if (editingWidgetId) {
            // Update existing widget
            updateWidget(editingWidgetId, {
                images: generatedFrames,
                width: outputWidth,
                height: outputHeight,
                foundryParams,
            });
        } else {
            // Create new widget
            const widget = createDefaultImageSequenceWidget();
            widget.images = generatedFrames;
            widget.width = outputWidth;
            widget.height = outputHeight;
            widget.name = `Shape Gauge (${shapeParams.shapeType})`;
            widget.useModulo = false;
            widget.minValue = 0;
            widget.maxValue = 100;
            widget.clamp = true;
            widget.sourceFoundry = 'shape';
            widget.foundryParams = foundryParams;

            addWidget(widget);
        }
        closeShapeGaugeFoundry();
    }, [generatedFrames, outputWidth, outputHeight, frameCount, useTransparentBackground, shapeParams, scaleParams, valueLabelParams, addWidget, updateWidget, editingWidgetId, closeShapeGaugeFoundry]);

    if (!isOpen) return null;

    return (
        <div className="foundry-overlay">
            <div className="foundry-modal" style={{ maxWidth: 1100 }}>
                <div className="foundry-header">
                    <div className="foundry-title">
                        <span className="foundry-icon">◐</span>
                        Shape Gauge Foundry
                    </div>
                    <span className="foundry-subtitle">
                        Animated {shapeParams.shapeType.replace(/_/g, ' ')} • {shapeParams.fillMode} fill
                    </span>
                    <button className="foundry-close" onClick={closeShapeGaugeFoundry}>
                        &times;
                    </button>
                </div>

                <div className="foundry-content">
                    {/* Left: Preview */}
                    <div className="foundry-preview-section">
                        <div className="foundry-section-title">Preview</div>
                        <div className="foundry-canvas-container">
                            <ShapeGaugePreviewCanvas />
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <Slider
                                label="Preview Value"
                                value={previewValue}
                                onChange={setPreviewValue}
                                min={0}
                                max={100}
                            />
                        </div>

                        <ShapeTypeSelector />
                    </div>

                    {/* Middle: Parameters */}
                    <div className="foundry-params-section" style={{ maxHeight: 600, overflowY: 'auto' }}>
                        <div className="foundry-section-title">Parameters</div>

                        <ShapeParamsEditor />
                        <ColorsEditor />
                        <GradientEditor />
                        <GlowEditor />
                        <EffectsEditor />
                        <ColorZonesEditor />
                    </div>

                    {/* Right: Output */}
                    <div className="foundry-output-section">
                        <div className="foundry-section-title">Output</div>

                        <div className="foundry-param-group">
                            <div className="foundry-param-row">
                                <Slider
                                    label="Width"
                                    value={outputWidth}
                                    onChange={(v) => setOutputSize(v, outputHeight)}
                                    min={64}
                                    max={512}
                                />
                                <Slider
                                    label="Height"
                                    value={outputHeight}
                                    onChange={(v) => setOutputSize(outputWidth, v)}
                                    min={64}
                                    max={512}
                                />
                            </div>

                            <Slider
                                label="Frame Count"
                                value={frameCount}
                                onChange={setFrameCount}
                                min={16}
                                max={128}
                            />

                            <Checkbox
                                label="Transparent Background"
                                checked={useTransparentBackground}
                                onChange={setTransparentBackground}
                            />
                        </div>

                        <Button
                            variant="primary"
                            onClick={generateFrames}
                            disabled={isGenerating}
                            fullWidth
                        >
                            {isGenerating ? `Generating... ${Math.round(generationProgress)}%` : 'Generate Frames'}
                        </Button>

                        {generatedFrames.length > 0 && (
                            <div className="foundry-frames-result">
                                <div className="foundry-frames-count">
                                    {generatedFrames.length} frames generated
                                </div>
                                <div className="foundry-frames-preview">
                                    {generatedFrames.filter((_, i) => i % Math.ceil(generatedFrames.length / 8) === 0).slice(0, 8).map((frame, i) => (
                                        <img
                                            key={i}
                                            src={frame}
                                            alt={`Frame ${i}`}
                                            className="foundry-frame-thumb"
                                        />
                                    ))}
                                    {generatedFrames.length > 8 && (
                                        <div className="foundry-frame-more">
                                            +{generatedFrames.length - 8}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={addToCanvas}
                                    fullWidth
                                >
                                    Add to Canvas
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="foundry-footer">
                    <div className="foundry-note">
                        Animated shape gauges with pro gradient, glow, and color zone effects.
                    </div>
                </div>
            </div>
        </div>
    );
};
