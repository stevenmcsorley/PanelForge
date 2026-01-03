/**
 * LedEffectsEditor
 * UI controls for LED texture overlays and blending effects
 */

import React from 'react';
import { useFoundryStore } from '@/stores/foundryStore';
import { Input, Slider } from '@/components/ui';

export const LedEffectsEditor: React.FC = () => {
    const { ledArcParams, updateLedEffects } = useFoundryStore();
    const effects = ledArcParams.effects;

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">LED Effects</div>

            {/* Segment Opacity */}
            <Slider
                label={`Segment Opacity: ${Math.round(effects.segmentOpacity * 100)}%`}
                value={effects.segmentOpacity}
                onChange={(v) => updateLedEffects({ segmentOpacity: v })}
                min={0}
                max={1}
                step={0.05}
            />

            {/* Dust/Grunge Effect */}
            <div style={{ marginTop: '12px', borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={effects.dustEnabled}
                        onChange={(e) => updateLedEffects({ dustEnabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: '#ccc' }}>Dust & Scratches (Worn Effect)</span>
                </label>
                {effects.dustEnabled && (
                    <Slider
                        label={`Intensity: ${Math.round(effects.dustIntensity * 100)}%`}
                        value={effects.dustIntensity}
                        onChange={(v) => updateLedEffects({ dustIntensity: v })}
                        min={0}
                        max={1}
                        step={0.05}
                    />
                )}
            </div>

            {/* Bulb Shape Effect */}
            <div style={{ marginTop: '12px', borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={effects.bulbShapeEnabled}
                        onChange={(e) => updateLedEffects({ bulbShapeEnabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: '#ccc' }}>3D Bulb Shape (Rounded Look)</span>
                </label>
                {effects.bulbShapeEnabled && (
                    <Slider
                        label={`Intensity: ${Math.round(effects.bulbIntensity * 100)}%`}
                        value={effects.bulbIntensity}
                        onChange={(v) => updateLedEffects({ bulbIntensity: v })}
                        min={0}
                        max={1}
                        step={0.05}
                    />
                )}
            </div>

            {/* Glass Overlay Effect */}
            <div style={{ marginTop: '12px', borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={effects.glassOverlayEnabled}
                        onChange={(e) => updateLedEffects({ glassOverlayEnabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: '#ccc' }}>Glass Cover (Reflections)</span>
                </label>
                {effects.glassOverlayEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Slider
                            label={`Intensity: ${Math.round(effects.glassIntensity * 100)}%`}
                            value={effects.glassIntensity}
                            onChange={(v) => updateLedEffects({ glassIntensity: v })}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                        <Slider
                            label={`Angle: ${effects.glassAngle}`}
                            value={effects.glassAngle}
                            onChange={(v) => updateLedEffects({ glassAngle: v })}
                            min={-180}
                            max={180}
                        />
                    </div>
                )}
            </div>

            {/* Inset Shadow Effect */}
            <div style={{ marginTop: '12px', borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={effects.insetShadowEnabled}
                        onChange={(e) => updateLedEffects({ insetShadowEnabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: '#ccc' }}>Inset Shadow (Embedded Look)</span>
                </label>
                {effects.insetShadowEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Slider
                            label={`Depth: ${effects.insetShadowDepth}px`}
                            value={effects.insetShadowDepth}
                            onChange={(v) => updateLedEffects({ insetShadowDepth: v })}
                            min={1}
                            max={10}
                        />
                        <Input
                            label="Shadow Color"
                            type="color"
                            value={effects.insetShadowColor}
                            onChange={(v) => updateLedEffects({ insetShadowColor: v })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
