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
  }, [canvasRef, initialSnapshot?.drawing]);

  const buildSnapshot = useCallback(
    (nextPlaced, hasRealDrawing = null) => {
      const canvas = canvasRef.current;

      const hasSomething =
        hasRealDrawing ?? (canvas && !isCanvasBlank(canvas));

      const drawing =
        hasSomething && canvas
          ? canvas.toDataURL('image/png')
          : null;

      return {
        placed: nextPlaced,
        drawing,
        hasSomething: Boolean(hasSomething),
      };
    },
    [canvasRef]
  );

  const notifySnapshotChange = useCallback(
    (nextPlaced, hasRealDrawing = null) => {
      const snapshot = buildSnapshot(nextPlaced, hasRealDrawing);

      setHasDrawing(snapshot.hasSomething);

      onSnapshotChange?.({
        placed: snapshot.placed,
        drawing: snapshot.drawing,
      });
    },
    [buildSnapshot, onSnapshotChange]
  );

  const updatePlaced = useCallback(
    (updater) => {
      setPlaced((prev) => {
        const next =
          typeof updater === 'function'
            ? updater(prev)
            : updater;

        // defer parent update until after this state update finishes
        queueMicrotask(() => {
          notifySnapshotChange(next);
        });

        return next;
      });
    },
    [notifySnapshotChange]
  );

  const saveSnapshot = useCallback(
    (nextPlaced = placed, hasRealDrawing = null) => {
      notifySnapshotChange(nextPlaced, hasRealDrawing);
    },
    [notifySnapshotChange, placed]
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