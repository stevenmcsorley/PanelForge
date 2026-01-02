/**
 * WidgetRenderer
 * Dispatches rendering to appropriate widget type renderer
 *
 * AIDA64 Parity:
 * - image_transform: Primary animation primitive (needles, fans)
 * - masked_image: Bar/arc animation via image cropping
 * - radial_segment: DEPRECATED - kept for backwards compatibility
 */

import React from 'react';
import { Widget, isDeprecatedWidget } from '@/types';
import { TextWidgetRenderer } from './TextWidgetRenderer';
import { ImageWidgetRenderer } from './ImageWidgetRenderer';
import { ImageTransformWidgetRenderer } from './ImageTransformWidgetRenderer';
import { MaskedImageWidgetRenderer } from './MaskedImageWidgetRenderer';
import { ImageSequenceWidgetRenderer } from './ImageSequenceWidgetRenderer';
import { RadialSegmentWidgetRenderer } from './RadialSegmentWidgetRenderer';

interface WidgetRendererProps {
  widget: Widget;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  // Log deprecation warning for deprecated widget types
  if (isDeprecatedWidget(widget.type)) {
    console.warn(
      `[PanelForge] Widget "${widget.name}" uses deprecated type "${widget.type}". ` +
      'Consider migrating to ImageTransformWidget + MaskedImageWidget for AIDA64 parity.'
    );
  }

  switch (widget.type) {
    case 'text':
      return (
        <TextWidgetRenderer
          widget={widget}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );

    case 'image':
      return (
        <ImageWidgetRenderer
          widget={widget}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );

    case 'image_transform':
      return (
        <ImageTransformWidgetRenderer
          widget={widget}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );

    case 'masked_image':
      return (
        <MaskedImageWidgetRenderer
          widget={widget}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );

    case 'image_sequence':
      return (
        <ImageSequenceWidgetRenderer
          widget={widget}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );

    // DEPRECATED: Kept for backwards compatibility
    case 'radial_segment':
      return (
        <RadialSegmentWidgetRenderer
          widget={widget}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );

    default:
      return null;
  }
};
