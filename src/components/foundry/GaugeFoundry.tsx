/**
 * GaugeFoundry
 * Main component for the Vector Gauge Foundry authoring tool
 * 
 * AUTHORING-ONLY: Creates PNG frame sequences for use with ImageSequenceWidget.
 * No vector rendering at runtime - only PNG frames.
 */

import React, { useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useFoundryStore } from '@/stores/foundryStore';
import { LedArcPreview, generateLedArcFrames } from './LedArcPreview';
import { useWidgetStore, createDefaultImageSequenceWidget } from '@/stores';
import { Input, Slider, Button } from '@/components/ui';

export const GaugeFoundry: React.FC = () => {
    const {
        isOpen,
        closeFoundry,
        previewValue,
        setPreviewValue,
        frameCount,
        setFrameCount,
        outputWidth,
        outputHeight,
        setOutputSize,
        ledArcParams,
        updateLedArcParams,
        generatedFrames,
        setGeneratedFrames,
        isGenerating,
        generationProgress,
        setGenerating,
        resetToDefaults,
    } = useFoundryStore();

    const { addWidget } = useWidgetStore();

    // Generate frames
    const handleGenerateFrames = useCallback(async () => {
        setGenerating(true, 0);
        try {
            const frames = await generateLedArcFrames(
                ledArcParams,
                frameCount,
                outputWidth,
                outputHeight,
                (progress) => setGenerating(true, progress)
            );
            setGeneratedFrames(frames);
        } finally {
            setGenerating(false, 0);
        }
    }, [ledArcParams, frameCount, outputWidth, outputHeight, setGeneratedFrames, setGenerating]);

    // Create widget with generated frames
    const handleCreateWidget = useCallback(() => {
        if (generatedFrames.length === 0) return;

        addWidget(createDefaultImageSequenceWidget({
            images: generatedFrames,
            width: outputWidth,
            height: outputHeight,
            name: 'LED Arc Gauge',
        }));
        closeFoundry();
    }, [generatedFrames, outputWidth, outputHeight, addWidget, closeFoundry]);

    if (!isOpen) return null;

    // Calculate preview canvas size
    const previewSize = 280;
    const scale = previewSize / (ledArcParams.outerRadius * 2.2);

    return (
        <div className="foundry-overlay">
            <div className="foundry-modal">
                {/* Header */}
                <div className="foundry-header">
                    <div className="foundry-title">
                        <span className="foundry-icon">⚙️</span>
                        Vector Gauge Foundry
                    </div>
                    <div className="foundry-subtitle">
                        Authoring Tool · Output: PNG Frames
                    </div>
                    <button className="foundry-close" onClick={closeFoundry}>✕</button>
                </div>

                <div className="foundry-content">
                    {/* Left: Preview */}
                    <div className="foundry-preview-section">
                        <div className="foundry-section-title">Live Preview</div>
                        <div className="foundry-canvas-container">
                            <Stage width={previewSize} height={previewSize}>
                                <Layer>
                                    <Rect
                                        x={0}
                                        y={0}
                                        width={previewSize}
                                        height={previewSize}
                                        fill={ledArcParams.backgroundColor}
                                    />
                                    <LedArcPreview
                                        params={ledArcParams}
                                        value={previewValue}
                                        centerX={previewSize / 2}
                                        centerY={previewSize / 2}
                                        scale={scale}
                                    />
                                </Layer>
                            </Stage>
                        </div>

                        {/* Preview value slider */}
                        <div className="foundry-preview-controls">
                            <Slider
                                label={`Preview Value: ${previewValue}%`}
                                value={previewValue}
                                onChange={setPreviewValue}
                                min={0}
                                max={100}
                            />
                        </div>
                    </div>

                    {/* Middle: Template Parameters */}
                    <div className="foundry-params-section">
                        <div className="foundry-section-title">Template: LED Arc</div>

                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Arc Geometry</div>
                            <div className="foundry-param-row">
                                <Input
                                    label="Start Angle"
                                    type="number"
                                    value={ledArcParams.arcStartAngle}
                                    onChange={(v) => updateLedArcParams({ arcStartAngle: parseFloat(v) || 0 })}
                                />
                                <Input
                                    label="End Angle"
                                    type="number"
                                    value={ledArcParams.arcEndAngle}
                                    onChange={(v) => updateLedArcParams({ arcEndAngle: parseFloat(v) || 360 })}
                                />
                            </div>
                            <div className="foundry-param-row">
                                <Input
                                    label="Inner Radius"
                                    type="number"
                                    value={ledArcParams.innerRadius}
                                    onChange={(v) => updateLedArcParams({ innerRadius: parseFloat(v) || 40 })}
                                    min={10}
                                />
                                <Input
                                    label="Outer Radius"
                                    type="number"
                                    value={ledArcParams.outerRadius}
                                    onChange={(v) => updateLedArcParams({ outerRadius: parseFloat(v) || 80 })}
                                    min={20}
                                />
                            </div>
                        </div>

                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Segments</div>
                            <div className="foundry-param-row">
                                <Input
                                    label="Segment Count"
                                    type="number"
                                    value={ledArcParams.segmentCount}
                                    onChange={(v) => updateLedArcParams({ segmentCount: parseInt(v) || 10 })}
                                    min={2}
                                    max={100}
                                />
                                <Input
                                    label="Gap (degrees)"
                                    type="number"
                                    value={ledArcParams.segmentGap}
                                    onChange={(v) => updateLedArcParams({ segmentGap: parseFloat(v) || 1 })}
                                    min={0}
                                    max={20}
                                />
                            </div>
                        </div>

                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Colors</div>
                            <div className="foundry-param-row">
                                <Input
                                    label="Off Color"
                                    type="color"
                                    value={ledArcParams.offColor}
                                    onChange={(v) => updateLedArcParams({ offColor: v })}
                                />
                                <Input
                                    label="On Color"
                                    type="color"
                                    value={ledArcParams.onColor}
                                    onChange={(v) => updateLedArcParams({ onColor: v })}
                                />
                            </div>
                            <Input
                                label="Background"
                                type="color"
                                value={ledArcParams.backgroundColor}
                                onChange={(v) => updateLedArcParams({ backgroundColor: v })}
                            />
                            <Slider
                                label={`Glow Strength: ${ledArcParams.glowStrength}`}
                                value={ledArcParams.glowStrength}
                                onChange={(v) => updateLedArcParams({ glowStrength: v })}
                                min={0}
                                max={20}
                            />
                        </div>

                        <Button variant="secondary" onClick={resetToDefaults} fullWidth>
                            Reset to Defaults
                        </Button>
                    </div>

                    {/* Right: Output Settings */}
                    <div className="foundry-output-section">
                        <div className="foundry-section-title">Frame Generation</div>

                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Output Settings</div>
                            <div className="foundry-param-row">
                                <Input
                                    label="Width (px)"
                                    type="number"
                                    value={outputWidth}
                                    onChange={(v) => setOutputSize(parseInt(v) || 200, outputHeight)}
                                    min={50}
                                    max={1024}
                                />
                                <Input
                                    label="Height (px)"
                                    type="number"
                                    value={outputHeight}
                                    onChange={(v) => setOutputSize(outputWidth, parseInt(v) || 200)}
                                    min={50}
                                    max={1024}
                                />
                            </div>
                            <Input
                                label="Frame Count"
                                type="number"
                                value={frameCount}
                                onChange={(v) => setFrameCount(parseInt(v) || 16)}
                                min={2}
                                max={128}
                            />
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleGenerateFrames}
                            disabled={isGenerating}
                            fullWidth
                        >
                            {isGenerating
                                ? `Generating... ${Math.round(generationProgress * 100)}%`
                                : '⚡ Generate Frames'
                            }
                        </Button>

                        {/* Generated frames preview */}
                        {generatedFrames.length > 0 && (
                            <div className="foundry-frames-result">
                                <div className="foundry-frames-count">
                                    ✓ {generatedFrames.length} frames generated
                                </div>
                                <div className="foundry-frames-preview">
                                    {generatedFrames.slice(0, 8).map((frame, i) => (
                                        <img
                                            key={i}
                                            src={frame}
                                            alt={`Frame ${i + 1}`}
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
                                    onClick={handleCreateWidget}
                                    fullWidth
                                >
                                    🎯 Create Widget with Frames
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="foundry-footer">
                    <span className="foundry-note">
                        ℹ️ Vectors are for authoring only. AIDA64 receives PNG frames.
                    </span>
                </div>
            </div>
        </div>
    );
};
