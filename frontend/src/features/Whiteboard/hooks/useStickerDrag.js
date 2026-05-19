import { useCallback, useRef } from 'react';

export default function useStickerDrag({ boardRef, updatePlaced }) {
  const draggingFromTray = useRef(null);
  const touchSticker = useRef(null);
  const touchGhost = useRef(null);
  const draggingPlaced = useRef(null);

  const addStickerAt = useCallback(
    (sticker, clientX, clientY) => {
      if (!sticker || !boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();

      updatePlaced((prev) => [
        ...prev,
        {
          ...sticker,
          uid: `${Date.now()}-${Math.random()}`,
          value: sticker.defaultValue ?? 1,
          x: Math.max(0, clientX - rect.left - 28),
          y: Math.max(0, clientY - rect.top - 28),
        },
      ]);
    },
    [boardRef, updatePlaced]
  );

  const onTrayDragStart = useCallback((e, sticker) => {
    draggingFromTray.current = sticker;
    e.dataTransfer.effectAllowed = 'copy';

    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-999px;opacity:0;';
    document.body.appendChild(ghost);

    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, []);

  const onBoardDrop = useCallback(
    (e) => {
      e.preventDefault();
      addStickerAt(draggingFromTray.current, e.clientX, e.clientY);
      draggingFromTray.current = null;
    },
    [addStickerAt]
  );

  const onBoardDragOver = useCallback((e) => {
    if (draggingFromTray.current) e.preventDefault();
  }, []);

  const onTrayTouchStart = useCallback((e, sticker) => {
    e.preventDefault();
    e.stopPropagation();

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
    e.stopPropagation();

    const t = e.touches[0];
    touchGhost.current.style.left = `${t.clientX - 28}px`;
    touchGhost.current.style.top = `${t.clientY - 28}px`;
  }, []);

  const onTrayTouchEnd = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const sticker = touchSticker.current;
      const ghost = touchGhost.current;

      if (ghost) document.body.removeChild(ghost);

      touchGhost.current = null;
      touchSticker.current = null;

      if (!sticker || !boardRef.current) return;

      const t = e.changedTouches[0];
      const rect = boardRef.current.getBoundingClientRect();

      const inside =
        t.clientX >= rect.left &&
        t.clientX <= rect.right &&
        t.clientY >= rect.top &&
        t.clientY <= rect.bottom;

      if (inside) {
        addStickerAt(sticker, t.clientX, t.clientY);
      }
    },
    [addStickerAt, boardRef]
  );

  const onPlacedPointerDown = useCallback((e, uid) => {
    if (e.target.classList.contains('sticker-value')) return;
    if (e.target.closest('.placed-sticker__delete')) return;

    e.preventDefault();
    e.stopPropagation();

    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();

    draggingPlaced.current = {
      uid,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
  }, []);

  const onBoardPointerMove = useCallback(
    (e) => {
      const dragging = draggingPlaced.current;
      if (!dragging || !boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();

      updatePlaced((prev) =>
        prev.map((p) =>
          p.uid === dragging.uid
            ? {
                ...p,
                x: Math.max(0, e.clientX - rect.left - dragging.offsetX),
                y: Math.max(0, e.clientY - rect.top - dragging.offsetY),
              }
            : p
        )
      );
    },
    [boardRef, updatePlaced]
  );

  const onBoardPointerUp = useCallback(() => {
    draggingPlaced.current = null;
  }, []);

  return {
    onTrayDragStart,
    onBoardDrop,
    onBoardDragOver,
    onTrayTouchStart,
    onTrayTouchMove,
    onTrayTouchEnd,
    onPlacedPointerDown,
    onBoardPointerMove,
    onBoardPointerUp,
  };
}