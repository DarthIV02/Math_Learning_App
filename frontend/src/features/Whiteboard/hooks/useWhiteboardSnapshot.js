import { useCallback, useEffect, useState } from 'react';
import { isCanvasBlank, restoreCanvasFromImage } from '../utils/canvasUtils';

export default function useWhiteboardSnapshot({
  canvasRef,
  initialSnapshot,
  onSnapshotChange,
}) {
  const [placed, setPlaced] = useState(initialSnapshot?.placed ?? []);
  const [hasDrawing, setHasDrawing] = useState(Boolean(initialSnapshot?.drawing));

  useEffect(() => {
    restoreCanvasFromImage(
      canvasRef.current,
      initialSnapshot?.drawing,
      setHasDrawing
    );
  }, []);

  const saveSnapshot = useCallback(
    (nextPlaced = placed, hasRealDrawing = null) => {
      const canvas = canvasRef.current;

      const hasSomething =
        hasRealDrawing ?? !isCanvasBlank(canvas);

      const drawing =
        hasSomething && canvas
          ? canvas.toDataURL('image/png')
          : null;

      setHasDrawing(hasSomething);

      onSnapshotChange?.({
        placed: nextPlaced,
        drawing,
      });
    },
    [canvasRef, onSnapshotChange, placed]
  );

  const updatePlaced = useCallback(
    (updater) => {
      setPlaced((prev) => {
        const next =
          typeof updater === 'function'
            ? updater(prev)
            : updater;

        saveSnapshot(next);
        return next;
      });
    },
    [saveSnapshot]
  );

  const clearSnapshot = useCallback(
    (clearBoard) => {
      clearBoard();
      setPlaced([]);
      setHasDrawing(false);

      onSnapshotChange?.({
        placed: [],
        drawing: null,
      });
    },
    [onSnapshotChange]
  );

  return {
    placed,
    updatePlaced,
    hasDrawing,
    saveSnapshot,
    clearSnapshot,
  };
}