import { useEffect, useRef } from 'react';

/**
 * useEmojiColor
 *
 * Draws an emoji onto a canvas, then recolors every opaque pixel
 * to a target color while preserving the original luminosity.
 * If no color is provided the canvas is left as-is (natural emoji).
 *
 * @param {string} emoji   — the emoji character, e.g. '🍪'
 * @param {string} color   — CSS hex or rgb color, e.g. '#e63946'. Optional.
 * @param {number} size    — canvas size in px (default 64)
 * @returns React ref to attach to a <canvas> element
 */
export default function useEmojiColor(emoji, color, size = 64) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    // Draw the emoji at full size
    ctx.font = `${size * 0.85}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2);

    // If no color requested, we're done
    if (!color) return;

    // Parse target color into r, g, b (0-255)
    const target = parseColor(color);
    if (!target) return;

    // Read all pixels and recolor opaque ones
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 20) continue; // skip transparent / near-transparent

      // Compute luminosity of the original pixel (0-1)
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Blend target color with white based on luminosity
      // Light pixels → lighter tint of target; dark pixels → darker tint
      data[i]     = Math.round(target.r * lum + 255 * (1 - lum) * 0.3 + target.r * 0.7 * lum);
      data[i + 1] = Math.round(target.g * lum + 255 * (1 - lum) * 0.3 + target.g * 0.7 * lum);
      data[i + 2] = Math.round(target.b * lum + 255 * (1 - lum) * 0.3 + target.b * 0.7 * lum);

      // Clamp
      data[i]     = Math.min(255, Math.max(0, data[i]));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
    }

    ctx.putImageData(imageData, 0, 0);
  }, [emoji, color, size]);

  return canvasRef;
}

/* ── Parse any CSS color string into { r, g, b } ── */
function parseColor(color) {
  // Use a temporary canvas to let the browser parse any CSS color
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 1;
  const ctx = tmp.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}