/**
 * GaugeFoundry
 * Main component for the Vector Gauge Foundry authoring tool
 *
 * AUTHORING-ONLY: Creates PNG frame sequences for use with ImageSequenceWidget.
 * No vector rendering at runtime - only PNG frames.
 */

import React, { useCallback } from 'react';
import { useFoundryStore } from '@/stores/foundryStore';
import {
    generateLedArcFrames,
    generateNeedleFrames,
    generateCompositeFrames,
    BackgroundFoundry,
} from './index';
import { GaugePreviewCanvas } from './GaugePreviewCanvas';
import { TickEditor } from './TickEditor';
import { LabelEditor } from './LabelEditor';
import { LayerOrderEditor } from './LayerOrderEditor';
import { LedEffectsEditor } from './LedEffectsEditor';
import { EncasingEditor } from './EncasingEditor';
import { useWidgetStore, createDefaultImageSequenceWidget } from '@/stores';
import { Input, Slider, Button } from '@/components/ui';
import { exportFramesToZip, exportFramesIndividually, estimateZipSize, formatBytes } from '@/utils/aida64Export';

export const GaugeFoundry: React.FC = () => {
    const {
        isOpen,
        closeFoundry,
        activeTab,
        setActiveTab,
        selectedTemplate,
        setTemplate,
        previewValue,
        setPreviewValue,
        frameCount,
        setFrameCount,
        outputWidth,
        outputHeight,
        setOutputSize,
        useTransparentBackground,
        setTransparentBackground,
        ledArcParams,
        updateLedArcParams,
        needleParams,
        updateNeedleParams,
        backgroundParams,
        updateBackgroundParams,
        tickParams,
        labelParams,
        layerOrder,
        encasingParams,
        exportOptions,
        updateExportOptions,
        generatedFrames,
        setGeneratedFrames,
        isGenerating,
        generationProgress,
        setGenerating,
        isExporting,
        exportProgress,
        setExporting,
        resetToDefaults,
        editingWidgetId,
    } = useFoundryStore();

    const { addWidget, updateWidget } = useWidgetStore();

    // Generate frames based on selected template
    const handleGenerateFrames = useCallback(async () => {
        setGenerating(true, 0);
        try {
            let frames: string[] = [];
            if (selectedTemplate === 'led_arc') {
                frames = await generateLedArcFrames(
                    ledArcParams,
                    frameCount,
                    outputWidth,
                    outputHeight,
                    useTransparentBackground,
                    (progress: number) => setGenerating(true, progress),
                    backgroundParams,
                    tickParams,
                    labelParams,
                    layerOrder,
                    encasingParams
                );
            } else if (selectedTemplate === 'needle') {
                frames = await generateNeedleFrames(
                    needleParams,
                    frameCount,
                    outputWidth,
                    outputHeight,
                    useTransparentBackground,
                    (progress: number) => setGenerating(true, progress),
                    backgroundParams,
                    tickParams,
                    labelParams,
                    layerOrder,
                    encasingParams
                );
            } else if (selectedTemplate === 'composite') {
                frames = await generateCompositeFrames(
                    ledArcParams,
                    needleParams,
                    frameCount,
                    outputWidth,
                    outputHeight,
                    useTransparentBackground,
                    (progress: number) => setGenerating(true, progress),
                    backgroundParams,
                    tickParams,
                    labelParams,
                    layerOrder,
                    encasingParams
                );
            }
            setGeneratedFrames(frames);
        } finally {
            setGenerating(false, 0);
        }
    }, [
        selectedTemplate,
        ledArcParams,
        needleParams,
        backgroundParams,
        tickParams,
        labelParams,
        layerOrder,
        encasingParams,
        frameCount,
        outputWidth,
        outputHeight,
        useTransparentBackground,
        setGeneratedFrames,
        setGenerating
    ]);

    // Create or update widget with generated frames
    const handleCreateWidget = useCallback(() => {
        if (generatedFrames.length === 0) return;

        // Build foundry params to save with widget for regeneration
        const foundryParams = {
            selectedTemplate,
            frameCount,
            useTransparentBackground,
            ledArcParams: { ...ledArcParams },
            needleParams: { ...needleParams },
            backgroundParams: { ...backgroundParams },
            tickParams: { ...tickParams },
            labelParams: { ...labelParams },
            layerOrder: [...layerOrder],
            encasingParams: { ...encasingParams },
        };

        if (editingWidgetId) {
            // Update existing widget with new frames
            updateWidget(editingWidgetId, {
                images: generatedFrames,
                width: outputWidth,
                height: outputHeight,
                foundryParams,
            });
        } else {
            // Create new widget
            let widgetName = 'LED Arc Gauge';
            if (selectedTemplate === 'needle') widgetName = 'Needle Gauge';
            if (selectedTemplate === 'composite') widgetName = 'Composite Gauge';

            addWidget(createDefaultImageSequenceWidget({
                images: generatedFrames,
                width: outputWidth,
                height: outputHeight,
                name: widgetName,
                sourceFoundry: 'gauge',
                foundryParams,
            }));
        }
        closeFoundry();
    }, [generatedFrames, outputWidth, outputHeight, selectedTemplate, frameCount, useTransparentBackground, ledArcParams, needleParams, backgroundParams, tickParams, labelParams, layerOrder, encasingParams, addWidget, updateWidget, closeFoundry, editingWidgetId]);

    // Export to AIDA64 (ZIP)
    const handleExportZip = useCallback(async () => {
        if (generatedFrames.length === 0) return;

        setExporting(true, 0);
        try {
            await exportFramesToZip(
                {
                    frames: generatedFrames,
                    prefix: exportOptions.prefix,
                    padding: exportOptions.padding,
                    gaugeName: selectedTemplate,
                },
                (progress) => setExporting(true, progress)
            );
        } finally {
            setExporting(false, 0);
        }
    }, [generatedFrames, exportOptions, selectedTemplate, setExporting]);

    // Export to AIDA64 (Individual files)
    const handleExportIndividual = useCallback(async () => {
        if (generatedFrames.length === 0) return;

        setExporting(true, 0);
        try {
            await exportFramesIndividually(
                {
                    frames: generatedFrames,
                    prefix: exportOptions.prefix,
                    padding: exportOptions.padding,
                },
                (progress) => setExporting(true, progress)
            );
        } finally {
            setExporting(false, 0);
        }
    }, [generatedFrames, exportOptions, setExporting]);

    // Handler for image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            updateBackgroundParams({ src: event.target?.result as string });
        };
        reader.readAsDataURL(file);
    };

    if (!isOpen) return null;

    // Calculate preview canvas size - larger for better visibility
    const previewSize = 360;

    // Estimate ZIP size
    const estimatedSize = generatedFrames.length > 0 ? formatBytes(estimateZipSize(generatedFrames)) : null;

    return (
        <div className="foundry-overlay">
            <div className="foundry-modal" style={{ maxWidth: '1200px', width: '95vw' }}>
                {/* Header with Tabs */}
                <div className="foundry-header">
                    <div className="foundry-title">
                        <span className="foundry-icon">⚙️</span>
                        Vector Gauge Foundry
                        {editingWidgetId && (
                            <span style={{ fontSize: '12px', color: '#0088ff', marginLeft: '12px', fontWeight: 'normal' }}>
                                (Editing Widget at {outputWidth}x{outputHeight})
                            </span>
                        )}
                    </div>

                    {/* Tab Switcher */}
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '24px' }}>
                        <button
                            onClick={() => setActiveTab('gauge')}
                            style={{
                                padding: '6px 16px',
                                background: activeTab === 'gauge' ? '#0088ff' : '#1a1a2a',
                                border: '1px solid',
                                borderColor: activeTab === 'gauge' ? '#0088ff' : '#333',
                                color: activeTab === 'gauge' ? '#fff' : '#888',
                                borderRadius: '4px 4px 0 0',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: activeTab === 'gauge' ? 600 : 400,
                            }}
                        >
                            Gauge Builder
                        </button>
                        <button
                            onClick={() => setActiveTab('background')}
                            style={{
                                padding: '6px 16px',
                                background: activeTab === 'background' ? '#0088ff' : '#1a1a2a',
                                border: '1px solid',
                                borderColor: activeTab === 'background' ? '#0088ff' : '#333',
                                color: activeTab === 'background' ? '#fff' : '#888',
                                borderRadius: '4px 4px 0 0',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: activeTab === 'background' ? 600 : 400,
                            }}
                        >
                            Background Foundry
                        </button>
                    </div>

                    <div className="foundry-subtitle" style={{ marginLeft: 'auto' }}>
                        Authoring Tool · Output: PNG Frames
                    </div>
                    <button className="foundry-close" onClick={closeFoundry}>✕</button>
                </div>

                {/* Tab Content */}
                {activeTab === 'background' ? (
                    <BackgroundFoundry />
                ) : (
                    <div className="foundry-content">
                        {/* Left: Preview */}
                        <div className="foundry-preview-section" style={{ minWidth: '380px' }}>
                            <div className="foundry-section-title">Live Preview (with all effects)</div>
                            <div
                                className={`foundry-canvas-container ${useTransparentBackground ? 'transparent' : ''}`}
                                style={{
                                    width: previewSize,
                                    height: previewSize,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <GaugePreviewCanvas
                                    template={selectedTemplate}
                                    value={previewValue}
                                    width={previewSize}
                                    height={previewSize}
                                    ledArcParams={ledArcParams}
                                    needleParams={needleParams}
                                    backgroundParams={backgroundParams}
                                    tickParams={tickParams}
                                    labelParams={labelParams}
                                    layerOrder={layerOrder}
                                    encasingParams={encasingParams}
                                    useTransparentBackground={useTransparentBackground}
                                />
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

                            {/* Template Selector */}
                            <div className="foundry-param-group" style={{ marginTop: 'auto' }}>
                                <div className="foundry-param-group-title">Select Template</div>
                                <div className="foundry-template-selector">
                                    <button
                                        className={`foundry-template-btn ${selectedTemplate === 'led_arc' ? 'active' : ''}`}
                                        onClick={() => setTemplate('led_arc')}
                                    >
                                        LED Arc
                                    </button>
                                    <button
                                        className={`foundry-template-btn ${selectedTemplate === 'needle' ? 'active' : ''}`}
                                        onClick={() => setTemplate('needle')}
                                    >
                                        Needle
                                    </button>
                                    <button
                                        className={`foundry-template-btn ${selectedTemplate === 'composite' ? 'active' : ''}`}
                                        onClick={() => setTemplate('composite')}
                                    >
                                        Composite
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Middle: Template Parameters */}
                        <div className="foundry-params-section" style={{ overflowY: 'auto', maxHeight: '72vh', paddingRight: '10px' }}>
                            <div className="foundry-section-title">
                                Gauge Layers
                            </div>

                            {/* Layer Order Editor */}
                            <LayerOrderEditor />

                            {/* Background Image Layer */}
                            <div className="foundry-param-group">
                                <div className="foundry-param-group-title">Background Image</div>
                                <div className="foundry-param-row">
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>Upload Alignment Asset</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ fontSize: '11px', width: '100%', color: '#ccc' }}
                                        />
                                    </div>
                                </div>
                                {backgroundParams.src && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                        <Slider
                                            label={`Scale: ${backgroundParams.scale.toFixed(2)}`}
                                            value={backgroundParams.scale}
                                            onChange={(v) => updateBackgroundParams({ scale: v })}
                                            min={0.1}
                                            max={3}
                                            step={0.05}
                                        />
                                        <Slider
                                            label={`Opacity: ${backgroundParams.opacity}%`}
                                            value={backgroundParams.opacity}
                                            onChange={(v) => updateBackgroundParams({ opacity: v })}
                                            min={0}
                                            max={100}
                                        />
                                        <div className="foundry-param-row">
                                            <Button variant="secondary" onClick={() => updateBackgroundParams({ x: 0, y: 0, scale: 1 })} fullWidth>Reset Transform</Button>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                <input type="checkbox" checked={backgroundParams.locked} onChange={(e) => updateBackgroundParams({ locked: e.target.checked })} />
                                                Lock
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <TickEditor />
                            <LabelEditor />

                            <div style={{ borderTop: '1px solid #333', margin: '20px 0' }} />

                            <div className="foundry-section-title">
                                Template: {selectedTemplate === 'led_arc' ? 'LED Arc' : selectedTemplate === 'needle' ? 'Needle' : 'Composite'}
                            </div>

                            {/* LED Arc Parameters - shown for led_arc and composite */}
                            {(selectedTemplate === 'led_arc' || selectedTemplate === 'composite') && (
                                <>
                                    <div className="foundry-param-group">
                                        <div className="foundry-param-group-title">Arc Geometry & Style</div>
                                        <div className="foundry-param-row">
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>Orientation</label>
                                                <select
                                                    value={ledArcParams.orientation}
                                                    onChange={(e) => updateLedArcParams({ orientation: e.target.value as any })}
                                                    style={{
                                                        width: '100%',
                                                        background: '#1a1a2a',
                                                        color: '#fff',
                                                        border: '1px solid #333',
                                                        borderRadius: '4px',
                                                        padding: '4px',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    <option value="arc">Radial (Arc)</option>
                                                    <option value="horizontal">Horizontal</option>
                                                    <option value="vertical">Vertical</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }} />
                                        </div>
                                        {ledArcParams.orientation === 'arc' && (
                                            <div className="foundry-param-row">
                                                <Input
                                                    label="Start Angle"
                                                    type="number"
                                                    value={ledArcParams.arcStartAngle}
                                                    onChange={(val) => updateLedArcParams({ arcStartAngle: parseFloat(val) })}
                                                />
                                                <Input
                                                    label="End Angle"
                                                    type="number"
                                                    value={ledArcParams.arcEndAngle}
                                                    onChange={(val) => updateLedArcParams({ arcEndAngle: parseFloat(val) })}
                                                />
                                            </div>
                                        )}
                                        <div className="foundry-param-row">
                                            <Input
                                                label="Inner Radius"
                                                type="number"
                                                value={ledArcParams.innerRadius}
                                                onChange={(v) => updateLedArcParams({ innerRadius: parseFloat(v) || 40 })}
                                            />
                                            <Input
                                                label="Outer Radius"
                                                type="number"
                                                value={ledArcParams.outerRadius}
                                                onChange={(v) => updateLedArcParams({ outerRadius: parseFloat(v) || 80 })}
                                            />
                                        </div>
                                        <div className="foundry-param-row">
                                            <Input
                                                label="Min Value"
                                                type="number"
                                                value={ledArcParams.minValue}
                                                onChange={(v) => updateLedArcParams({ minValue: parseFloat(v) || 0 })}
                                            />
                                            <Input
                                                label="Max Value"
                                                type="number"
                                                value={ledArcParams.maxValue}
                                                onChange={(v) => updateLedArcParams({ maxValue: parseFloat(v) || 100 })}
                                            />
                                        </div>
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

                                        {/* Color Splits */}
                                        <div style={{ borderTop: '1px solid #333', marginTop: '12px', paddingTop: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>
                                                    Color Splits ({ledArcParams.colorSplits.length})
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const newSplit = {
                                                            threshold: ledArcParams.colorSplits.length === 0 ? 50 :
                                                                Math.min(99, Math.max(...ledArcParams.colorSplits.map(s => s.threshold)) + 20),
                                                            onColor: '#ff0000',
                                                            offColor: '#330000',
                                                        };
                                                        updateLedArcParams({
                                                            colorSplits: [...ledArcParams.colorSplits, newSplit]
                                                        });
                                                    }}
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '10px',
                                                        background: '#3a3a3a',
                                                        color: '#ccc',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    + Add Split
                                                </button>
                                            </div>

                                            {ledArcParams.colorSplits.length === 0 && (
                                                <div style={{ color: '#555', fontSize: '11px', fontStyle: 'italic', padding: '8px 0' }}>
                                                    No color splits. Base colors used for all segments.
                                                </div>
                                            )}

                                            {ledArcParams.colorSplits
                                                .map((split, index) => ({ split, index }))
                                                .sort((a, b) => a.split.threshold - b.split.threshold)
                                                .map(({ split, index }) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            background: '#1a1a2a',
                                                            border: '1px solid #333',
                                                            borderRadius: '4px',
                                                            padding: '10px',
                                                            marginBottom: '8px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                                                                Split {index + 1} — from {split.threshold}%
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    const newSplits = ledArcParams.colorSplits.filter((_, i) => i !== index);
                                                                    updateLedArcParams({ colorSplits: newSplits });
                                                                }}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: '#ff4444',
                                                                    cursor: 'pointer',
                                                                    fontSize: '14px',
                                                                    padding: '2px 6px',
                                                                }}
                                                                title="Remove split"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                        <Slider
                                                            label={`Threshold: ${split.threshold}%`}
                                                            value={split.threshold}
                                                            onChange={(v) => {
                                                                const newSplits = [...ledArcParams.colorSplits];
                                                                newSplits[index] = { ...newSplits[index], threshold: v };
                                                                updateLedArcParams({ colorSplits: newSplits });
                                                            }}
                                                            min={1}
                                                            max={99}
                                                        />
                                                        <div className="foundry-param-row" style={{ marginTop: '8px' }}>
                                                            <Input
                                                                label="On Color"
                                                                type="color"
                                                                value={split.onColor}
                                                                onChange={(v) => {
                                                                    const newSplits = [...ledArcParams.colorSplits];
                                                                    newSplits[index] = { ...newSplits[index], onColor: v };
                                                                    updateLedArcParams({ colorSplits: newSplits });
                                                                }}
                                                            />
                                                            <Input
                                                                label="Off Color"
                                                                type="color"
                                                                value={split.offColor}
                                                                onChange={(v) => {
                                                                    const newSplits = [...ledArcParams.colorSplits];
                                                                    newSplits[index] = { ...newSplits[index], offColor: v };
                                                                    updateLedArcParams({ colorSplits: newSplits });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* LED Effects */}
                                    <LedEffectsEditor />
                                </>
                            )}

                            {/* Needle Parameters - shown for needle and composite */}
                            {(selectedTemplate === 'needle' || selectedTemplate === 'composite') && (
                                <div className="foundry-param-group">
                                    <div className="foundry-param-group-title">Needle Geometry & Style</div>
                                    <div className="foundry-param-row">
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>Orientation</label>
                                            <select
                                                value={needleParams.orientation}
                                                onChange={(e) => updateNeedleParams({ orientation: e.target.value as any })}
                                                style={{
                                                    width: '100%',
                                                    background: '#1a1a2a',
                                                    color: '#fff',
                                                    border: '1px solid #333',
                                                    borderRadius: '4px',
                                                    padding: '4px',
                                                    fontSize: '11px'
                                                }}
                                            >
                                                <option value="arc">Radial (Arc)</option>
                                                <option value="horizontal">Horizontal</option>
                                                <option value="vertical">Vertical</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }} />
                                    </div>
                                    {needleParams.orientation === 'arc' && (
                                        <div className="foundry-param-row">
                                            <Input
                                                label="Min Angle"
                                                type="number"
                                                value={needleParams.minAngle}
                                                onChange={(val) => updateNeedleParams({ minAngle: parseFloat(val) })}
                                            />
                                            <Input
                                                label="Max Angle"
                                                type="number"
                                                value={needleParams.maxAngle}
                                                onChange={(val) => updateNeedleParams({ maxAngle: parseFloat(val) })}
                                            />
                                        </div>
                                    )}
                                    <div className="foundry-param-row">
                                        <Input
                                            label="Needle Length"
                                            type="number"
                                            value={needleParams.needleLength}
                                            onChange={(v) => updateNeedleParams({ needleLength: parseFloat(v) || 50 })}
                                            min={10}
                                        />
                                        <Input
                                            label="Needle Width"
                                            type="number"
                                            value={needleParams.needleWidth}
                                            onChange={(v) => updateNeedleParams({ needleWidth: parseFloat(v) || 4 })}
                                            min={1}
                                        />
                                    </div>
                                    <div className="foundry-param-row">
                                        <Input
                                            label="Needle Color"
                                            type="color"
                                            value={needleParams.needleColor}
                                            onChange={(v) => updateNeedleParams({ needleColor: v })}
                                        />
                                        <Input
                                            label="Hub Color"
                                            type="color"
                                            value={needleParams.hubColor}
                                            onChange={(v) => updateNeedleParams({ hubColor: v })}
                                        />
                                    </div>
                                    <div className="foundry-param-row">
                                        <Input
                                            label="Hub Radius"
                                            type="number"
                                            value={needleParams.hubRadius}
                                            onChange={(v) => updateNeedleParams({ hubRadius: parseFloat(v) || 8 })}
                                            min={1}
                                        />
                                        <Slider
                                            label={`Shadow: ${needleParams.shadowOpacity}`}
                                            value={needleParams.shadowOpacity}
                                            onChange={(v) => updateNeedleParams({ shadowOpacity: v })}
                                            min={0}
                                            max={1}
                                            step={0.1}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Encasing */}
                            <EncasingEditor />

                            {/* Shared Colors */}
                            <div className="foundry-param-group">
                                <div className="foundry-param-group-title">Environment</div>

                                <div className="foundry-param-row" style={{ alignItems: 'center', marginBottom: '12px' }}>
                                    <label className="foundry-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                                        <input
                                            type="checkbox"
                                            checked={useTransparentBackground}
                                            onChange={(e) => setTransparentBackground(e.target.checked)}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <span>Transparent Background</span>
                                    </label>
                                </div>

                                {!useTransparentBackground && (
                                    <Input
                                        label="Background (Bake into frames)"
                                        type="color"
                                        value={selectedTemplate === 'needle' ? needleParams.backgroundColor : ledArcParams.backgroundColor}
                                        onChange={(v) => {
                                            if (selectedTemplate === 'needle') updateNeedleParams({ backgroundColor: v });
                                            else updateLedArcParams({ backgroundColor: v });
                                        }}
                                    />
                                )}
                                {selectedTemplate !== 'needle' && (
                                    <Slider
                                        label={`Arc Glow: ${ledArcParams.glowStrength}`}
                                        value={ledArcParams.glowStrength}
                                        onChange={(v) => updateLedArcParams({ glowStrength: v })}
                                        min={0}
                                        max={20}
                                    />
                                )}
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
                                    : 'Generate Frames'
                                }
                            </Button>

                            {/* Generated frames preview */}
                            {generatedFrames.length > 0 && (
                                <div className="foundry-frames-result">
                                    <div className="foundry-frames-count">
                                        {generatedFrames.length} frames generated
                                        {estimatedSize && <span style={{ color: '#888', marginLeft: '8px' }}>({estimatedSize})</span>}
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
                                        {editingWidgetId ? 'Update Widget Frames' : 'Create Widget with Frames'}
                                    </Button>
                                </div>
                            )}

                            {/* AIDA64 Export Section */}
                            {generatedFrames.length > 0 && (
                                <div className="foundry-param-group" style={{ marginTop: '16px' }}>
                                    <div className="foundry-param-group-title">Export for AIDA64</div>
                                    <div className="foundry-param-row">
                                        <Input
                                            label="Filename Prefix"
                                            type="text"
                                            value={exportOptions.prefix}
                                            onChange={(v) => updateExportOptions({ prefix: v || 'frame' })}
                                        />
                                        <Input
                                            label="Padding"
                                            type="number"
                                            value={exportOptions.padding}
                                            onChange={(v) => updateExportOptions({ padding: parseInt(v) || 3 })}
                                            min={1}
                                            max={5}
                                        />
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
                                        Output: {exportOptions.prefix}_001.png, {exportOptions.prefix}_002.png, ...
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            variant="secondary"
                                            onClick={handleExportZip}
                                            disabled={isExporting}
                                            fullWidth
                                        >
                                            {isExporting ? `Exporting... ${Math.round(exportProgress * 100)}%` : 'Download ZIP'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={handleExportIndividual}
                                            disabled={isExporting}
                                            fullWidth
                                        >
                                            Individual PNGs
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="foundry-footer">
                    <span className="foundry-note">
                        Vectors are for authoring only. All elements are baked into PNG frames for AIDA64 compatibility.
                    </span>
                </div>
            </div>
        </div >
    );
};
