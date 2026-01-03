/**
 * LabelEditor
 * UI controls for configuring numeric labels in the Gauge Foundry
 */

import React from 'react';
import { useFoundryStore } from '@/stores/foundryStore';
import { Input, Slider } from '@/components/ui';
import { AVAILABLE_FONTS, FONT_WEIGHTS, FONT_STYLES } from './fonts';

export const LabelEditor: React.FC = () => {
    const { labelParams, updateLabelParams } = useFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Numeric Labels
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'normal', cursor: 'pointer' }}>
                    Enabled
                    <input
                        type="checkbox"
                        checked={labelParams.enabled}
                        onChange={(e) => updateLabelParams({ enabled: e.target.checked })}
                    />
                </label>
            </div>

            {labelParams.enabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    <div className="foundry-param-row">
                        <Input
                            label="Min Value"
                            type="number"
                            value={labelParams.minValue}
                            onChange={(v) => updateLabelParams({ minValue: parseFloat(v) || 0 })}
                        />
                        <Input
                            label="Max Value"
                            type="number"
                            value={labelParams.maxValue}
                            onChange={(v) => updateLabelParams({ maxValue: parseFloat(v) || 100 })}
                        />
                    </div>

                    <div className="foundry-param-row">
                        <Input
                            label="Step"
                            type="number"
                            value={labelParams.step}
                            onChange={(v) => updateLabelParams({ step: parseFloat(v) || 10 })}
                            min={0.1}
                        />
                        <Input
                            label="Unit"
                            type="text"
                            value={labelParams.unit}
                            onChange={(v) => updateLabelParams({ unit: v })}
                        />
                    </div>

                    {/* Font Controls */}
                    <div style={{ borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Font Settings
                        </div>

                        <div className="foundry-param-row">
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                                    Font Family
                                </label>
                                <select
                                    value={labelParams.fontFamily}
                                    onChange={(e) => updateLabelParams({ fontFamily: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: '#1a1a2a',
                                        color: '#fff',
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        padding: '6px',
                                        fontSize: '11px',
                                        fontFamily: labelParams.fontFamily,
                                    }}
                                >
                                    {AVAILABLE_FONTS.map((font) => (
                                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                            {font.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Size"
                                type="number"
                                value={labelParams.fontSize}
                                onChange={(v) => updateLabelParams({ fontSize: parseFloat(v) || 12 })}
                                min={4}
                                max={72}
                            />
                        </div>

                        <div className="foundry-param-row" style={{ marginTop: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                                    Weight
                                </label>
                                <select
                                    value={labelParams.fontWeight}
                                    onChange={(e) => updateLabelParams({ fontWeight: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: '#1a1a2a',
                                        color: '#fff',
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        padding: '6px',
                                        fontSize: '11px',
                                    }}
                                >
                                    {FONT_WEIGHTS.map((w) => (
                                        <option key={w.value} value={w.value}>
                                            {w.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                                    Style
                                </label>
                                <select
                                    value={labelParams.fontStyle}
                                    onChange={(e) => updateLabelParams({ fontStyle: e.target.value as 'normal' | 'italic' })}
                                    style={{
                                        width: '100%',
                                        background: '#1a1a2a',
                                        color: '#fff',
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        padding: '6px',
                                        fontSize: '11px',
                                    }}
                                >
                                    {FONT_STYLES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Slider
                            label={`Letter Spacing: ${labelParams.letterSpacing}px`}
                            value={labelParams.letterSpacing}
                            onChange={(v) => updateLabelParams({ letterSpacing: v })}
                            min={-5}
                            max={20}
                        />
                    </div>

                    {/* Position & Appearance */}
                    <div style={{ borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                        <div className="foundry-param-row">
                            <Input
                                label="Offset"
                                type="number"
                                value={labelParams.offset}
                                onChange={(v) => updateLabelParams({ offset: parseFloat(v) || 0 })}
                            />
                            <Input
                                label="Color"
                                type="color"
                                value={labelParams.color}
                                onChange={(v) => updateLabelParams({ color: v })}
                            />
                        </div>

                        <Slider
                            label={`Opacity: ${Math.round(labelParams.opacity * 100)}%`}
                            value={labelParams.opacity}
                            onChange={(v) => updateLabelParams({ opacity: v })}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                    </div>

                    {/* Options */}
                    <div className="foundry-param-row" style={{ alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                            <input
                                type="checkbox"
                                checked={labelParams.upright}
                                onChange={(e) => updateLabelParams({ upright: e.target.checked })}
                            />
                            Upright Text
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                            <input
                                type="checkbox"
                                checked={labelParams.reversed}
                                onChange={(e) => updateLabelParams({ reversed: e.target.checked })}
                            />
                            Reversed Order
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};
