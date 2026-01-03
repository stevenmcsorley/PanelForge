/**
 * TickEditor
 * UI controls for configuring tick marks in the Gauge Foundry
 */

import React from 'react';
import { useFoundryStore } from '@/stores/foundryStore';
import { Input, Slider } from '@/components/ui';

export const TickEditor: React.FC = () => {
    const { tickParams, updateTickParams } = useFoundryStore();

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Ticks & Marks
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'normal', cursor: 'pointer' }}>
                    Enabled
                    <input
                        type="checkbox"
                        checked={tickParams.enabled}
                        onChange={(e) => updateTickParams({ enabled: e.target.checked })}
                    />
                </label>
            </div>

            {tickParams.enabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    <div className="foundry-param-row">
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>Mode</label>
                            <select
                                value={tickParams.mode}
                                onChange={(e) => updateTickParams({ mode: e.target.value as any })}
                                style={{
                                    width: '100%',
                                    background: '#1a1a2a',
                                    color: '#fff',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    padding: '4px'
                                }}
                            >
                                <option value="arc">Radial (Arc)</option>
                                <option value="horizontal">Horizontal</option>
                                <option value="vertical">Vertical</option>
                            </select>
                        </div>
                    </div>

                    {tickParams.mode === 'arc' && (
                        <>
                            <div className="foundry-param-row">
                                <Input
                                    label="Radius"
                                    type="number"
                                    value={tickParams.radius}
                                    onChange={(v) => updateTickParams({ radius: parseFloat(v) || 0 })}
                                />
                                <div style={{ flex: 1 }} />
                            </div>
                            <div className="foundry-param-row">
                                <Input
                                    label="Start Angle"
                                    type="number"
                                    value={tickParams.startAngle}
                                    onChange={(v) => updateTickParams({ startAngle: parseFloat(v) || 0 })}
                                />
                                <Input
                                    label="End Angle"
                                    type="number"
                                    value={tickParams.endAngle}
                                    onChange={(v) => updateTickParams({ endAngle: parseFloat(v) || 0 })}
                                />
                            </div>
                        </>
                    )}

                    {tickParams.mode !== 'arc' && (
                        <div className="foundry-param-row">
                            <Input
                                label="Offset"
                                type="number"
                                value={tickParams.offset}
                                onChange={(v) => updateTickParams({ offset: parseFloat(v) || 0 })}
                            />
                            <div style={{ flex: 1 }} />
                        </div>
                    )}

                    <div className="foundry-param-row">
                        <Input
                            label="Major Count"
                            type="number"
                            value={tickParams.majorCount}
                            onChange={(v) => updateTickParams({ majorCount: parseInt(v) || 2 })}
                            min={2}
                        />
                        <Input
                            label="Minor per Major"
                            type="number"
                            value={tickParams.minorSteps}
                            onChange={(v) => updateTickParams({ minorSteps: parseInt(v) || 0 })}
                            min={0}
                        />
                    </div>

                    <div className="foundry-param-row">
                        <Input
                            label="Major Length"
                            type="number"
                            value={tickParams.majorLength}
                            onChange={(v) => updateTickParams({ majorLength: parseFloat(v) || 0 })}
                        />
                        <Input
                            label="Minor Length"
                            type="number"
                            value={tickParams.minorLength}
                            onChange={(v) => updateTickParams({ minorLength: parseFloat(v) || 0 })}
                        />
                    </div>

                    <div className="foundry-param-row">
                        <Input
                            label="Major Width"
                            type="number"
                            value={tickParams.majorWidth}
                            onChange={(v) => updateTickParams({ majorWidth: parseFloat(v) || 1 })}
                            min={0.1}
                        />
                        <Input
                            label="Minor Width"
                            type="number"
                            value={tickParams.minorWidth}
                            onChange={(v) => updateTickParams({ minorWidth: parseFloat(v) || 0.5 })}
                            min={0.1}
                        />
                    </div>

                    <div className="foundry-param-row">
                        <Input
                            label="Color"
                            type="color"
                            value={tickParams.color}
                            onChange={(v) => updateTickParams({ color: v })}
                        />
                        <Slider
                            label={`Opacity: ${Math.round(tickParams.opacity * 100)}%`}
                            value={tickParams.opacity}
                            onChange={(v) => updateTickParams({ opacity: v })}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
