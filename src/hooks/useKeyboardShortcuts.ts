/**
 * Keyboard shortcuts hook
 * Handles nudging, deletion, copy/paste, z-order shortcuts
 */

import { useEffect, useCallback } from 'react';
import { useWidgetStore } from '@/stores';

const NUDGE_AMOUNT = 1;
const NUDGE_SHIFT_AMOUNT = 10;

export function useKeyboardShortcuts(): void {
  const {
    selectedWidgetId,
    nudgeWidget,
    removeWidget,
    copyWidget,
    pasteWidget,
    duplicateWidget,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    toggleLock,
    getSelectedWidget,
  } = useWidgetStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Always prevent browser default for our shortcuts, even without selection
      // This prevents Ctrl+D from bookmarking, etc.
      if ((e.ctrlKey || e.metaKey) && ['d', 'c', 'v', 'l', '[', ']'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      const widget = getSelectedWidget();
      if (!widget) return;

      // Prevent default for handled shortcuts
      const nudgeAmount = e.shiftKey ? NUDGE_SHIFT_AMOUNT : NUDGE_AMOUNT;

      // Arrow keys for nudging
      if (e.key === 'ArrowUp' && !widget.locked) {
        e.preventDefault();
        nudgeWidget(selectedWidgetId!, 0, -nudgeAmount);
      } else if (e.key === 'ArrowDown' && !widget.locked) {
        e.preventDefault();
        nudgeWidget(selectedWidgetId!, 0, nudgeAmount);
      } else if (e.key === 'ArrowLeft' && !widget.locked) {
        e.preventDefault();
        nudgeWidget(selectedWidgetId!, -nudgeAmount, 0);
      } else if (e.key === 'ArrowRight' && !widget.locked) {
        e.preventDefault();
        nudgeWidget(selectedWidgetId!, nudgeAmount, 0);
      }

      // Delete/Backspace to remove widget
      if ((e.key === 'Delete' || e.key === 'Backspace') && !widget.locked) {
        e.preventDefault();
        removeWidget(selectedWidgetId!);
      }

      // Ctrl/Cmd + C to copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyWidget(selectedWidgetId!);
      }

      // Ctrl/Cmd + V to paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteWidget();
      }

      // Ctrl/Cmd + D to duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateWidget(selectedWidgetId!);
      }

      // Ctrl/Cmd + L to lock/unlock
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        toggleLock(selectedWidgetId!);
      }

      // Z-order shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']') {
        e.preventDefault();
        bringToFront(selectedWidgetId!);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '[') {
        e.preventDefault();
        sendToBack(selectedWidgetId!);
      } else if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        bringForward(selectedWidgetId!);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        sendBackward(selectedWidgetId!);
      }
    },
    [
      selectedWidgetId,
      getSelectedWidget,
      nudgeWidget,
      removeWidget,
      copyWidget,
      pasteWidget,
      duplicateWidget,
      toggleLock,
      bringToFront,
      sendToBack,
      bringForward,
      sendBackward,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
