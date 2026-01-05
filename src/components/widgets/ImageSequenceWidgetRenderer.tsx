/**
 * ImageSequenceWidgetRenderer
 * Renders AIDA64-style frame-based gauges
 *
 * AIDA64 Parity:
 * - Gauge is an ordered sequence of static images
 * - Each image represents a discrete gauge state
 * - Frame selection: frameIndex = floor(normalized * (images.length - 1))
 * - Only the active frame is rendered at any time
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import { ImageSequenceWidget } from '@/types';
import { useSensorValue } from '@/hooks';

interface ImageSequenceWidgetRendererProps {
    widget: ImageSequenceWidget;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (x: number, y: number) => void;
}

export const ImageSequenceWidgetRenderer: React.FC<ImageSequenceWidgetRendererProps> = ({
    widget,
    isSelected,
    onSelect,
    onDragEnd,
}) => {
    const sensorValue = useSensorValue(widget.sensorBinding);
    const [loadedImages, setLoadedImages] = useState<(HTMLImageElement | null)[]>([]);
    const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

    // Load all frame images
    useEffect(() => {
        if (widget.images.length === 0) {
            setLoadedImages([]);
            setLoadingState('idle');
            return;
        }

        setLoadingState('loading');
        const imageElements: (HTMLImageElement | null)[] = new Array(widget.images.length).fill(null);
        let loadedCount = 0;
        let hasError = false;

        widget.images.forEach((src, index) => {
            const img = new window.Image();
            img.src = src;
            img.onload = () => {
                imageElements[index] = img;
                loadedCount++;
                if (loadedCount === widget.images.length) {
                    setLoadedImages([...imageElements]);
                    setLoadingState(hasError ? 'error' : 'loaded');
                }
            };
            img.onerror = () => {
                hasError = true;
                loadedCount++;
                if (loadedCount === widget.images.length) {
                    setLoadedImages([...imageElements]);
                    setLoadingState('error');
                }
            };
        });
    }, [widget.images]);

    // Calculate current frame index based on sensor value
    const frameIndex = useMemo(() => {
        if (widget.images.length === 0) return -1;
        if (widget.images.length === 1) return 0;

        // Modulo mode: use sensorValue % frameCount for time-based cycling
        // e.g., time sensor (0-86399) with 60 frames and divisor=1 = shows seconds
        // e.g., time sensor (0-86399) with 60 frames and divisor=60 = shows minutes
        // e.g., time sensor (0-86399) with 12 frames and divisor=3600 = shows hours
        if (widget.useModulo) {
            const divisor = widget.moduloDivisor || 1;
            const dividedValue = Math.floor(sensorValue / divisor);
            const index = dividedValue % widget.images.length;
            return Math.max(0, index);
        }

        // Standard mode: AIDA64 Parity - normalized range mapping
        const range = widget.maxValue - widget.minValue;
        if (range === 0) return 0;

        let normalized = (sensorValue - widget.minValue) / range;

        if (widget.clamp) {
            normalized = Math.min(Math.max(normalized, 0), 1);
        }

        // AIDA64 exact behavior: floor(normalized * (frameCount - 1))
        const index = Math.floor(normalized * (widget.images.length - 1));

        // Clamp to valid range even if clamp is false (prevent array bounds error)
        return Math.max(0, Math.min(index, widget.images.length - 1));
    }, [sensorValue, widget.minValue, widget.maxValue, widget.clamp, widget.images.length, widget.useModulo, widget.moduloDivisor]);

    // Get current frame image
    const currentImage = frameIndex >= 0 && loadedImages[frameIndex] ? loadedImages[frameIndex] : null;

    return (
        <Group
            x={widget.x}
            y={widget.y}
            draggable={!widget.locked && widget.visible}
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                const node = e.target;
                onDragEnd(node.x(), node.y());
            }}
            visible={widget.visible}
            opacity={widget.visible ? 1 : 0.3}
        >
            {/* Selection indicator */}
            {isSelected && (
                <Rect
                    x={-2}
                    y={-2}
                    width={widget.width + 4}
                    height={widget.height + 4}
                    stroke="#00aaff"
                    strokeWidth={1}
                    dash={[3, 3]}
                />
            )}

            {/* Lock indicator */}
            {widget.locked && isSelected && (
                <Rect
                    x={-4}
                    y={-4}
                    width={widget.width + 8}
                    height={widget.height + 8}
                    stroke="#ff6600"
                    strokeWidth={2}
                    dash={[5, 5]}
                />
            )}

            {/* Placeholder when no frames or loading */}
            {(widget.images.length === 0 || loadingState === 'loading' || !currentImage) && (
                <>
                    <Rect
                        x={0}
                        y={0}
                        width={widget.width}
                        height={widget.height}
                        fill="#2a2a3a"
                        stroke="#444"
                        strokeWidth={1}
                    />
                    <Text
                        x={0}
                        y={widget.height / 2 - 8}
                        width={widget.width}
                        text={
                            widget.images.length === 0
                                ? '📷 No frames'
                                : loadingState === 'loading'
                                    ? 'Loading...'
                                    : `Frame ${frameIndex + 1}/${widget.images.length}`
                        }
                        fontSize={10}
                        fontFamily="Arial"
                        fill="#888"
                        align="center"
                    />
                </>
            )}

            {/* Render active frame */}
            {currentImage && (
                <KonvaImage
                    image={currentImage}
                    x={0}
                    y={0}
                    width={widget.width}
                    height={widget.height}
                />
            )}

            {/* Frame indicator when selected */}
            {isSelected && widget.images.length > 0 && (
                <Text
                    x={0}
                    y={widget.height + 4}
                    text={`Frame ${frameIndex + 1}/${widget.images.length}`}
                    fontSize={9}
                    fontFamily="Arial"
                    fill="#888"
                />
            )}
        </Group>
    );
};
