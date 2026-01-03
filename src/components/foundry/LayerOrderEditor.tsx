/**
 * LayerOrderEditor
 * Allows reordering of gauge layers (background, ticks, labels, leds, needle)
 */

import React from 'react';
import { useFoundryStore, LayerType } from '@/stores/foundryStore';
import { Button } from '@/components/ui';

const LAYER_LABELS: Record<LayerType, string> = {
    background: 'Background Image',
    ticks: 'Tick Marks',
    labels: 'Labels',
    leds: 'LED Segments',
    needle: 'Needle',
};

const LAYER_ICONS: Record<LayerType, string> = {
    background: '🖼️',
    ticks: '📏',
    labels: '🔢',
    leds: '💡',
    needle: '📍',
};

export const LayerOrderEditor: React.FC = () => {
    const {
        layerOrder,
        moveLayerUp,
        moveLayerDown,
        resetLayerOrder,
        selectedTemplate,
    } = useFoundryStore();

    // Filter layers based on template
    const visibleLayers = layerOrder.filter((layer) => {
        if (layer === 'leds' && selectedTemplate === 'needle') return false;
        if (layer === 'needle' && selectedTemplate === 'led_arc') return false;
        return true;
    });

    return (
        <div className="foundry-param-group">
            <div className="foundry-param-group-title">Layer Order (Top to Bottom)</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {visibleLayers.map((layer, index) => (
                    <div
                        key={layer}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            background: '#1a1a2a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>{LAYER_ICONS[layer]}</span>
                        <span style={{ flex: 1, fontSize: '12px', color: '#ccc' }}>
                            {LAYER_LABELS[layer]}
                        </span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                                onClick={() => moveLayerUp(layer)}
                                disabled={index === 0}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    background: index === 0 ? '#1a1a2a' : '#2a2a3a',
                                    border: '1px solid #444',
                                    borderRadius: '3px',
                                    color: index === 0 ? '#444' : '#aaa',
                                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '12px',
                                }}
                                title="Move Up"
                            >
                                ▲
                            </button>
                            <button
                                onClick={() => moveLayerDown(layer)}
                                disabled={index === visibleLayers.length - 1}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    background: index === visibleLayers.length - 1 ? '#1a1a2a' : '#2a2a3a',
                                    border: '1px solid #444',
                                    borderRadius: '3px',
                                    color: index === visibleLayers.length - 1 ? '#444' : '#aaa',
                                    cursor: index === visibleLayers.length - 1 ? 'not-allowed' : 'pointer',
                                    fontSize: '12px',
                                }}
                                title="Move Down"
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '8px' }}>
                <Button variant="secondary" onClick={resetLayerOrder} fullWidth>
                    Reset Order
                </Button>
            </div>

            <div style={{ marginTop: '8px', fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                Note: Encasing (rim, glass) always renders on top
            </div>
        </div>
    );
};
