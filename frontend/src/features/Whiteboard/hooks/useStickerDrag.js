import { useCallback, useRef } from 'react';

export default function useStickerDrag({ boardRef, updatePlaced }) {
  const draggingFromTray = useRef(null);
  const draggingPlaced = useRef(null);
  const isDraggingNative = useRef(false);
  const pointerGhost = useRef(null);

  const MIN_DISTANCE_X = 45;
  const MIN_DISTANCE_Y = 75;

  const isTooClose = (a, b) => {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx < MIN_DISTANCE_X && dy < MIN_DISTANCE_Y;
  };

  const findFreePosition = (desired, existing) => {
    const candidates = [
      desired,
      { x: desired.x + MIN_DISTANCE_X, y: desired.y },
      { x: desired.x - MIN_DISTANCE_X, y: desired.y },
      { x: desired.x, y: desired.y + MIN_DISTANCE_Y },
      { x: desired.x, y: desired.y - MIN_DISTANCE_Y },
      { x: desired.x + MIN_DISTANCE_X, y: desired.y + MIN_DISTANCE_Y },
      { x: desired.x - MIN_DISTANCE_X, y: desired.y + MIN_DISTANCE_Y },
      { x: desired.x + MIN_DISTANCE_X, y: desired.y - MIN_DISTANCE_Y },
      { x: desired.x - MIN_DISTANCE_X, y: desired.y - MIN_DISTANCE_Y },
    ];
    return candidates.find((candidate) =>
      existing.every((item) => !isTooClose(candidate, item))
    ) ?? desired;
  };

  const addStickerAt = useCallback(
    (sticker, clientX, clientY) => {
      if (!sticker || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      updatePlaced((prev) => {
        const desired = {
          x: Math.max(0, clientX - rect.left - 28),
          y: Math.max(0, clientY - rect.top - 28),
        };
        const free = findFreePosition(desired, prev);
        return [
          ...prev,
          {
            ...sticker,
            uid: `${Date.now()}-${Math.random()}`,
            value: sticker.defaultValue ?? 1,
            x: free.x,
            y: free.y,
          },
        ];
      });
    },
    [boardRef, updatePlaced]
  );

  // ── Native drag (mouse / iPad mouse) ──────────────────────────────────────
  const onTrayDragStart = useCallback((e, sticker) => {
    isDraggingNative.current = true;
    draggingFromTray.current = sticker;
    e.dataTransfer.effectAllowed = 'copy';

    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-999px;opacity:0;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, []);

  const onTrayDragEnd = useCallback(() => {
    isDraggingNative.current = false;
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

  // ── Pointer drag (touch / stylus / Playwright iPhone emulation) ───────────
  const onTrayPointerDown = useCallback((e, sticker) => {
    // Let native drag handle mouse; pointer system handles touch + stylus
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingFromTray.current = sticker;

    const ghost = document.createElement('div');
    ghost.className = 'sticker-ghost';
    ghost.textContent = sticker.emoji;
    ghost.style.left = `${e.clientX - 28}px`;
    ghost.style.top = `${e.clientY - 28}px`;
    document.body.appendChild(ghost);
    pointerGhost.current = ghost;
  }, []);

  const onTrayPointerMove = useCallback((e) => {
    if (isDraggingNative.current || !pointerGhost.current) return;
    pointerGhost.current.style.left = `${e.clientX - 28}px`;
    pointerGhost.current.style.top = `${e.clientY - 28}px`;
  }, []);

  const onTrayPointerUp = useCallback(
    (e) => {
      if (isDraggingNative.current) return;

      const sticker = draggingFromTray.current;
      const ghost = pointerGhost.current;

      if (ghost) document.body.removeChild(ghost);
      pointerGhost.current = null;
      draggingFromTray.current = null;

      if (!sticker || !boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (inside) addStickerAt(sticker, e.clientX, e.clientY);
    },
    [addStickerAt, boardRef]
  );

  // ── Already-placed sticker drag ───────────────────────────────────────────
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
        prev.map((p) => {
          if (p.uid !== dragging.uid) return p;
          const desired = {
            x: Math.max(0, e.clientX - rect.left - dragging.offsetX),
            y: Math.max(0, e.clientY - rect.top - dragging.offsetY),
          };
          const others = prev.filter((item) => item.uid !== dragging.uid);
          const free = findFreePosition(desired, others);
          return { ...p, x: free.x, y: free.y };
        })
      );
    },
    [boardRef, updatePlaced]
  );

  const onBoardPointerUp = useCallback(() => {
    draggingPlaced.current = null;
  }, []);

  return {
    onTrayDragStart,
    onTrayDragEnd,
    onBoardDrop,
    onBoardDragOver,
    onTrayPointerDown,
    onTrayPointerMove,
    onTrayPointerUp,
    onPlacedPointerDown,
    onBoardPointerMove,
    onBoardPointerUp,
  };
}