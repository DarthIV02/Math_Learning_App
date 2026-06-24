import { useState, useRef, useCallback } from 'react';
import './Whiteboard.css';

import useWhiteboard from './hooks/useWhiteboard';
import useWhiteboardSnapshot from './hooks/useWhiteboardSnapshot';
import useStickerDrag from './hooks/useStickerDrag';

import { exportWhiteboardImage, isCanvasBlank} from './utils/canvasUtils';

import PlacedSticker from './components/PlacedSticker';
import StickerTray from './components/StickerTray';
import TipBubble from './components/TipBubble';

export default function Whiteboard({
  snapshotKey,
  stickers = [],
  tips = [],
  isLoadingTip = false,
  onRequestTips,
  initialSnapshot,
  onSnapshotChange,
}) {
  const boardRef = useRef(null);
  const [showTip, setShowTip] = useState(false);
  const [hasStartedDrawing, setHasStartedDrawing] = useState(
    Boolean(initialSnapshot?.strokes?.length)
  );

  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearBoard,
    getStrokes,
    setStrokes,
  } = useWhiteboard();

  const {
    placed,
    updatePlaced,
    hasDrawing,
    saveSnapshot,
    clearSnapshot,
  } = useWhiteboardSnapshot({
    canvasRef,
    boardRef,
    initialSnapshot,
    snapshotKey,
    onSnapshotChange,
    getStrokes,
    setStrokes,
  });

  const dragHandlers = useStickerDrag({
    boardRef,
    updatePlaced,
  });

  const handleStartDrawing = useCallback((e) => {
    setHasStartedDrawing(true);
    startDrawing(e);
  }, [startDrawing]);

  const handleStopDrawing = useCallback(
    () => {
      const didDraw = stopDrawing();

      if (!didDraw) return;

      const canvas = canvasRef.current;
      const hasRealDrawing = canvas && !isCanvasBlank(canvas);

      saveSnapshot(placed, hasRealDrawing);
    },
    [stopDrawing, saveSnapshot, placed, canvasRef]
  );

  const handleClear = useCallback(() => {
    setHasStartedDrawing(false);
    clearSnapshot(clearBoard);
    onSnapshotChange?.({
      placed: [],
      strokes: [],
      preview: null,
    });
  }, [clearSnapshot, clearBoard, onSnapshotChange]);

  const handleTipsClick = useCallback(async () => {
    if (!onRequestTips) return;

    const image = exportWhiteboardImage({
      board: boardRef.current,
      drawingCanvas: canvasRef.current,
      placed,
    });

    await onRequestTips({
      placed,
      canvas: image,
    });

    setShowTip(true);

    console.log(image);
    
  }, [onRequestTips, placed, canvasRef]);

  const onValueChange = useCallback(
    (uid, raw) => {
      const value = raw.replace(/[^0-9]/g, '').slice(0, 4);

      updatePlaced((prev) =>
        prev.map((p) =>
          p.uid === uid
            ? { ...p, value }
            : p
        )
      );
    },
    [updatePlaced]
  );

  const onDeleteSticker = useCallback(
    (uid) => {
      updatePlaced((prev) => prev.filter((p) => p.uid !== uid));
    },
    [updatePlaced]
  );

  const isEmpty = placed.length === 0 && !hasDrawing && !hasStartedDrawing;

  return (
    <div className="whiteboard-shell">
      {stickers.length > 0 && (
        <StickerTray
          stickers={stickers}
          onTrayDragStart={dragHandlers.onTrayDragStart}
          onTrayDragEnd={dragHandlers.onTrayDragEnd}
          onTrayPointerDown={dragHandlers.onTrayPointerDown}
          onTrayPointerMove={dragHandlers.onTrayPointerMove}
          onTrayPointerUp={dragHandlers.onTrayPointerUp}
        />
      )}

      <div
        className="whiteboard-area"
        ref={boardRef}
        onDrop={dragHandlers.onBoardDrop}
        onDragOver={dragHandlers.onBoardDragOver}
        onPointerMove={dragHandlers.onBoardPointerMove}
        onPointerUp={dragHandlers.onBoardPointerUp}
      >
        <button
          type="button"
          onClick={handleTipsClick}
          className={`whiteboard-tips${showTip ? ' whiteboard-tips--active' : ''}`}
          aria-expanded={showTip}
          aria-label="Tipps anzeigen"
          disabled={isLoadingTip}
          data-tutorial="tips-button"
        >
          💡 <span>{isLoadingTip ? 'Denke...' : 'Tipps'}</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="whiteboard-clear"
        >
          🧹 <span>Alles weg</span>
        </button>

        {isEmpty && (
          <div className="whiteboard-placeholder">
            <span className="whiteboard-placeholder__text">
              ✏️ Kritzel hier
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={handleStartDrawing}
          onMouseMove={draw}
          onMouseUp={handleStopDrawing}
          onMouseLeave={handleStopDrawing}
          onTouchStart={handleStartDrawing}
          onTouchMove={draw}
          onTouchEnd={handleStopDrawing}
        />

        {placed.map((p) => (
          <PlacedSticker
            key={p.uid}
            {...p}
            onPointerDown={dragHandlers.onPlacedPointerDown}
            onValueChange={onValueChange}
            onDelete={onDeleteSticker}
          />
        ))}

        {showTip && (
          <TipBubble
            tips={tips}
            onClose={() => setShowTip(false)}
          />
        )}
      </div>
    </div>
  );
}