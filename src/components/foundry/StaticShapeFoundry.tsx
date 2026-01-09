import React, { useRef, useEffect } from 'react';
import { useStaticShapeFoundryStore } from '@/stores/staticShapeFoundryStore';
import { useWidgetStore, createDefaultImageWidget } from '@/stores';
import { Button, Slider, Input, Checkbox, Select } from '@/components/ui';
import { renderStaticShape } from './staticShapeRenderUtils';

export const StaticShapeFoundry: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        isOpen,
        editingWidgetId,
        params,
        outputWidth,
        outputHeight,
        closeStaticShapeFoundry,
        updateParams,
        setOutputSize,
    } = useStaticShapeFoundryStore();

    const { addWidget, updateWidget } = useWidgetStore();

    // Redraw preview
    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        renderStaticShape(ctx, outputWidth, outputHeight, params);

    }, [isOpen, params, outputWidth, outputHeight]);

    const handleAdd = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');

        const commonUpdates = {
            src: dataUrl,
            width: outputWidth,
            height: outputHeight,
            sourceFoundry: 'static_shape' as const,
            foundryParams: params
        };

        if (editingWidgetId) {
            updateWidget(editingWidgetId, commonUpdates);
        } else {
            const widget = createDefaultImageWidget();
            widget.name = `Shape (${params.shapeType})`;
            // Initial size estimation (optional, as outputWidth overrides it currently)
            // widget.width = params.width + ...

            Object.assign(widget, commonUpdates);

            // Override with strict canvas output size
            widget.width = outputWidth;
            widget.height = outputHeight;

            addWidget(widget);
        }
        closeStaticShapeFoundry();
    };

    if (!isOpen) return null;

    return (
        <div className="foundry-overlay">
            <div className="foundry-modal" style={{ maxWidth: 900 }}>
                <div className="foundry-header">
                    <div className="foundry-title">
                        <span className="foundry-icon">❖</span>
                        Static Shape Foundry
                    </div>
                    <span className="foundry-subtitle">
                        Panel Structure & Layout
                    </span>
                    <button className="foundry-close" onClick={closeStaticShapeFoundry}>
                        &times;
                    </button>
                </div>

                <div className="foundry-content">
                    {/* Left: Preview */}
                    <div className="foundry-preview-section">
                        <div className="foundry-section-title">Preview</div>
                        <div className="foundry-canvas-container">
                            <canvas
                                ref={canvasRef}
                                width={outputWidth}
                                height={outputHeight}
                                style={{
                                    background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px',
                                    border: '1px solid #333',
                                    borderRadius: 4,
                                    maxWidth: '100%',
                                }}
                            />
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, color: '#666', textAlign: 'center' }}>
                            Canvas: {outputWidth} x {outputHeight}
                        </div>
                    </div>

                    {/* Middle: Parameters */}
                    <div className="foundry-params-section">
                        <div className="foundry-section-title">Parameters</div>

                        {/* Shape Type */}
                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Shape</div>
                            <Select
                                label="Type"
                                value={params.shapeType}
                                options={[
                                    { value: 'rectangle', label: 'Rectangle / Square' },
                                    { value: 'circle', label: 'Circle / Ellipse' },
                                    { value: 'line', label: 'Line / Divider' },
                                ]}
                                onChange={(v) => updateParams({ shapeType: v as any })}
                            />
                        </div>

                        {/* Dimensions */}
                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Dimensions</div>
                            <div className="foundry-param-row">
                                <Slider
                                    label="Width"
                                    value={params.width}
                                    onChange={(v) => updateParams({ width: v })}
                                    min={10}
                                    max={outputWidth}
                                />
                                {params.shapeType !== 'line' && (
                                    <Slider
                                        label="Height"
                                        value={params.height}
                                        onChange={(v) => updateParams({ height: v })}
                                        min={10}
                                        max={outputHeight}
                                    />
                                )}
                            </div>

                            {params.shapeType === 'rectangle' && (
                                <Slider
                                    label="Corner Radius"
                                    value={params.cornerRadius}
                                    onChange={(v) => updateParams({ cornerRadius: v })}
                                    min={0}
                                    max={params.height / 2}
                                />
                            )}

                            {params.shapeType === 'line' && (
                                <Slider
                                    label="Thickness"
                                    value={params.lineThickness}
                                    onChange={(v) => updateParams({ lineThickness: v })}
                                    min={1}
                                    max={50}
                                />
                            )}
                        </div>

                        {/* Fill */}
                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Fill</div>
                            <div className="foundry-param-row">
                                <Input
                                    label="Color"
                                    type="color"
                                    value={params.fillColor}
                                    onChange={(v) => updateParams({ fillColor: v })}
                                />
                                <Slider
                                    label="Opacity"
                                    value={params.fillOpacity}
                                    onChange={(v) => updateParams({ fillOpacity: v })}
                                    min={0}
                                    max={100}
                                />
                            </div>
                        </div>

                        {/* Stroke */}
                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Border/Stroke</div>
                            <Checkbox
                                label="Enable Border"
                                checked={params.strokeEnabled}
                                onChange={(v) => updateParams({ strokeEnabled: v })}
                            />
                            {params.strokeEnabled && (
                                <>
                                    <div className="foundry-param-row">
                                        <Input
                                            label="Color"
                                            type="color"
                                            value={params.strokeColor}
                                            onChange={(v) => updateParams({ strokeColor: v })}
                                        />
                                        <Slider
                                            label="Thickness"
                                            value={params.strokeWidth}
                                            onChange={(v) => updateParams({ strokeWidth: v })}
                                            min={0}
                                            max={20}
                                        />
                                    </div>
                                    <Slider
                                        label="Opacity"
                                        value={params.strokeOpacity}
                                        onChange={(v) => updateParams({ strokeOpacity: v })}
                                        min={0}
                                        max={100}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Effects & Output */}
                    <div className="foundry-output-section">
                        <div className="foundry-section-title">Effects</div>

                        {/* Shadow */}
                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Drop Shadow</div>
                            <Checkbox
                                label="Enable Shadow"
                                checked={params.shadowEnabled}
                                onChange={(v) => updateParams({ shadowEnabled: v })}
                            />
                            {params.shadowEnabled && (
                                <>
                                    <Input
                                        label="Color"
                                        type="color"
                                        value={params.shadowColor}
                                        onChange={(v) => updateParams({ shadowColor: v })}
                                    />
                                    <Slider
                                        label="Blur"
                                        value={params.shadowBlur}
                                        onChange={(v) => updateParams({ shadowBlur: v })}
                                        min={0}
                                        max={50}
                                    />
                                    <div className="foundry-param-row">
                                        <Slider
                                            label="X Offset"
                                            value={params.shadowOffsetX}
                                            onChange={(v) => updateParams({ shadowOffsetX: v })}
                                            min={-50}
                                            max={50}
                                        />
                                        <Slider
                                            label="Y Offset"
                                            value={params.shadowOffsetY}
                                            onChange={(v) => updateParams({ shadowOffsetY: v })}
                                            min={-50}
                                            max={50}
                                        />
                                    </div>
                                    <Slider
                                        label="Opacity"
                                        value={params.shadowOpacity}
                                        onChange={(v) => updateParams({ shadowOpacity: v })}
                                        min={0}
                                        max={100}
                                    />
                                </>
                            )}
                        </div>

                        {/* Inner Shadow */}
                        <div className="foundry-param-group">
                            <div className="foundry-param-group-title">Inner Shadow</div>
                            <Checkbox
                                label="Enable Inner Shadow"
                                checked={params.innerShadow.enabled}
                                onChange={(v) => updateParams({ innerShadow: { ...params.innerShadow, enabled: v } })}
                            />
                            {params.innerShadow.enabled && (
                                <>
                                    <Input
                                        label="Color"
                                        type="color"
                                        value={params.innerShadow.color}
                                        onChange={(v) => updateParams({ innerShadow: { ...params.innerShadow, color: v } })}
                                    />
                                    <Slider
                                        label="Opacity"
                                        value={params.innerShadow.opacity}
                                        onChange={(v) => updateParams({ innerShadow: { ...params.innerShadow, opacity: v } })}
                                        min={0}
                                        max={100}
                                    />
                                    <Slider
                                        label={`Angle (${params.innerShadow.angle}°)`}
                                        value={params.innerShadow.angle}
                                        onChange={(v) => updateParams({ innerShadow: { ...params.innerShadow, angle: v } })}
                                        min={0}
                                        max={360}
                                    />
                                    <div className="foundry-param-row">
                                        <Slider
                                            label="Range"
                                            value={params.innerShadow.distance}
                                            onChange={(v) => updateParams({ innerShadow: { ...params.innerShadow, distance: v } })}
                                            min={0}
                                            max={50}
                                        />
                                        <Slider
                                            label="Size"
                                            value={params.innerShadow.blur}
                                            onChange={(v) => updateParams({ innerShadow: { ...params.innerShadow, blur: v } })}
                                            min={0}
                                            max={50}
                                        />
                                    </div>
                                    <Slider
                                        label="Spread"
                                        value={params.innerShadow.spread}
                                        onChange={(v) => updateParams({ innerShadow: { ...params.innerShadow, spread: v } })}
                                        min={0}
                                        max={20}
                                    />
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <div className="foundry-param-group">
                                <div className="foundry-param-group-title">Output Canvas Size</div>
                                <div className="foundry-param-row">
                                    <Slider
                                        label="Width"
                                        value={outputWidth}
                                        onChange={(v) => setOutputSize(v, outputHeight)}
                                        min={64}
                                        max={1024}
                                    />
                                    <Slider
                                        label="Height"
                                        value={outputHeight}
                                        onChange={(v) => setOutputSize(outputWidth, v)}
                                        min={64}
                                        max={1024}
                                    />
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleAdd}
                                fullWidth
                            >
                                {editingWidgetId ? 'Update Shape' : 'Add to Panel'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
