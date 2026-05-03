import { useState, useEffect, useCallback } from 'react';
import './TipBubble.css';

/**
 * TipBubble
 *
 * A playful speech-bubble overlay anchored near the Tips button.
 * Paginates through multiple tips with a ▼ arrow when there are more.
 *
 * Props:
 *   tips    — string[]  list of tip strings (one per "page")
 *   onClose — () => void
 */
export default function TipBubble({ tips = [], onClose }) {
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Reset to first page when tips change
  useEffect(() => setPage(0), [tips]);

  const hasNext = page < tips.length - 1;

  const handleNext = useCallback(() => {
    if (!hasNext || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setAnimating(false);
    }, 180);
  }, [hasNext, animating]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!tips.length) return null;

  return (
    <>
      {/* Dimmed backdrop — tap outside to close */}
      <div className="tip-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="tip-bubble" role="dialog" aria-modal="true" aria-label="Tipp">
        {/* Close button */}
        <button
          type="button"
          className="tip-close"
          onClick={onClose}
          aria-label="Tipp schließen"
        >
          ✕
        </button>

        {/* Mascot / icon */}
        <div className="tip-mascot" aria-hidden="true">💡</div>

        {/* Tip text */}
        <p className={`tip-text${animating ? ' tip-text--exit' : ''}`}>
          {tips[page]}
        </p>

        {/* Pagination dots */}
        {tips.length > 1 && (
          <div className="tip-dots" aria-label={`Tipp ${page + 1} von ${tips.length}`}>
            {tips.map((_, i) => (
              <span
                key={i}
                className={`tip-dot${i === page ? ' tip-dot--active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Next arrow — only when more tips exist */}
        {hasNext && (
          <button
            type="button"
            className="tip-next"
            onClick={handleNext}
            aria-label="Nächster Tipp"
          >
            <span className="tip-next__label">Weiter</span>
            <span className="tip-next__arrow">▼</span>
          </button>
        )}

        {/* Speech bubble tail (CSS triangle pointing up-left toward button) */}
        <div className="tip-tail" aria-hidden="true" />
      </div>
    </>
  );
}