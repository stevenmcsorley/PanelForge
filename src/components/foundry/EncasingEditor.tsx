/**
 * EncasingEditor
 * UI controls for gauge encasing (rim, glass, screws, seals)
 */

import React from 'react';
import { useFoundryStore } from '@/stores/foundryStore';
import { Input, Slider } from '@/components/ui';

export const EncasingEditor: React.FC = () => {
    const {
        encasingParams,
        updateRimParams,
        updateGlassParams,
        updateScrewParams,
        updateSealParams,
    } = useFoundryStore();

    const { rim, glass, screws, rubberSeal } = encasingParams;

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Gauge Encasing</div>

            {/* Rim/Bezel */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={rim.enabled}
                        onChange={(e) => updateRimParams({ enabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Metal Rim/Bezel</span>
                </label>

                {rim.enabled && (
                    <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Slider
                            label={`Width: ${rim.width}px`}
                            value={rim.width}
                            onChange={(v) => updateRimParams({ width: v })}
                            min={4}
                            max={30}
                        />
                        <div className="foundry-param-row">
                            <Input
                                label="Color"
                                type="color"
                                value={rim.color}
                                onChange={(v) => updateRimParams({ color: v })}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#aaa' }}>
                                <input
                                    type="checkbox"
                                    checked={rim.metallic}
                                    onChange={(e) => updateRimParams({ metallic: e.target.checked })}
                                />
                                Metallic
                            </label>
                        </div>
                        {rim.metallic && (
                            <div className="foundry-param-row">
                                <Input
                                    label="Highlight"
                                    type="color"
                                    value={rim.highlightColor}
                                    onChange={(v) => updateRimParams({ highlightColor: v })}
                                />
                                <Input
                                    label="Shadow"
                                    type="color"
                                    value={rim.shadowColor}
                                    onChange={(v) => updateRimParams({ shadowColor: v })}
                                />
                            </div>
                        )}
                        <Slider
                            label={`Bevel: ${rim.bevelWidth}px`}
                            value={rim.bevelWidth}
                            onChange={(v) => updateRimParams({ bevelWidth: v })}
                            min={0}
                            max={10}
                        />
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#aaa' }}>
                                <input
                                    type="checkbox"
                                    checked={rim.innerShadow}
                                    onChange={(e) => updateRimParams({ innerShadow: e.target.checked })}
                                />
                                Inner Shadow
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#aaa' }}>
                                <input
                                    type="checkbox"
                                    checked={rim.outerShadow}
                                    onChange={(e) => updateRimParams({ outerShadow: e.target.checked })}
                                />
                                Drop Shadow
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Rubber Seal */}
            <div style={{ marginBottom: '16px', borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={rubberSeal.enabled}
                        onChange={(e) => updateSealParams({ enabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Rubber Seal</span>
                </label>

                {rubberSeal.enabled && (
                    <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="foundry-param-row">
                            <Slider
                                label={`Width: ${rubberSeal.width}px`}
                                value={rubberSeal.width}
                                onChange={(v) => updateSealParams({ width: v })}
                                min={2}
                                max={10}
                            />
                            <Input
                                label="Color"
                                type="color"
                                value={rubberSeal.color}
                                onChange={(v) => updateSealParams({ color: v })}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' }}>Texture</label>
                            <select
                                value={rubberSeal.texture}
                                onChange={(e) => updateSealParams({ texture: e.target.value as any })}
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
                                <option value="smooth">Smooth</option>
                                <option value="ribbed">Ribbed</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Screws */}
            <div style={{ marginBottom: '16px', borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={screws.enabled}
                        onChange={(e) => updateScrewParams({ enabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Screws/Bolts</span>
                </label>

                {screws.enabled && (
                    <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="foundry-param-row">
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' }}>Count</label>
                                <select
                                    value={screws.count}
                                    onChange={(e) => updateScrewParams({ count: parseInt(e.target.value) as any })}
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
                                    <option value="4">4 Screws</option>
                                    <option value="6">6 Screws</option>
                                    <option value="8">8 Screws</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' }}>Style</label>
                                <select
                                    value={screws.style}
                                    onChange={(e) => updateScrewParams({ style: e.target.value as any })}
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
                                    <option value="phillips">Phillips (+)</option>
                                    <option value="slotted">Slotted (-)</option>
                                    <option value="hex">Hex</option>
                                    <option value="torx">Torx</option>
                                </select>
                            </div>
                        </div>
                        <div className="foundry-param-row">
                            <Slider
                                label={`Size: ${screws.size}px`}
                                value={screws.size}
                                onChange={(v) => updateScrewParams({ size: v })}
                                min={4}
                                max={16}
                            />
                            <Input
                                label="Color"
                                type="color"
                                value={screws.color}
                                onChange={(v) => updateScrewParams({ color: v })}
                            />
                        </div>
                        <Slider
                            label={`Inset: ${screws.inset}px`}
                            value={screws.inset}
                            onChange={(v) => updateScrewParams({ inset: v })}
                            min={4}
                            max={30}
                        />
                    </div>
                )}
            </div>

            {/* Glass Overlay */}
            <div style={{ borderTop: '1px solid #2a2a3a', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={glass.enabled}
                        onChange={(e) => updateGlassParams({ enabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Glass Cover</span>
                </label>

                {glass.enabled && (
                    <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Slider
                            label={`Reflection: ${Math.round(glass.reflectionIntensity * 100)}%`}
                            value={glass.reflectionIntensity}
                            onChange={(v) => updateGlassParams({ reflectionIntensity: v })}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                        <Slider
                            label={`Angle: ${glass.reflectionAngle}`}
                            value={glass.reflectionAngle}
                            onChange={(v) => updateGlassParams({ reflectionAngle: v })}
                            min={-180}
                            max={180}
                        />
                        <Slider
                            label={`Width: ${Math.round(glass.reflectionWidth * 100)}%`}
                            value={glass.reflectionWidth}
                            onChange={(v) => updateGlassParams({ reflectionWidth: v })}
                            min={0.1}
                            max={1}
                            step={0.05}
                        />
                        <div className="foundry-param-row">
                            <Input
                                label="Tint Color"
                                type="color"
                                value={glass.tint}
                                onChange={(v) => updateGlassParams({ tint: v })}
                            />
                            <Slider
                                label={`Tint: ${Math.round(glass.tintOpacity * 100)}%`}
                                value={glass.tintOpacity}
                                onChange={(v) => updateGlassParams({ tintOpacity: v })}
                                min={0}
                                max={0.5}
                                step={0.01}
                            />
                        </div>
                        <Slider
                            label={`Curvature: ${Math.round(glass.curvature * 100)}%`}
                            value={glass.curvature}
                            onChange={(v) => updateGlassParams({ curvature: v })}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
