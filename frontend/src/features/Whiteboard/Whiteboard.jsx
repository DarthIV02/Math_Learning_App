import { useState, useRef, useCallback } from 'react';
import './Whiteboard.css';
import useWhiteboard from './hooks/useWhiteboard';
import PlacedSticker from './components/PlacedSticker';
import StickerTray from './components/StickerTray';
import TipBubble from './components/TipBubble';

/**
 * Whiteboard
 *
 * Props:
 *   stickers — array of { id, emoji, label, defaultValue?, color? }
 *   tips     — string[]  hint sentences shown in the tip bubble
 *              e.g. ['Teile die Kekse in gleiche Gruppen!', 'Nutze Sticker zum Zählen.']
 */
export default function Whiteboard({
    stickers = [],
    tips = [],
    isLoadingTip = false,
    onRequestTips,
  }) {
    const { canvasRef, hasDrawn, startDrawing, draw, stopDrawing, clearBoard } =
      useWhiteboard();

    const [placed, setPlaced] = useState([]);
    const [showTip, setShowTip] = useState(false);
    const boardRef = useRef(null);

    const handleTipsClick = useCallback(async () => {
      if (!onRequestTips) return;

      const canvasImage = canvasRef.current?.toDataURL('image/png');

      await onRequestTips({
        placed,
        canvas: canvasImage,
      });

      setShowTip(true);
    }, [onRequestTips, placed, canvasRef]);

    /* ── Drag from tray (mouse) ── */
    const draggingFromTray = useRef(null);

    const onTrayDragStart = useCallback((e, sticker) => {
      draggingFromTray.current = sticker;
      e.dataTransfer.effectAllowed = 'copy';
      const ghost = document.createElement('div');
      ghost.style.cssText = 'position:fixed;top:-999px;opacity:0;';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }, []);

    const onBoardDrop = useCallback((e) => {
      e.preventDefault();
      const sticker = draggingFromTray.current;
      if (!sticker || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      setPlaced((prev) => [
        ...prev,
        {
          ...sticker,
          uid: `${Date.now()}-${Math.random()}`,
          value: sticker.defaultValue ?? 1,
          x: Math.max(0, e.clientX - rect.left - 28),
          y: Math.max(0, e.clientY - rect.top - 28),
        },
      ]);
      draggingFromTray.current = null;
    }, []);

    const onBoardDragOver = useCallback((e) => {
      if (draggingFromTray.current) e.preventDefault();
    }, []);

    /* ── Touch drag from tray ── */
    const touchSticker = useRef(null);
    const touchGhost = useRef(null);

    const onTrayTouchStart = useCallback((e, sticker) => {
      touchSticker.current = sticker;
      const ghost = document.createElement('div');
      ghost.className = 'sticker-ghost';
      ghost.textContent = sticker.emoji;
      document.body.appendChild(ghost);
      touchGhost.current = ghost;
      const t = e.touches[0];
      ghost.style.left = `${t.clientX - 28}px`;
      ghost.style.top = `${t.clientY - 28}px`;
    }, []);

    const onTrayTouchMove = useCallback((e) => {
      if (!touchGhost.current) return;
      e.preventDefault();
      const t = e.touches[0];
      touchGhost.current.style.left = `${t.clientX - 28}px`;
      touchGhost.current.style.top = `${t.clientY - 28}px`;
    }, []);

    const onTrayTouchEnd = useCallback((e) => {
      const sticker = touchSticker.current;
      const ghost = touchGhost.current;
      if (!sticker || !ghost || !boardRef.current) return;
      document.body.removeChild(ghost);
      touchGhost.current = null;
      const t = e.changedTouches[0];
      const rect = boardRef.current.getBoundingClientRect();
      if (
        t.clientX >= rect.left && t.clientX <= rect.right &&
        t.clientY >= rect.top  && t.clientY <= rect.bottom
      ) {
        setPlaced((prev) => [
          ...prev,
          {
            ...sticker,
            uid: `${Date.now()}-${Math.random()}`,
            value: sticker.defaultValue ?? 1,
            x: Math.max(0, t.clientX - rect.left - 28),
            y: Math.max(0, t.clientY - rect.top - 28),
          },
        ]);
      }
      touchSticker.current = null;
    }, []);

    /* ── Re-drag placed stickers ── */
    const draggingPlaced = useRef(null);

    const onPlacedPointerDown = useCallback((e, uid) => {
      if (e.target.classList.contains('sticker-value')) return;
      if (e.target.closest('.placed-sticker__delete')) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      draggingPlaced.current = {
        uid,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
    }, []);

    const onBoardPointerMove = useCallback((e) => {
      const dragging = draggingPlaced.current;
      if (!dragging || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      setPlaced((prev) =>
        prev.map((p) =>
          p.uid === dragging.uid
            ? {
                ...p,
                x: Math.max(0, e.clientX - rect.left - dragging.offsetX),
                y: Math.max(0, e.clientY - rect.top  - dragging.offsetY),
              }
            : p
        )
      );
    }, []);

    const onBoardPointerUp = useCallback(() => {
      draggingPlaced.current = null;
    }, []);

    /* ── Value edit ── */
    const onValueChange = useCallback((uid, raw) => {
      const val = raw.replace(/[^0-9]/g, '').slice(0, 4);
      setPlaced((prev) =>
        prev.map((p) => (p.uid === uid ? { ...p, value: val } : p))
      );
    }, []);

    /* ── Delete sticker ── */
    const onDeleteSticker = useCallback((uid) => {
      setPlaced((prev) => prev.filter((p) => p.uid !== uid));
    }, []);

    /* ── Clear everything ── */
    const handleClear = useCallback(() => {
      clearBoard();
      setPlaced([]);
    }, [clearBoard]);

    return (
      <div className="whiteboard-shell">
        {stickers.length > 0 && (
          <StickerTray
            stickers={stickers}
            onTrayDragStart={onTrayDragStart}
            onTrayTouchStart={onTrayTouchStart}
            onTrayTouchMove={onTrayTouchMove}
            onTrayTouchEnd={onTrayTouchEnd}
          />
        )}

        <div
          className="whiteboard-area"
          ref={boardRef}
          onDrop={onBoardDrop}
          onDragOver={onBoardDragOver}
          onPointerMove={onBoardPointerMove}
          onPointerUp={onBoardPointerUp}
        >
          {/* Tips button — only shown when tips are provided */}
          <button
            type="button"
            onClick={handleTipsClick}
            className={`whiteboard-tips${showTip ? ' whiteboard-tips--active' : ''}`}
            aria-expanded={showTip}
            aria-label="Tipps anzeigen"
            disabled={isLoadingTip}
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

          {!hasDrawn && placed.length === 0 && (
            <div className="whiteboard-placeholder">
              <span className="whiteboard-placeholder__text">
                ✏️ Kritzel hier
              </span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="whiteboard-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {placed.map((p) => (
            <PlacedSticker
              key={p.uid}
              {...p}
              onPointerDown={onPlacedPointerDown}
              onValueChange={onValueChange}
              onDelete={onDeleteSticker}
            />
          ))}

          {/* Tip bubble — rendered inside the board so it's positioned relative to it */}
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