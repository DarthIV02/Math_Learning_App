import { useEffect, useRef, useState } from 'react';

export default function useWhiteboard() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [ctx, setCtx] = useState(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 5;
      context.strokeStyle = '#2563eb';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setCtx(context);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPointerPosition = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    if (!ctx) return;

    isDrawingRef.current = true;
    const { x, y } = getPointerPosition(event);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event) => {
    if (!isDrawingRef.current || !ctx) return;

    if (!hasDrawn) {
      setHasDrawn(true);
    }

    const { x, y } = getPointerPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;

    isDrawingRef.current = false;
    ctx.closePath();
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  return {
    canvasRef,
    hasDrawn,
    startDrawing,
    draw,
    stopDrawing,
    clearBoard,
  };
}