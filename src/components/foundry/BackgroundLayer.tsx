/**
 * BackgroundLayer
 * Renders an optional background image for alignment in the Foundry
 * 
 * AUTHORING-ONLY: This is used to align gauges against existing panel art.
 */

import React, { useState, useEffect } from 'react';
import { Image } from 'react-konva';
import { BackgroundParams } from '@/stores/foundryStore';

// Simple hook to avoid external dependency
function useLocalImage(src: string): [HTMLImageElement | undefined] {
    const [image, setImage] = useState<HTMLImageElement>();

    useEffect(() => {
        if (!src) return;
        const img = new window.Image();
        img.src = src;
        img.onload = () => setImage(img);
    }, [src]);

    return [image];
}

interface BackgroundLayerProps {
    params: BackgroundParams;
    width: number;
    height: number;
    onTransform?: (x: number, y: number) => void;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
    params,
    width,
    height,
    onTransform
}) => {
    const [image] = useLocalImage(params.src);

    if (!params.src || !image) return null;

    const handleDragEnd = (e: any) => {
        if (onTransform) {
            // Subtract half width/height because we use center-based positioning in UI
            onTransform(
                e.target.x() - width / 2,
                e.target.y() - height / 2
            );
        }
    };

    return (
        <Image
            image={image}
            x={params.x + width / 2}
            y={params.y + height / 2}
            width={image.width * params.scale}
            height={image.height * params.scale}
            offsetX={image.width / 2}
            offsetY={image.height / 2}
            opacity={params.opacity / 100}
            draggable={!params.locked}
            onDragEnd={handleDragEnd}
        />
    );
};
