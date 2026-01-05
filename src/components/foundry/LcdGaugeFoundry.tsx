/**
 * LcdGaugeFoundry Component
 * Modal interface for creating LCD-style gauge displays
 * - Numeric: 7-segment digit displays (animated frames for value range)
 * - Text: LCD-style text labels (static single image)
 * - Bar: VU meter style segmented bar graphs (animated frames 0-100%)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useLcdGaugeFoundryStore, LcdDisplayType, LcdSegmentStyle } from '@/stores/lcdGaugeFoundryStore';
import { useWidgetStore, createDefaultImageWidget, createDefaultImageSequenceWidget } from '@/stores';
import { Button, Slider, Input, Checkbox, Select } from '@/components/ui';
import { renderLcdGauge } from './lcdGaugeRenderUtils';

// ============================================================================
// Preview Canvas Component
// ============================================================================

const LcdGaugePreviewCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const store = useLcdGaugeFoundryStore();
    const {
        displayType,
        previewValue,
        outputWidth,
        outputHeight,
        useTransparentBackground,
        backgroundColor,
        backgroundPadding,
        backgroundBorderRadius,
        showBackground,
        segmentStyle,
        numericParams,
        textParams,
        barParams,
    } = store;

    // Create a JSON key for deep comparison
    const paramsKey = JSON.stringify({ segmentStyle, numericParams, textParams, barParams });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        renderLcdGauge(
            ctx,
            displayType,
            previewValue,
            textParams.text,
            outputWidth,
            outputHeight,
            numericParams,
            textParams,
            barParams,
            segmentStyle,
            useTransparentBackground,
            backgroundColor,
            backgroundPadding,
            backgroundBorderRadius,
            showBackground
        );
    }, [displayType, previewValue, outputWidth, outputHeight, useTransparentBackground, backgroundColor, backgroundPadding, backgroundBorderRadius, showBackground, paramsKey, numericParams, textParams, barParams, segmentStyle]);

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
                }}
            />
            <div style={{ fontSize: 11, color: '#888' }}>
                {displayType === 'numeric' && `Value: ${previewValue}`}
                {displayType === 'text' && `Text: "${textParams.text}"`}
                {displayType === 'bar' && `${previewValue}%`}
            </div>
        </div>
    );
};

// ============================================================================
// Numeric Display Editor
// ============================================================================

const NumericEditor: React.FC = () => {
    const { numericParams, updateNumericParams, segmentStyle, updateSegmentStyle } = useLcdGaugeFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Numeric Display</div>

            <div className="foundry-param-row">
                <Slider
                    label="Digit Count"
                    value={numericParams.digitCount}
                    onChange={(v) => updateNumericParams({ digitCount: v })}
                    min={1}
                    max={8}
                />
                <Select
                    label="Alignment"
                    value={numericParams.alignment}
                    options={[
                        { value: 'left', label: 'Left' },
                        { value: 'center', label: 'Center' },
                        { value: 'right', label: 'Right' },
                    ]}
                    onChange={(v) => updateNumericParams({ alignment: v as 'left' | 'center' | 'right' })}
                />
            </div>

            <div className="foundry-param-row">
                <Checkbox
                    label="Show Decimal"
                    checked={numericParams.showDecimal}
                    onChange={(v) => updateNumericParams({ showDecimal: v })}
                />
                {numericParams.showDecimal && (
                    <Slider
                        label="Decimal Places"
                        value={numericParams.decimalPlaces}
                        onChange={(v) => updateNumericParams({ decimalPlaces: v })}
                        min={1}
                        max={3}
                    />
                )}
            </div>

            <div className="foundry-param-row">
                <Checkbox
                    label="Leading Zeros"
                    checked={numericParams.showLeadingZeros}
                    onChange={(v) => updateNumericParams({ showLeadingZeros: v })}
                />
                <Checkbox
                    label="Show Sign (+/-)"
                    checked={numericParams.showSign}
                    onChange={(v) => updateNumericParams({ showSign: v })}
                />
            </div>

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Value Range (for animation)</div>

            <div className="foundry-param-row">
                <Slider
                    label="Min Value"
                    value={numericParams.minValue}
                    onChange={(v) => updateNumericParams({ minValue: v })}
                    min={-999}
                    max={numericParams.maxValue - 1}
                />
                <Slider
                    label="Max Value"
                    value={numericParams.maxValue}
                    onChange={(v) => updateNumericParams({ maxValue: v })}
                    min={numericParams.minValue + 1}
                    max={9999}
                />
            </div>

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Digit Size</div>

            <div className="foundry-param-row">
                <Slider
                    label="Digit Width"
                    value={numericParams.digitWidth}
                    onChange={(v) => updateNumericParams({ digitWidth: v })}
                    min={20}
                    max={80}
                />
                <Slider
                    label="Digit Height"
                    value={numericParams.digitHeight}
                    onChange={(v) => updateNumericParams({ digitHeight: v })}
                    min={30}
                    max={120}
                />
            </div>

            <Slider
                label="Digit Spacing"
                value={numericParams.digitSpacing}
                onChange={(v) => updateNumericParams({ digitSpacing: v })}
                min={2}
                max={20}
            />

            <SegmentStyleEditor segmentStyle={segmentStyle} updateSegmentStyle={updateSegmentStyle} />
        </div>
    );
};

// ============================================================================
// Text Display Editor
// ============================================================================

const TextEditor: React.FC = () => {
    const { textParams, updateTextParams, segmentStyle, updateSegmentStyle } = useLcdGaugeFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Text Display</div>

            <Input
                label="Text (max 12 chars)"
                type="text"
                value={textParams.text}
                onChange={(v) => updateTextParams({ text: v.substring(0, 12) })}
            />

            <Checkbox
                label="Uppercase"
                checked={textParams.uppercase}
                onChange={(v) => updateTextParams({ uppercase: v })}
            />

            <div className="foundry-param-row">
                <Slider
                    label="Character Width"
                    value={textParams.digitWidth}
                    onChange={(v) => updateTextParams({ digitWidth: v })}
                    min={20}
                    max={80}
                />
                <Slider
                    label="Character Height"
                    value={textParams.digitHeight}
                    onChange={(v) => updateTextParams({ digitHeight: v })}
                    min={30}
                    max={120}
                />
            </div>

            <Slider
                label="Character Spacing"
                value={textParams.digitSpacing}
                onChange={(v) => updateTextParams({ digitSpacing: v })}
                min={2}
                max={20}
            />

            <SegmentStyleEditor segmentStyle={segmentStyle} updateSegmentStyle={updateSegmentStyle} />
        </div>
    );
};

// ============================================================================
// Bar Graph Editor
// ============================================================================

const BarGraphEditor: React.FC = () => {
    const { barParams, updateBarParams, segmentStyle, updateSegmentStyle, addColorSplit, removeColorSplit, updateColorSplit } = useLcdGaugeFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Bar Graph</div>

            <div className="foundry-param-row">
                <Select
                    label="Orientation"
                    value={barParams.orientation}
                    options={[
                        { value: 'horizontal', label: 'Horizontal' },
                        { value: 'vertical', label: 'Vertical' },
                    ]}
                    onChange={(v) => updateBarParams({ orientation: v as 'horizontal' | 'vertical' })}
                />
                <Select
                    label="Fill Direction"
                    value={barParams.fillDirection}
                    options={
                        barParams.orientation === 'horizontal'
                            ? [
                                { value: 'left_to_right', label: 'Left → Right' },
                                { value: 'right_to_left', label: 'Right → Left' },
                            ]
                            : [
                                { value: 'bottom_to_top', label: 'Bottom → Top' },
                                { value: 'top_to_bottom', label: 'Top → Bottom' },
                            ]
                    }
                    onChange={(v) => updateBarParams({ fillDirection: v as any })}
                />
            </div>

            <Slider
                label="Segment Count"
                value={barParams.segmentCount}
                onChange={(v) => updateBarParams({ segmentCount: v })}
                min={5}
                max={50}
            />

            <div className="foundry-param-row">
                <Slider
                    label="Segment Width"
                    value={barParams.segmentWidth}
                    onChange={(v) => updateBarParams({ segmentWidth: v })}
                    min={5}
                    max={40}
                />
                <Slider
                    label="Segment Height"
                    value={barParams.segmentHeight}
                    onChange={(v) => updateBarParams({ segmentHeight: v })}
                    min={5}
                    max={60}
                />
            </div>

            <Slider
                label="Segment Gap"
                value={barParams.segmentGap}
                onChange={(v) => updateBarParams({ segmentGap: v })}
                min={1}
                max={10}
            />

            <div className="foundry-param-row">
                <Checkbox
                    label="Peak Hold"
                    checked={barParams.showPeakHold}
                    onChange={(v) => updateBarParams({ showPeakHold: v })}
                />
                {barParams.showPeakHold && (
                    <Input
                        label="Peak Color"
                        type="color"
                        value={barParams.peakColor}
                        onChange={(v) => updateBarParams({ peakColor: v })}
                    />
                )}
            </div>

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Color Zones</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {barParams.colorSplits.map((split, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Input
                            label=""
                            type="color"
                            value={split.color}
                            onChange={(v) => updateColorSplit(index, { color: v })}
                        />
                        <div style={{ flex: 1 }}>
                            <Slider
                                label={`Up to ${split.threshold}%`}
                                value={split.threshold}
                                onChange={(v) => updateColorSplit(index, { threshold: v })}
                                min={1}
                                max={100}
                            />
                        </div>
                        {barParams.colorSplits.length > 1 && (
                            <button
                                onClick={() => removeColorSplit(index)}
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

            {barParams.colorSplits.length < 5 && (
                <Button
                    variant="secondary"
                    onClick={() => addColorSplit({ threshold: 100, color: '#ff0000' })}
                >
                    + Add Color Zone
                </Button>
            )}

            <SegmentStyleEditor segmentStyle={segmentStyle} updateSegmentStyle={updateSegmentStyle} />
        </div>
    );
};

// ============================================================================
// Shared Segment Style Editor
// ============================================================================

interface SegmentStyleEditorProps {
    segmentStyle: LcdSegmentStyle;
    updateSegmentStyle: (params: Partial<LcdSegmentStyle>) => void;
}

const SegmentStyleEditor: React.FC<SegmentStyleEditorProps> = ({ segmentStyle, updateSegmentStyle }) => {
    return (
        <>
            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Segment Style</div>

            <div className="foundry-param-row">
                <Input
                    label="On Color"
                    type="color"
                    value={segmentStyle.onColor}
                    onChange={(v) => updateSegmentStyle({ onColor: v })}
                />
                <Input
                    label="Off Color"
                    type="color"
                    value={segmentStyle.offColor}
                    onChange={(v) => updateSegmentStyle({ offColor: v })}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Segment Width"
                    value={segmentStyle.segmentWidth}
                    onChange={(v) => updateSegmentStyle({ segmentWidth: v })}
                    min={3}
                    max={15}
                />
                <Slider
                    label="Segment Gap"
                    value={segmentStyle.segmentGap}
                    onChange={(v) => updateSegmentStyle({ segmentGap: v })}
                    min={1}
                    max={8}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Glow Strength"
                    value={segmentStyle.glowStrength}
                    onChange={(v) => updateSegmentStyle({ glowStrength: v })}
                    min={0}
                    max={20}
                />
                <Input
                    label="Glow Color"
                    type="color"
                    value={segmentStyle.glowColor}
                    onChange={(v) => updateSegmentStyle({ glowColor: v })}
                />
            </div>

            <Slider
                label="Skew Angle"
                value={segmentStyle.skew}
                onChange={(v) => updateSegmentStyle({ skew: v })}
                min={-20}
                max={20}
            />

            <div className="foundry-param-row">
                <Checkbox
                    label="Beveled"
                    checked={segmentStyle.bevel}
                    onChange={(v) => updateSegmentStyle({ bevel: v })}
                />
                <Checkbox
                    label="Rounded"
                    checked={segmentStyle.rounded}
                    onChange={(v) => updateSegmentStyle({ rounded: v })}
                />
            </div>
        </>
    );
};

// ============================================================================
// Main LcdGaugeFoundry Component
// ============================================================================

export const LcdGaugeFoundry: React.FC = () => {
    const {
        isOpen,
        editingWidgetId,
        displayType,
        previewValue,
        outputWidth,
        outputHeight,
        useTransparentBackground,
        backgroundColor,
        backgroundPadding,
        backgroundBorderRadius,
        showBackground,
        segmentStyle,
        numericParams,
        textParams,
        barParams,
        generatedImage,
        generatedFrames,
        frameCount,
        isGenerating,
        generationProgress,
        closeLcdGaugeFoundry,
        setDisplayType,
        setPreviewValue,
        setOutputSize,
        setTransparentBackground,
        setBackgroundColor,
        setBackgroundPadding,
        setBackgroundBorderRadius,
        setShowBackground,
        setGeneratedImage,
        setGeneratedFrames,
        setFrameCount,
        setGenerating,
    } = useLcdGaugeFoundryStore();

    const { addWidget, updateWidget } = useWidgetStore();

    // Determine if this is an animated (frame sequence) or static mode
    const isAnimated = displayType === 'numeric' || displayType === 'bar';

    // Generate frames for numeric/bar or single image for text
    const generateOutput = useCallback(async () => {
        setGenerating(true, 0);

        if (displayType === 'text') {
            // Text is always a static single image
            const canvas = document.createElement('canvas');
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setGenerating(false);
                return;
            }

            renderLcdGauge(
                ctx,
                displayType,
                0,
                textParams.text,
                outputWidth,
                outputHeight,
                numericParams,
                textParams,
                barParams,
                segmentStyle,
                useTransparentBackground,
                backgroundColor,
                backgroundPadding,
                backgroundBorderRadius,
                showBackground
            );

            const dataUrl = canvas.toDataURL('image/png');
            setGeneratedImage(dataUrl);
            setGeneratedFrames([]);
            setGenerating(false);
        } else {
            // Numeric and Bar generate frame sequences
            const frames: string[] = [];
            const canvas = document.createElement('canvas');
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setGenerating(false);
                return;
            }

            // Generate frames asynchronously to not block UI
            for (let i = 0; i < frameCount; i++) {
                // Calculate value for this frame
                let value: number;
                if (displayType === 'bar') {
                    // Bar: 0-100% mapped to frameCount frames
                    value = (i / (frameCount - 1)) * 100;
                } else {
                    // Numeric: minValue to maxValue mapped to frameCount frames
                    const { minValue, maxValue } = numericParams;
                    value = minValue + (i / (frameCount - 1)) * (maxValue - minValue);
                }

                // Clear and render
                ctx.clearRect(0, 0, outputWidth, outputHeight);
                renderLcdGauge(
                    ctx,
                    displayType,
                    value,
                    textParams.text,
                    outputWidth,
                    outputHeight,
                    numericParams,
                    textParams,
                    barParams,
                    segmentStyle,
                    useTransparentBackground,
                    backgroundColor,
                    backgroundPadding,
                    backgroundBorderRadius,
                    showBackground
                );

                frames.push(canvas.toDataURL('image/png'));

                // Update progress and yield to UI
                if (i % 5 === 0) {
                    setGenerating(true, Math.round((i / frameCount) * 100));
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            setGeneratedFrames(frames);
            setGeneratedImage(null);
            setGenerating(false);
        }
    }, [displayType, frameCount, outputWidth, outputHeight, useTransparentBackground, backgroundColor, backgroundPadding, backgroundBorderRadius, showBackground, segmentStyle, numericParams, textParams, barParams, setGeneratedImage, setGeneratedFrames, setGenerating]);

    const addToCanvas = useCallback(() => {
        // Build foundry params to save with widget for regeneration
        const foundryParams = {
            displayType,
            frameCount,
            useTransparentBackground,
            backgroundColor,
            backgroundPadding,
            backgroundBorderRadius,
            showBackground,
            segmentStyle: { ...segmentStyle },
            numericParams: { ...numericParams },
            textParams: { ...textParams },
            barParams: { ...barParams },
        };

        if (isAnimated) {
            // Numeric and Bar use ImageSequenceWidget
            if (generatedFrames.length === 0) return;

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
                widget.name = `LCD ${displayType === 'numeric' ? 'Numeric' : 'Bar'}`;
                widget.sourceFoundry = 'lcd';
                widget.foundryParams = foundryParams;

                addWidget(widget);
            }
        } else {
            // Text uses static ImageWidget
            if (!generatedImage) return;

            const widget = createDefaultImageWidget();
            widget.src = generatedImage;
            widget.width = outputWidth;
            widget.height = outputHeight;
            widget.name = `LCD "${textParams.text}"`;
            widget.rotationEnabled = false;
            widget.sensorBinding = null;

            addWidget(widget);
        }

        closeLcdGaugeFoundry();
    }, [isAnimated, generatedFrames, generatedImage, outputWidth, outputHeight, displayType, frameCount, useTransparentBackground, backgroundColor, backgroundPadding, backgroundBorderRadius, showBackground, segmentStyle, numericParams, textParams, barParams, addWidget, updateWidget, editingWidgetId, closeLcdGaugeFoundry]);

    const hasOutput = isAnimated ? generatedFrames.length > 0 : generatedImage !== null;

    if (!isOpen) return null;

    const typeButtons: { id: LcdDisplayType; label: string; icon: string }[] = [
        { id: 'numeric', label: 'Numeric', icon: '8' },
        { id: 'text', label: 'Text', icon: 'A' },
        { id: 'bar', label: 'Bar Graph', icon: '▮' },
    ];

    return (
        <div className="foundry-overlay">
            <div className="foundry-modal" style={{ maxWidth: 1000 }}>
                <div className="foundry-header">
                    <div className="foundry-title">
                        <span className="foundry-icon">7</span>
                        LCD Gauge Foundry
                    </div>
                    <span className="foundry-subtitle">
                        {displayType === 'numeric' && '7-Segment Numeric Display'}
                        {displayType === 'text' && '7-Segment Text Label'}
                        {displayType === 'bar' && 'Segmented VU Meter Bar'}
                    </span>
                    <button className="foundry-close" onClick={closeLcdGaugeFoundry}>
                        &times;
                    </button>
                </div>

                <div className="foundry-content">
                    {/* Left: Preview */}
                    <div className="foundry-preview-section">
                        <div className="foundry-section-title">Preview</div>
                        <div className="foundry-canvas-container">
                            <LcdGaugePreviewCanvas />
                        </div>

                        {(displayType === 'numeric' || displayType === 'bar') && (
                            <div style={{ marginTop: 12 }}>
                                <Slider
                                    label="Preview Value"
                                    value={previewValue}
                                    onChange={setPreviewValue}
                                    min={0}
                                    max={100}
                                />
                            </div>
                        )}

                        <div className="foundry-template-selector">
                            {typeButtons.map((t) => (
                                <button
                                    key={t.id}
                                    className={`foundry-template-btn ${displayType === t.id ? 'active' : ''}`}
                                    onClick={() => setDisplayType(t.id)}
                                >
                                    <span style={{ fontFamily: 'monospace', marginRight: 4 }}>{t.icon}</span>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Parameters */}
                    <div className="foundry-params-section">
                        <div className="foundry-section-title">Parameters</div>

                        {displayType === 'numeric' && <NumericEditor />}
                        {displayType === 'text' && <TextEditor />}
                        {displayType === 'bar' && <BarGraphEditor />}
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
                                    min={50}
                                    max={600}
                                />
                                <Slider
                                    label="Height"
                                    value={outputHeight}
                                    onChange={(v) => setOutputSize(outputWidth, v)}
                                    min={50}
                                    max={400}
                                />
                            </div>

                            {isAnimated && (
                                <Slider
                                    label="Frame Count"
                                    value={frameCount}
                                    onChange={setFrameCount}
                                    min={11}
                                    max={201}
                                />
                            )}

                            <Checkbox
                                label="Transparent Background"
                                checked={useTransparentBackground}
                                onChange={setTransparentBackground}
                            />

                            {!useTransparentBackground && (
                                <>
                                    <Checkbox
                                        label="Show Background"
                                        checked={showBackground}
                                        onChange={setShowBackground}
                                    />

                                    {showBackground && (
                                        <>
                                            <Input
                                                label="Background Color"
                                                type="color"
                                                value={backgroundColor}
                                                onChange={setBackgroundColor}
                                            />
                                            <div className="foundry-param-row">
                                                <Slider
                                                    label="Padding"
                                                    value={backgroundPadding}
                                                    onChange={setBackgroundPadding}
                                                    min={0}
                                                    max={30}
                                                />
                                                <Slider
                                                    label="Border Radius"
                                                    value={backgroundBorderRadius}
                                                    onChange={setBackgroundBorderRadius}
                                                    min={0}
                                                    max={20}
                                                />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <Button
                            variant="primary"
                            onClick={generateOutput}
                            disabled={isGenerating}
                            fullWidth
                        >
                            {isGenerating
                                ? `Generating... ${generationProgress}%`
                                : isAnimated
                                    ? `Generate ${frameCount} Frames`
                                    : 'Generate Image'}
                        </Button>

                        {hasOutput && (
                            <div className="foundry-frames-result">
                                <div className="foundry-frames-count">
                                    {isAnimated
                                        ? `${generatedFrames.length} frames generated`
                                        : 'Image generated'}
                                </div>
                                <div className="foundry-frames-preview">
                                    <img
                                        src={isAnimated ? generatedFrames[Math.floor(generatedFrames.length / 2)] : generatedImage!}
                                        alt="Generated LCD"
                                        style={{ maxWidth: '100%', borderRadius: 4 }}
                                    />
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
                        {isAnimated
                            ? 'Animated LCD displays - generates frame sequences for ImageSequenceWidget.'
                            : 'Static LCD-style displays - perfect for labels.'}
                    </div>
                </div>
            </div>
        </div>
    );
};
