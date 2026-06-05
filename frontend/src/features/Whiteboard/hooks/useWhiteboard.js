import { useEffect, useRef, useState } from 'react';

export default function useWhiteboard() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const didStrokeRef = useRef(false);
  const [ctx, setCtx] = useState(null);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', {
      willReadFrequently: true,
    });
    if (!context) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 5;
      context.strokeStyle = '#2563eb';

      redrawStrokes(context, canvas);
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

    if (event.touches?.length > 0) {
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

    const canvas = canvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = true;
    didStrokeRef.current = false;

    const { x, y } = getPointerPosition(event);

    currentStrokeRef.current = {
      color: '#2563eb',
      width: 5,
      points: [
        {
          x: x,
          y: y,
        },
      ],
    };

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event) => {
    if (!isDrawingRef.current || !ctx) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    didStrokeRef.current = true;

    const { x, y } = getPointerPosition(event);

    currentStrokeRef.current?.points.push({
      x: x,
      y: y,
    });

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return false;

    if (!isDrawingRef.current) {
      return false;
    }

    isDrawingRef.current = false;
    ctx.closePath();

    if (didStrokeRef.current && currentStrokeRef.current) {
      strokesRef.current.push(currentStrokeRef.current);
    }

    currentStrokeRef.current = null;

    return didStrokeRef.current;
  };

  const getStrokes = () => strokesRef.current;

  const redrawStrokes = (context, canvas) => {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    strokesRef.current.forEach((stroke) => {
      const points = stroke.points;
      if (!points.length) return;

      context.beginPath();
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = stroke.width;
      context.strokeStyle = stroke.color;

      context.moveTo(
        points[0].x,
        points[0].y
      );

      points.slice(1).forEach((point) => {
        context.lineTo(
          point.x,
          point.y
        );
      });

      context.stroke();
      context.closePath();
    });
  };

  const setStrokes = (strokes = []) => {
    strokesRef.current = strokes;

    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    redrawStrokes(ctx, canvas);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    isDrawingRef.current = false;
    didStrokeRef.current = false;

    strokesRef.current = [];
  };

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearBoard,
    getStrokes,
    setStrokes,
  };
}