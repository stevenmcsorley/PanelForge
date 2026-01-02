/**
 * PanelCanvas
 * Main canvas component using Konva.js
 * Renders all widgets at fixed resolution
 */

import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore, useWidgetStore } from '@/stores';
import { WidgetRenderer } from '../widgets/WidgetRenderer';

interface PanelCanvasProps {
  stageRef?: React.RefObject<Konva.Stage>;
}

export const PanelCanvas: React.FC<PanelCanvasProps> = ({ stageRef }) => {
  const internalRef = useRef<Konva.Stage>(null);
  const ref = stageRef || internalRef;
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [bgImageLoaded, setBgImageLoaded] = React.useState(false);

  const {
    resolution,
    backgroundColor,
    backgroundImage,
    showGrid,
    gridSize,
    showSafeArea,
    safeAreaMargin,
    zoom,
    panX,
    panY,
  } = useCanvasStore();

  const { widgets, selectedWidgetId, selectWidget, moveWidget } = useWidgetStore();

  // Load background image
  useEffect(() => {
    if (backgroundImage) {
      const img = new window.Image();
      img.src = backgroundImage;
      img.onload = () => {
        bgImageRef.current = img;
        setBgImageLoaded(true);
      };
      img.onerror = () => {
        bgImageRef.current = null;
        setBgImageLoaded(false);
      };
    } else {
      bgImageRef.current = null;
      setBgImageLoaded(false);
    }
  }, [backgroundImage]);

  // Sort widgets by z-index for rendering
  const sortedWidgets = [...widgets].sort((a, b) => a.zIndex - b.zIndex);

  // Generate grid lines
  const gridLines: JSX.Element[] = [];
  if (showGrid) {
    // Vertical lines
    for (let x = 0; x <= resolution.width; x += gridSize) {
      gridLines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, resolution.height]}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={1}
        />
      );
    }
    // Horizontal lines
    for (let y = 0; y <= resolution.height; y += gridSize) {
      gridLines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, resolution.width, y]}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={1}
        />
      );
    }
  }

  // Safe area rectangle
  const safeAreaRect = showSafeArea ? (
    <Rect
      x={safeAreaMargin}
      y={safeAreaMargin}
      width={resolution.width - safeAreaMargin * 2}
      height={resolution.height - safeAreaMargin * 2}
      stroke="rgba(0, 255, 0, 0.5)"
      strokeWidth={1}
      dash={[5, 5]}
    />
  ) : null;

  // Handle clicking on empty canvas to deselect
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only deselect if clicking directly on stage or background
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      selectWidget(null);
    }
  };

  return (
    <div
      className="panel-canvas-container"
      style={{
        overflow: 'hidden',
        width: resolution.width * zoom,
        height: resolution.height * zoom,
      }}
    >
      <Stage
        ref={ref as React.RefObject<Konva.Stage>}
        width={resolution.width}
        height={resolution.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onClick={handleStageClick}
        style={{ background: backgroundColor }}
      >
        {/* Background layer */}
        <Layer name="background-layer">
          <Rect
            name="background"
            x={0}
            y={0}
            width={resolution.width}
            height={resolution.height}
            fill={backgroundColor}
          />
          {bgImageLoaded && bgImageRef.current && (
            <KonvaImage
              image={bgImageRef.current}
              x={0}
              y={0}
              width={resolution.width}
              height={resolution.height}
            />
          )}
        </Layer>

        {/* Grid overlay layer */}
        <Layer name="grid-layer" listening={false}>
          {gridLines}
          {safeAreaRect}
        </Layer>

        {/* Widgets layer */}
        <Layer name="widgets-layer">
          {sortedWidgets.map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              isSelected={widget.id === selectedWidgetId}
              onSelect={() => selectWidget(widget.id)}
              onDragEnd={(x, y) => {
                if (!widget.locked) {
                  moveWidget(widget.id, x, y);
                }
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
