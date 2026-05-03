import useEmojiColor from '../hooks/useEmojiColor';

/**
 * ColoredEmoji
 *
 * Renders an emoji, optionally recolored via canvas pixel manipulation.
 * Falls back to a plain <span> when no color is given (zero overhead).
 *
 * Props:
 *   emoji   — emoji string
 *   color   — optional CSS color string e.g. '#e63946', 'crimson', 'rgb(0,200,100)'
 *   size    — canvas size in px (default 40)
 *   className — forwarded to the canvas/span
 */
export default function ColoredEmoji({ emoji, color, size = 40, className = '' }) {
  const canvasRef = useEmojiColor(emoji, color, size);

  if (!color) {
    return (
      <span className={className} style={{ fontSize: size * 0.75, lineHeight: 1 }}>
        {emoji}
      </span>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, display: 'block' }}
      aria-label={emoji}
    />
  );
}