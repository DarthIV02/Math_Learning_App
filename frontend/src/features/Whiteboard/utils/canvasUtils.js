export function isCanvasBlank(canvas) {
  if (!canvas) return true;

  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const isWhite = r === 255 && g === 255 && b === 255 && a === 255;
    const isTransparent = a === 0;

    if (!isWhite && !isTransparent) {
      return false;
    }
  }

  return true;
}

export function restoreCanvasFromImage(canvas, imageUrl, onDone) {
  if (!canvas || !imageUrl) {
    onDone?.(false);
    return;
  }

  const img = new Image();

  img.onload = () => {
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    onDone?.(true);
  };

  img.src = imageUrl;
}

export function exportWhiteboardImage({ board, drawingCanvas, placed }) {
  if (!board || !drawingCanvas) return null;

  const rect = board.getBoundingClientRect();

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = Math.round(rect.width);
  exportCanvas.height = Math.round(rect.height);

  const ctx = exportCanvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  ctx.drawImage(drawingCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

  placed.forEach((p) => {
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(p.emoji ?? '📦', p.x + 28, p.y + 28);

    const bubbleX = p.x + 28;
    const bubbleY = p.y + 78;
    const bubbleW = 70;
    const bubbleH = 38;

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2bb7e8';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(
      bubbleX - bubbleW / 2,
      bubbleY - bubbleH / 2,
      bubbleW,
      bubbleH,
      18
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0369a1';
    ctx.fillText(String(p.value ?? 1), bubbleX, bubbleY);
  });

  return exportCanvas.toDataURL('image/png');
}