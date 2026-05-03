import { useState, useCallback } from 'react';
import ColoredEmoji from './ColoredEmoji';

/**
 * PlacedSticker
 *
 * A single sticker dropped onto the whiteboard.
 * Supports canvas-recolored emoji via the `color` prop.
 */
export default function PlacedSticker({
  uid,
  emoji,
  color,
  value,
  x,
  y,
  onPointerDown,
  onValueChange,
  onDelete,
}) {
  const [showDelete, setShowDelete] = useState(false);

  const handleClick = useCallback((e) => {
    if (e.target.classList.contains('sticker-value')) return;
    setShowDelete((v) => !v);
  }, []);

  const handleDoubleClick = useCallback((e) => {
    if (e.target.classList.contains('sticker-value')) return;
    onDelete(uid);
  }, [uid, onDelete]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    onDelete(uid);
  }, [uid, onDelete]);

  const handlePointerDown = useCallback((e) => {
    if (
      e.target.classList.contains('sticker-delete') ||
      e.target.classList.contains('sticker-value')
    ) return;
    onPointerDown(e, uid);
  }, [uid, onPointerDown]);

  return (
    <div
      className={`placed-sticker${showDelete ? ' placed-sticker--active' : ''}`}
      style={{ left: x, top: y }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        type="button"
        className={`sticker-delete${showDelete ? ' sticker-delete--visible' : ''}`}
        onClick={handleDeleteClick}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Sticker löschen"
      >
        ❌
      </button>

      <ColoredEmoji emoji={emoji} color={color} size={48} />

      <input
        className="sticker-value"
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onValueChange(uid, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Wert des Stickers"
      />
    </div>
  );
}