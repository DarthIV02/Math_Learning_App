import { useCallback, useEffect, useState } from 'react';
import { exportWhiteboardImage, restoreCanvasFromImage } from '../utils/canvasUtils';

export default function useWhiteboardSnapshot({
  canvasRef,
  boardRef,
  initialSnapshot,
  onSnapshotChange,
  getStrokes,
}) {
  const [placed, setPlaced] = useState(initialSnapshot?.placed ?? []);
  const [hasDrawing, setHasDrawing] = useState(Boolean(initialSnapshot?.drawing));

  // useEffect(() => {
  //   restoreCanvasFromImage(
  //     canvasRef.current,
  //     initialSnapshot?.drawing,
  //     setHasDrawing
  //   );
  // }, [canvasRef, initialSnapshot?.drawing]);

  const buildSnapshot = useCallback(
    (nextPlaced, hasRealDrawing = null) => {
      const canvas = canvasRef.current;
      const strokes = getStrokes?.() ?? [];

      const hasSomething =
        hasRealDrawing ?? strokes.length > 0;

      const preview =
        boardRef?.current
          ? exportWhiteboardImage({
              board: boardRef.current,
              drawingCanvas: canvas,
              placed: nextPlaced,
            })
          : null;

      return {
        placed: nextPlaced,
        strokes,
        preview,
        hasSomething: Boolean(hasSomething),
      };
    },
    [canvasRef, boardRef, getStrokes]
  );

  const notifySnapshotChange = useCallback(
    (nextPlaced, hasRealDrawing = null) => {
      const snapshot = buildSnapshot(nextPlaced, hasRealDrawing);

      setHasDrawing(snapshot.hasSomething);

      onSnapshotChange?.({
        placed: snapshot.placed,
        strokes: snapshot.strokes,
        preview: snapshot.preview,
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
        requestAnimationFrame(() => {
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
        strokes: [],
        preview: null,
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