/**
 * ClockFoundry Component
 * Modal interface for creating LCD, Flip, and Analog clock mechanisms
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useClockFoundryStore, ClockTemplate, ClockTimeUnit, ClockHourFormat } from '@/stores/clockFoundryStore';
import { useWidgetStore, createDefaultImageSequenceWidget } from '@/stores';
import { Button, Slider, Input, Checkbox, Select } from '@/components/ui';
import {
    renderLcdClock,
    renderFlipClock,
    renderAnalogClock,
    parseTimeString,
} from './clockRenderUtils';

// ============================================================================
// Preview Canvas Component
// ============================================================================

const ClockPreviewCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [useRealTime, setUseRealTime] = useState(true);
    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    });
    const store = useClockFoundryStore();
    const {
        selectedTemplate,
        previewTime,
        outputWidth,
        outputHeight,
        useTransparentBackground,
        lcdParams,
        flipParams,
        analogParams,
        timeUnit,
        hourFormat,
    } = store;

    // Create a JSON key for deep comparison to detect nested object changes
    const paramsKey = JSON.stringify({ lcdParams, flipParams, analogParams, timeUnit, hourFormat });

    // Real-time clock update
    useEffect(() => {
        if (!useRealTime) return;

        const updateTime = () => {
            const now = new Date();
            setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
        };

        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [useRealTime]);

    // Determine which time to display
    const displayTimeStr = useRealTime ? currentTime : previewTime;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const time = parseTimeString(displayTimeStr);

        // For digital clocks, show only the selected time unit
        let displayTime = displayTimeStr;
        if (selectedTemplate === 'lcd' || selectedTemplate === 'flip') {
            if (timeUnit === 'hours') {
                // For 12-hour format, convert 0 to 12
                let displayHour = time.hours;
                if (hourFormat === '12h') {
                    displayHour = time.hours % 12;
                    if (displayHour === 0) displayHour = 12;
                }
                displayTime = displayHour.toString().padStart(2, '0');
            } else if (timeUnit === 'minutes') {
                displayTime = time.minutes.toString().padStart(2, '0');
            } else {
                displayTime = time.seconds.toString().padStart(2, '0');
            }
        }

        switch (selectedTemplate) {
            case 'lcd':
                renderLcdClock(ctx, displayTime, outputWidth, outputHeight, { ...lcdParams, digitCount: 2 }, useTransparentBackground);
                break;
            case 'flip':
                renderFlipClock(ctx, displayTime, outputWidth, outputHeight, { ...flipParams, digitCount: 2 }, useTransparentBackground);
                break;
            case 'analog':
                renderAnalogClock(ctx, time.hours, time.minutes, time.seconds, outputWidth, outputHeight, analogParams, useTransparentBackground);
                break;
        }
    }, [selectedTemplate, displayTimeStr, outputWidth, outputHeight, useTransparentBackground, paramsKey, lcdParams, flipParams, analogParams, timeUnit, hourFormat]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#888' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={useRealTime}
                        onChange={(e) => setUseRealTime(e.target.checked)}
                    />
                    Live Preview
                </label>
                <span>{displayTimeStr}</span>
            </div>
        </div>
    );
};

// ============================================================================
// LCD Clock Editor
// ============================================================================

const LcdClockEditor: React.FC = () => {
    const { lcdParams, updateLcdParams, updateLcdSegmentStyle } = useClockFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">LCD Display</div>

            <div className="foundry-param-row">
                <Select
                    label="Digits"
                    value={String(lcdParams.digitCount)}
                    options={[
                        { value: '2', label: '2 (HH)' },
                        { value: '4', label: '4 (HH:MM)' },
                        { value: '6', label: '6 (HH:MM:SS)' },
                    ]}
                    onChange={(v) => updateLcdParams({ digitCount: parseInt(v) })}
                />
                <Checkbox
                    label="Show Colons"
                    checked={lcdParams.showColons}
                    onChange={(v) => updateLcdParams({ showColons: v })}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Digit Width"
                    value={lcdParams.digitWidth}
                    onChange={(v) => updateLcdParams({ digitWidth: v })}
                    min={20}
                    max={80}
                />
                <Slider
                    label="Digit Height"
                    value={lcdParams.digitHeight}
                    onChange={(v) => updateLcdParams({ digitHeight: v })}
                    min={30}
                    max={120}
                />
            </div>

            <Slider
                label="Digit Spacing"
                value={lcdParams.digitSpacing}
                onChange={(v) => updateLcdParams({ digitSpacing: v })}
                min={2}
                max={20}
            />

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Segment Style</div>

            <div className="foundry-param-row">
                <Input
                    label="On Color"
                    type="color"
                    value={lcdParams.segmentStyle.onColor}
                    onChange={(v) => updateLcdSegmentStyle({ onColor: v })}
                />
                <Input
                    label="Off Color"
                    type="color"
                    value={lcdParams.segmentStyle.offColor}
                    onChange={(v) => updateLcdSegmentStyle({ offColor: v })}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Segment Width"
                    value={lcdParams.segmentStyle.segmentWidth}
                    onChange={(v) => updateLcdSegmentStyle({ segmentWidth: v })}
                    min={3}
                    max={15}
                />
                <Slider
                    label="Segment Gap"
                    value={lcdParams.segmentStyle.segmentGap}
                    onChange={(v) => updateLcdSegmentStyle({ segmentGap: v })}
                    min={1}
                    max={8}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Glow Strength"
                    value={lcdParams.segmentStyle.glowStrength}
                    onChange={(v) => updateLcdSegmentStyle({ glowStrength: v })}
                    min={0}
                    max={20}
                />
                <Input
                    label="Glow Color"
                    type="color"
                    value={lcdParams.segmentStyle.glowColor}
                    onChange={(v) => updateLcdSegmentStyle({ glowColor: v })}
                />
            </div>

            <Slider
                label="Skew Angle"
                value={lcdParams.segmentStyle.skew}
                onChange={(v) => updateLcdSegmentStyle({ skew: v })}
                min={-20}
                max={20}
            />

            <div className="foundry-param-row">
                <Checkbox
                    label="Beveled"
                    checked={lcdParams.segmentStyle.bevel}
                    onChange={(v) => updateLcdSegmentStyle({ bevel: v })}
                />
                <Checkbox
                    label="Rounded"
                    checked={lcdParams.segmentStyle.rounded}
                    onChange={(v) => updateLcdSegmentStyle({ rounded: v })}
                />
            </div>

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Background</div>

            <Checkbox
                label="Show Background"
                checked={lcdParams.showBackground}
                onChange={(v) => updateLcdParams({ showBackground: v })}
            />

            {lcdParams.showBackground && (
                <>
                    <Input
                        label="Background Color"
                        type="color"
                        value={lcdParams.backgroundColor}
                        onChange={(v) => updateLcdParams({ backgroundColor: v })}
                    />
                    <div className="foundry-param-row">
                        <Slider
                            label="Padding"
                            value={lcdParams.backgroundPadding}
                            onChange={(v) => updateLcdParams({ backgroundPadding: v })}
                            min={0}
                            max={30}
                        />
                        <Slider
                            label="Border Radius"
                            value={lcdParams.backgroundBorderRadius}
                            onChange={(v) => updateLcdParams({ backgroundBorderRadius: v })}
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
// Flip Clock Editor
// ============================================================================

const FlipClockEditor: React.FC = () => {
    const { flipParams, updateFlipParams, updateFlipCardStyle } = useClockFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Flip Clock Display</div>

            <div className="foundry-param-row">
                <Select
                    label="Digits"
                    value={String(flipParams.digitCount)}
                    options={[
                        { value: '2', label: '2 (HH)' },
                        { value: '4', label: '4 (HH:MM)' },
                        { value: '6', label: '6 (HH:MM:SS)' },
                    ]}
                    onChange={(v) => updateFlipParams({ digitCount: parseInt(v) })}
                />
                <Checkbox
                    label="Show Colons"
                    checked={flipParams.showColons}
                    onChange={(v) => updateFlipParams({ showColons: v })}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Digit Width"
                    value={flipParams.digitWidth}
                    onChange={(v) => updateFlipParams({ digitWidth: v })}
                    min={30}
                    max={100}
                />
                <Slider
                    label="Digit Height"
                    value={flipParams.digitHeight}
                    onChange={(v) => updateFlipParams({ digitHeight: v })}
                    min={40}
                    max={150}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Spacing"
                    value={flipParams.digitSpacing}
                    onChange={(v) => updateFlipParams({ digitSpacing: v })}
                    min={2}
                    max={20}
                />
                <Slider
                    label="Flip Gap"
                    value={flipParams.flipGap}
                    onChange={(v) => updateFlipParams({ flipGap: v })}
                    min={1}
                    max={10}
                />
            </div>

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Typography</div>

            <Select
                label="Font Family"
                value={flipParams.fontFamily}
                options={[
                    { value: 'Arial Black', label: 'Arial Black' },
                    { value: 'Impact', label: 'Impact' },
                    { value: 'Helvetica Neue', label: 'Helvetica Neue' },
                    { value: 'Roboto', label: 'Roboto' },
                    { value: 'monospace', label: 'Monospace' },
                ]}
                onChange={(v) => updateFlipParams({ fontFamily: v })}
            />

            <Slider
                label="Font Size"
                value={flipParams.fontSize}
                onChange={(v) => updateFlipParams({ fontSize: v })}
                min={24}
                max={100}
            />

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Card Style</div>

            <div className="foundry-param-row">
                <Input
                    label="Face Color"
                    type="color"
                    value={flipParams.cardStyle.faceColor}
                    onChange={(v) => updateFlipCardStyle({ faceColor: v })}
                />
                <Input
                    label="Text Color"
                    type="color"
                    value={flipParams.cardStyle.textColor}
                    onChange={(v) => updateFlipCardStyle({ textColor: v })}
                />
            </div>

            <div className="foundry-param-row">
                <Input
                    label="Hinge Color"
                    type="color"
                    value={flipParams.cardStyle.hingeColor}
                    onChange={(v) => updateFlipCardStyle({ hingeColor: v })}
                />
                <Input
                    label="Border Color"
                    type="color"
                    value={flipParams.cardStyle.borderColor}
                    onChange={(v) => updateFlipCardStyle({ borderColor: v })}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Border Radius"
                    value={flipParams.cardStyle.borderRadius}
                    onChange={(v) => updateFlipCardStyle({ borderRadius: v })}
                    min={0}
                    max={15}
                />
                <Slider
                    label="Shadow"
                    value={flipParams.cardStyle.shadowIntensity}
                    onChange={(v) => updateFlipCardStyle({ shadowIntensity: v })}
                    min={0}
                    max={1}
                    step={0.1}
                />
            </div>

            <Checkbox
                label="Glossy Effect"
                checked={flipParams.cardStyle.glossy}
                onChange={(v) => updateFlipCardStyle({ glossy: v })}
            />
        </div>
    );
};

// ============================================================================
// Analog Clock Editor
// ============================================================================

const AnalogClockEditor: React.FC = () => {
    const { analogParams, updateAnalogParams, updateHourHand, updateMinuteHand, updateSecondHand } = useClockFoundryStore();

    const handShapeOptions = [
        { value: 'line', label: 'Line' },
        { value: 'arrow', label: 'Arrow' },
        { value: 'sword', label: 'Sword' },
        { value: 'spade', label: 'Spade' },
        { value: 'diamond', label: 'Diamond' },
    ];

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Clock Face</div>

            <div className="foundry-param-row">
                <Slider
                    label="Face Radius %"
                    value={analogParams.faceRadius}
                    onChange={(v) => updateAnalogParams({ faceRadius: v })}
                    min={50}
                    max={100}
                />
                <Slider
                    label="Tick Radius %"
                    value={analogParams.tickRadius}
                    onChange={(v) => updateAnalogParams({ tickRadius: v })}
                    min={70}
                    max={100}
                />
            </div>

            <div className="foundry-param-row">
                <Slider
                    label="Center X Offset"
                    value={analogParams.centerOffsetX}
                    onChange={(v) => updateAnalogParams({ centerOffsetX: v })}
                    min={-50}
                    max={50}
                />
                <Slider
                    label="Center Y Offset"
                    value={analogParams.centerOffsetY}
                    onChange={(v) => updateAnalogParams({ centerOffsetY: v })}
                    min={-50}
                    max={50}
                />
            </div>

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Hour Hand</div>

            <Checkbox
                label="Enabled"
                checked={analogParams.hourHand.enabled}
                onChange={(v) => updateHourHand({ enabled: v })}
            />

            {analogParams.hourHand.enabled && (
                <>
                    <div className="foundry-param-row">
                        <Slider
                            label="Length %"
                            value={analogParams.hourHand.length}
                            onChange={(v) => updateHourHand({ length: v })}
                            min={20}
                            max={80}
                        />
                        <Slider
                            label="Width"
                            value={analogParams.hourHand.width}
                            onChange={(v) => updateHourHand({ width: v })}
                            min={2}
                            max={15}
                        />
                    </div>
                    <div className="foundry-param-row">
                        <Input
                            label="Color"
                            type="color"
                            value={analogParams.hourHand.color}
                            onChange={(v) => updateHourHand({ color: v })}
                        />
                        <Select
                            label="Shape"
                            value={analogParams.hourHand.shape}
                            options={handShapeOptions}
                            onChange={(v) => updateHourHand({ shape: v as any })}
                        />
                    </div>
                    <div className="foundry-param-row">
                        <Slider
                            label="Offset X"
                            value={analogParams.hourHand.offsetX}
                            onChange={(v) => updateHourHand({ offsetX: v })}
                            min={-30}
                            max={30}
                        />
                        <Slider
                            label="Offset Y"
                            value={analogParams.hourHand.offsetY}
                            onChange={(v) => updateHourHand({ offsetY: v })}
                            min={-30}
                            max={30}
                        />
                    </div>
                </>
            )}

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Minute Hand</div>

            <Checkbox
                label="Enabled"
                checked={analogParams.minuteHand.enabled}
                onChange={(v) => updateMinuteHand({ enabled: v })}
            />

            {analogParams.minuteHand.enabled && (
                <>
                    <div className="foundry-param-row">
                        <Slider
                            label="Length %"
                            value={analogParams.minuteHand.length}
                            onChange={(v) => updateMinuteHand({ length: v })}
                            min={30}
                            max={95}
                        />
                        <Slider
                            label="Width"
                            value={analogParams.minuteHand.width}
                            onChange={(v) => updateMinuteHand({ width: v })}
                            min={2}
                            max={12}
                        />
                    </div>
                    <div className="foundry-param-row">
                        <Input
                            label="Color"
                            type="color"
                            value={analogParams.minuteHand.color}
                            onChange={(v) => updateMinuteHand({ color: v })}
                        />
                        <Select
                            label="Shape"
                            value={analogParams.minuteHand.shape}
                            options={handShapeOptions}
                            onChange={(v) => updateMinuteHand({ shape: v as any })}
                        />
                    </div>
                    <div className="foundry-param-row">
                        <Slider
                            label="Offset X"
                            value={analogParams.minuteHand.offsetX}
                            onChange={(v) => updateMinuteHand({ offsetX: v })}
                            min={-30}
                            max={30}
                        />
                        <Slider
                            label="Offset Y"
                            value={analogParams.minuteHand.offsetY}
                            onChange={(v) => updateMinuteHand({ offsetY: v })}
                            min={-30}
                            max={30}
                        />
                    </div>
                </>
            )}

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Second Hand</div>

            <Checkbox
                label="Enabled"
                checked={analogParams.secondHand.enabled}
                onChange={(v) => updateSecondHand({ enabled: v })}
            />

            {analogParams.secondHand.enabled && (
                <>
                    <div className="foundry-param-row">
                        <Slider
                            label="Length %"
                            value={analogParams.secondHand.length}
                            onChange={(v) => updateSecondHand({ length: v })}
                            min={40}
                            max={95}
                        />
                        <Slider
                            label="Width"
                            value={analogParams.secondHand.width}
                            onChange={(v) => updateSecondHand({ width: v })}
                            min={1}
                            max={6}
                        />
                    </div>
                    <div className="foundry-param-row">
                        <Input
                            label="Color"
                            type="color"
                            value={analogParams.secondHand.color}
                            onChange={(v) => updateSecondHand({ color: v })}
                        />
                        <Select
                            label="Shape"
                            value={analogParams.secondHand.shape}
                            options={handShapeOptions}
                            onChange={(v) => updateSecondHand({ shape: v as any })}
                        />
                    </div>
                    <div className="foundry-param-row">
                        <Slider
                            label="Offset X"
                            value={analogParams.secondHand.offsetX}
                            onChange={(v) => updateSecondHand({ offsetX: v })}
                            min={-30}
                            max={30}
                        />
                        <Slider
                            label="Offset Y"
                            value={analogParams.secondHand.offsetY}
                            onChange={(v) => updateSecondHand({ offsetY: v })}
                            min={-30}
                            max={30}
                        />
                    </div>
                </>
            )}

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Center Hub</div>

            <div className="foundry-param-row">
                <Slider
                    label="Hub Radius"
                    value={analogParams.hubRadius}
                    onChange={(v) => updateAnalogParams({ hubRadius: v })}
                    min={3}
                    max={20}
                />
                <Input
                    label="Hub Color"
                    type="color"
                    value={analogParams.hubColor}
                    onChange={(v) => updateAnalogParams({ hubColor: v })}
                />
            </div>

            <Select
                label="Hub Style"
                value={analogParams.hubStyle}
                options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'ring', label: 'Ring' },
                    { value: 'dot', label: 'Dot' },
                ]}
                onChange={(v) => updateAnalogParams({ hubStyle: v as any })}
            />

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Tick Marks</div>

            <Checkbox
                label="Show Tick Marks"
                checked={analogParams.showTickMarks}
                onChange={(v) => updateAnalogParams({ showTickMarks: v })}
            />

            {analogParams.showTickMarks && (
                <>
                    <div className="foundry-param-row">
                        <Slider
                            label="Major Length"
                            value={analogParams.majorTickLength}
                            onChange={(v) => updateAnalogParams({ majorTickLength: v })}
                            min={5}
                            max={25}
                        />
                        <Slider
                            label="Minor Length"
                            value={analogParams.minorTickLength}
                            onChange={(v) => updateAnalogParams({ minorTickLength: v })}
                            min={2}
                            max={15}
                        />
                    </div>
                    <div className="foundry-param-row">
                        <Slider
                            label="Tick Radius %"
                            value={analogParams.tickRadius}
                            onChange={(v) => updateAnalogParams({ tickRadius: v })}
                            min={50}
                            max={100}
                        />
                        <Input
                            label="Tick Color"
                            type="color"
                            value={analogParams.tickColor}
                            onChange={(v) => updateAnalogParams({ tickColor: v })}
                        />
                    </div>
                    <div className="foundry-param-row">
                        <Slider
                            label="Tick Offset X"
                            value={analogParams.tickOffsetX}
                            onChange={(v) => updateAnalogParams({ tickOffsetX: v })}
                            min={-30}
                            max={30}
                        />
                        <Slider
                            label="Tick Offset Y"
                            value={analogParams.tickOffsetY}
                            onChange={(v) => updateAnalogParams({ tickOffsetY: v })}
                            min={-30}
                            max={30}
                        />
                    </div>
                </>
            )}

            <div className="foundry-param-group-title" style={{ marginTop: 16 }}>Numerals</div>

            <Checkbox
                label="Show Numerals"
                checked={analogParams.showNumerals}
                onChange={(v) => updateAnalogParams({ showNumerals: v })}
            />

            {analogParams.showNumerals && (
                <>
                    <Select
                        label="Style"
                        value={analogParams.numeralStyle}
                        options={[
                            { value: 'arabic', label: 'Arabic (1, 2, 3...)' },
                            { value: 'roman', label: 'Roman (I, II, III...)' },
                            { value: 'dots', label: 'Dots' },
                        ]}
                        onChange={(v) => updateAnalogParams({ numeralStyle: v as any })}
                    />
                    <div className="foundry-param-row">
                        <Slider
                            label="Size"
                            value={analogParams.numeralSize}
                            onChange={(v) => updateAnalogParams({ numeralSize: v })}
                            min={8}
                            max={30}
                        />
                        <Input
                            label="Color"
                            type="color"
                            value={analogParams.numeralColor}
                            onChange={(v) => updateAnalogParams({ numeralColor: v })}
                        />
                    </div>
                    <Slider
                        label="Numeral Radius %"
                        value={analogParams.numeralRadius}
                        onChange={(v) => updateAnalogParams({ numeralRadius: v })}
                        min={50}
                        max={100}
                    />
                    <div className="foundry-param-row">
                        <Slider
                            label="Numeral Offset X"
                            value={analogParams.numeralOffsetX}
                            onChange={(v) => updateAnalogParams({ numeralOffsetX: v })}
                            min={-30}
                            max={30}
                        />
                        <Slider
                            label="Numeral Offset Y"
                            value={analogParams.numeralOffsetY}
                            onChange={(v) => updateAnalogParams({ numeralOffsetY: v })}
                            min={-30}
                            max={30}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

// ============================================================================
// Main ClockFoundry Component
// ============================================================================

export const ClockFoundry: React.FC = () => {
    const {
        isOpen,
        selectedTemplate,
        previewTime,
        outputWidth,
        outputHeight,
        useTransparentBackground,
        generatedFrames,
        isGenerating,
        generationProgress,
        lcdParams,
        flipParams,
        analogParams,
        timeUnit,
        hourFormat,
        closeClockFoundry,
        setTemplate,
        setPreviewTime,
        setTimeUnit,
        setHourFormat,
        setOutputSize,
        setTransparentBackground,
        setGeneratedFrames,
        setGenerating,
    } = useClockFoundryStore();

    const { addWidget } = useWidgetStore();

    const generateFrames = useCallback(async () => {
        setGenerating(true, 0);

        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const frames: string[] = [];

        // For digital clocks (LCD/Flip), we generate frames for each unique time state
        // For analog clocks, we generate frames based on the most granular hand enabled

        // Flip clock: Don't use animation frames - just generate static frames
        // The "flip" effect is baked into each frame showing the current state
        // Animation frames made it jittery because we were showing mid-flip states as separate frames

        // Determine frame count and time mapping based on display
        let totalUniqueStates: number;
        let getTimeForState: (state: number) => { hours: number; minutes: number; seconds: number };

        if (selectedTemplate === 'analog') {
            // Analog clock frame generation:
            // Generate 60 frames representing each second of a minute
            // All enabled hands are shown, moving according to time
            //
            // Frame N represents: hour=current, minute=current, second=N
            // When played back with divisor=1, the second hand moves correctly
            // Hour and minute hands will be static (acceptable for most use cases)
            //
            // For hour-only or minute-only clocks, we generate fewer frames

            if (analogParams.secondHand.enabled) {
                // 60 frames for a full minute cycle
                totalUniqueStates = 60;
                const now = new Date();
                const baseHour = now.getHours();
                const baseMinute = now.getMinutes();
                getTimeForState = (state) => ({
                    hours: baseHour,
                    minutes: baseMinute,
                    seconds: state,
                });
            } else if (analogParams.minuteHand.enabled) {
                // 60 frames for minutes 0-59
                totalUniqueStates = 60;
                const now = new Date();
                const baseHour = now.getHours();
                getTimeForState = (state) => ({
                    hours: baseHour,
                    minutes: state,
                    seconds: 0,
                });
            } else {
                // 12 frames for hours 0-11
                totalUniqueStates = 12;
                getTimeForState = (state) => ({
                    hours: state,
                    minutes: 0,
                    seconds: 0,
                });
            }
        } else {
            // Digital clocks (LCD/Flip)
            // Generate based on timeUnit selection:
            // - hours: 12 frames (01-12 for 12h) or 24 frames (00-23 for 24h)
            // - minutes: 60 frames (00-59)
            // - seconds: 60 frames (00-59)
            if (timeUnit === 'hours') {
                if (hourFormat === '24h') {
                    // 24-hour format: 24 frames showing 00-23
                    totalUniqueStates = 24;
                    getTimeForState = (state) => ({
                        hours: state,
                        minutes: 0,
                        seconds: 0,
                    });
                } else {
                    // 12-hour format: 12 frames showing 12, 01, 02, ... 11
                    totalUniqueStates = 12;
                    getTimeForState = (state) => ({
                        hours: state === 0 ? 12 : state,
                        minutes: 0,
                        seconds: 0,
                    });
                }
            } else if (timeUnit === 'minutes') {
                // 60 frames showing 00-59
                totalUniqueStates = 60;
                getTimeForState = (state) => ({
                    hours: 12,
                    minutes: state,
                    seconds: 0,
                });
            } else {
                // seconds: 60 frames showing 00-59
                totalUniqueStates = 60;
                getTimeForState = (state) => ({
                    hours: 12,
                    minutes: 30,
                    seconds: state,
                });
            }
        }

        let frameIndex = 0;
        for (let state = 0; state < totalUniqueStates; state++) {
            const time = getTimeForState(state);
            const { hours, minutes, seconds } = time;

            // Build time string based on template and time unit
            let timeStr: string;
            if (selectedTemplate === 'analog') {
                // Analog doesn't use time string
                timeStr = '';
            } else {
                // Digital clocks: show only the relevant time unit as 2 digits
                if (timeUnit === 'hours') {
                    timeStr = `${hours.toString().padStart(2, '0')}`;
                } else if (timeUnit === 'minutes') {
                    timeStr = `${minutes.toString().padStart(2, '0')}`;
                } else {
                    timeStr = `${seconds.toString().padStart(2, '0')}`;
                }
            }

            switch (selectedTemplate) {
                case 'lcd':
                    renderLcdClock(ctx, timeStr, outputWidth, outputHeight, { ...lcdParams, digitCount: 2 }, useTransparentBackground);
                    break;
                case 'flip':
                    // For flip clock, render static state (no flip animation between frames)
                    renderFlipClock(ctx, timeStr, outputWidth, outputHeight, { ...flipParams, digitCount: 2 }, useTransparentBackground);
                    break;
                case 'analog':
                    // Render all enabled hands
                    renderAnalogClock(ctx, hours, minutes, seconds, outputWidth, outputHeight, analogParams, useTransparentBackground);
                    break;
            }

            frames.push(canvas.toDataURL('image/png'));
            frameIndex++;
            setGenerating(true, (frameIndex / totalUniqueStates) * 100);

            // Yield to keep UI responsive
            if (frameIndex % 10 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }

        setGeneratedFrames(frames);
        setGenerating(false, 100);
    }, [selectedTemplate, outputWidth, outputHeight, useTransparentBackground, lcdParams, flipParams, analogParams, timeUnit, hourFormat, setGeneratedFrames, setGenerating]);

    const addToCanvas = useCallback(() => {
        if (generatedFrames.length === 0) return;

        // Calculate modulo divisor based on what the clock displays
        // Time sensor provides seconds since midnight (0-86399)
        //
        // For digital clocks (based on timeUnit):
        // - hours: frame = floor(time/3600) % 12, divisor = 3600
        // - minutes: frame = floor(time/60) % 60, divisor = 60
        // - seconds: frame = time % 60, divisor = 1
        //
        // For analog clocks (based on enabled hands):
        // - With second hand (60 frames): frame = seconds % 60, divisor = 1
        // - Without second hand (60 frames): frame = minutes % 60, divisor = 60
        // - Hour only (12 frames): frame = hours % 12, divisor = 3600
        let moduloDivisor = 1;
        let widgetName = `Clock (${selectedTemplate.toUpperCase()})`;

        if (selectedTemplate === 'analog') {
            if (analogParams.secondHand.enabled) {
                moduloDivisor = 1; // Seconds
                widgetName = 'Analog Clock';
            } else if (analogParams.minuteHand.enabled) {
                moduloDivisor = 60; // Minutes
                widgetName = 'Analog Clock (Minutes)';
            } else {
                moduloDivisor = 3600; // Hours
                widgetName = 'Analog Clock (Hours)';
            }
        } else {
            // Digital clocks - based on timeUnit
            if (timeUnit === 'hours') {
                moduloDivisor = 3600;
                widgetName = `Clock Hours ${hourFormat === '24h' ? '24H' : '12H'} (${selectedTemplate.toUpperCase()})`;
            } else if (timeUnit === 'minutes') {
                moduloDivisor = 60;
                widgetName = `Clock Minutes (${selectedTemplate.toUpperCase()})`;
            } else {
                moduloDivisor = 1;
                widgetName = `Clock Seconds (${selectedTemplate.toUpperCase()})`;
            }
        }

        // Build foundry params to save with widget for regeneration
        const foundryParams = {
            selectedTemplate,
            timeUnit,
            hourFormat,
            useTransparentBackground,
            lcdParams: { ...lcdParams },
            flipParams: { ...flipParams },
            analogParams: { ...analogParams },
        };

        const widget = createDefaultImageSequenceWidget();
        widget.images = generatedFrames;
        widget.width = outputWidth;
        widget.height = outputHeight;
        widget.name = widgetName;
        // Clock widgets should use modulo mode for time sensor cycling
        widget.useModulo = true;
        widget.moduloDivisor = moduloDivisor;
        // Pre-bind to time sensor for convenience
        widget.sensorBinding = 'time';
        widget.sourceFoundry = 'clock';
        widget.foundryParams = foundryParams;

        addWidget(widget);
        closeClockFoundry();
    }, [generatedFrames, outputWidth, outputHeight, selectedTemplate, timeUnit, hourFormat, useTransparentBackground, lcdParams, flipParams, analogParams, addWidget, closeClockFoundry]);

    if (!isOpen) return null;

    const templateButtons: { id: ClockTemplate; label: string; icon: string }[] = [
        { id: 'lcd', label: 'LCD', icon: '8' },
        { id: 'flip', label: 'Flip', icon: '5' },
        { id: 'analog', label: 'Analog', icon: 'O' },
    ];

    return (
        <div className="foundry-overlay">
            <div className="foundry-modal" style={{ maxWidth: 1000 }}>
                <div className="foundry-header">
                    <div className="foundry-title">
                        <span className="foundry-icon">&#128344;</span>
                        Clock Foundry
                    </div>
                    <span className="foundry-subtitle">
                        {selectedTemplate === 'lcd' && 'LCD 7-Segment Display'}
                        {selectedTemplate === 'flip' && 'Split-Flap Flip Clock'}
                        {selectedTemplate === 'analog' && 'Analog Clock Hands'}
                    </span>
                    <button className="foundry-close" onClick={closeClockFoundry}>
                        &times;
                    </button>
                </div>

                <div className="foundry-content">
                    {/* Left: Preview */}
                    <div className="foundry-preview-section">
                        <div className="foundry-section-title">Preview</div>
                        <div className="foundry-canvas-container">
                            <ClockPreviewCanvas />
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <Input
                                label="Preview Time (HH:MM:SS)"
                                type="text"
                                value={previewTime}
                                onChange={setPreviewTime}
                            />
                        </div>

                        <div className="foundry-template-selector">
                            {templateButtons.map((t) => (
                                <button
                                    key={t.id}
                                    className={`foundry-template-btn ${selectedTemplate === t.id ? 'active' : ''}`}
                                    onClick={() => setTemplate(t.id)}
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

                        {selectedTemplate === 'lcd' && <LcdClockEditor />}
                        {selectedTemplate === 'flip' && <FlipClockEditor />}
                        {selectedTemplate === 'analog' && <AnalogClockEditor />}
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
                                    min={100}
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

                            {/* Time Unit selector - only for digital clocks */}
                            {(selectedTemplate === 'lcd' || selectedTemplate === 'flip') && (
                                <>
                                    <Select
                                        label="Time Unit"
                                        value={timeUnit}
                                        options={[
                                            { value: 'hours', label: `Hours (${hourFormat === '24h' ? '24' : '12'} frames)` },
                                            { value: 'minutes', label: 'Minutes (60 frames: 00-59)' },
                                            { value: 'seconds', label: 'Seconds (60 frames: 00-59)' },
                                        ]}
                                        onChange={(v) => setTimeUnit(v as ClockTimeUnit)}
                                    />

                                    {/* Hour format - only shown when hours is selected */}
                                    {timeUnit === 'hours' && (
                                        <Select
                                            label="Hour Format"
                                            value={hourFormat}
                                            options={[
                                                { value: '12h', label: '12-hour (12, 01-11)' },
                                                { value: '24h', label: '24-hour (00-23)' },
                                            ]}
                                            onChange={(v) => setHourFormat(v as ClockHourFormat)}
                                        />
                                    )}

                                    <div style={{
                                        fontSize: 10,
                                        color: '#888',
                                        marginTop: 4,
                                        marginBottom: 8,
                                        padding: '6px 8px',
                                        background: 'rgba(0,150,255,0.1)',
                                        borderRadius: 4,
                                    }}>
                                        💡 Create 3 widgets (hours, minutes, seconds) and position them side by side for a full clock display. Add colon separators using text or image widgets.
                                    </div>
                                </>
                            )}

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
                                    {generatedFrames.slice(0, 8).map((frame, i) => (
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
                        Clock mechanisms only - encasings should be provided separately as background images.
                    </div>
                </div>
            </div>
        </div>
    );
};
