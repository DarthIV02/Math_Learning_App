import { useEffect, useState, useCallback } from 'react';
import { useTutorial } from '../../context/TutorialContext';
import './TutorialOverlay.css';

function getRect(target) {
  const el = document.querySelector(`[data-tutorial="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const PAD = 10;
  return {
    top:    r.top    - PAD,
    left:   r.left   - PAD,
    width:  r.width  + PAD * 2,
    height: r.height + PAD * 2,
    bottom: r.bottom + PAD,
    right:  r.right  + PAD,
    centerX: r.left + r.width / 2,
  };
}

export default function TutorialOverlay() {
  const { isActive, currentStep, stepIndex, total, next, skip } = useTutorial();
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    if (!currentStep) return;

    let tries = 0;

    const attempt = () => {
      const el = document.querySelector(
        `[data-tutorial="${currentStep.target}"]`
      );

      if (!el) {
        if (tries++ < 10) {
          setTimeout(attempt, 120);
        }
        return;
      }

      // Smooth auto-scroll
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      // Wait for scroll animation before measuring
      setTimeout(() => {
        const r = getRect(currentStep.target);

        if (r) {
          setRect(r);
        }
      }, 350);
    };

    attempt();
  }, [currentStep]);

  useEffect(() => {
    setRect(null);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  if (!isActive || !currentStep) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Clip-path punches a rounded rectangle hole in the overlay
  const clipPath = rect
    ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${rect.left}px ${rect.top}px,
        ${rect.left}px ${rect.bottom}px,
        ${rect.right}px ${rect.bottom}px,
        ${rect.right}px ${rect.top}px,
        ${rect.left}px ${rect.top}px
      )`
    : undefined;

  // Tooltip position
  let tooltipStyle = {};

  if (rect) {
    const TOOLTIP_W = 280;
    const TOOLTIP_H = 210;
    const GAP = 14;
    const MARGIN = 12;

    const placement = currentStep.placement ?? 'auto';

    let left = rect.centerX - TOOLTIP_W / 2;
    left = Math.min(
      Math.max(left, MARGIN),
      vw - TOOLTIP_W - MARGIN
    );

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    const placeBottom = () => ({
      top: Math.min(
        rect.bottom + GAP,
        vh - TOOLTIP_H - MARGIN
      ),
      left,
    });

    const placeTop = () => ({
      top: Math.max(
        MARGIN,
        rect.top - TOOLTIP_H - GAP
      ),
      left,
    });

    const placeRight = () => ({
      top: Math.min(
        Math.max(rect.top, MARGIN),
        vh - TOOLTIP_H - MARGIN
      ),
      left: Math.min(
        rect.right + GAP,
        vw - TOOLTIP_W - MARGIN
      ),
    });

    if (placement === 'bottom') {
      tooltipStyle = placeBottom();
    } else if (placement === 'top') {
      tooltipStyle = placeTop();
    } else if (placement === 'right') {
      tooltipStyle = placeRight();
    } else {
      // auto
      if (spaceBelow >= TOOLTIP_H + GAP) {
        tooltipStyle = {
          top: rect.bottom + GAP,
          left,
        };
      } else if (spaceAbove >= TOOLTIP_H + GAP) {
        tooltipStyle = {
          top: rect.top - TOOLTIP_H - GAP,
          left,
        };
      } else {
        tooltipStyle = {
          top: Math.min(
            Math.max(MARGIN, rect.bottom + GAP),
            vh - TOOLTIP_H - MARGIN
          ),
          left,
        };
      }
    }
  }

  const progress = ((stepIndex + 1) / total) * 100;

  return (
    <div className="tutorial-overlay">
      {/* Dim layer with spotlight hole */}
      <div
        className="tutorial-overlay__dim"
        style={{ clipPath }}
        onClick={next}
      />

      {/* Tooltip */}
      {rect && (
        <div className="tutorial-overlay__tooltip" style={tooltipStyle}>
          {/* Progress bar */}
          <div className="tutorial-tooltip__progress-track">
            <div className="tutorial-tooltip__progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <p className="tutorial-tooltip__step">
            {stepIndex + 1} / {total}
          </p>
          <h3 className="tutorial-tooltip__title">{currentStep.title}</h3>
          <p className="tutorial-tooltip__text">{currentStep.text}</p>

          <div className="tutorial-tooltip__actions">
            <button className="tutorial-tooltip__skip" onClick={skip}>
              Überspringen
            </button>
            {!currentStep.waitForUserAction && (
              <button className="tutorial-tooltip__next" onClick={next}>
                {stepIndex === total - 1 ? 'Fertig! 🎉' : 'Weiter →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}