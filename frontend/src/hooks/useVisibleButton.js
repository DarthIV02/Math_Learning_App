import {
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export function useVisibleButtons({
  enabled,
  itemCount,
  reservedWidth = 0,
  gap = 12,
}) {
  const containerRef = useRef(null);

  const [visibleCount, setVisibleCount] =
    useState(itemCount);

  useLayoutEffect(() => {
    if (!enabled) {
      setVisibleCount(itemCount);
      return;
    }

    const calculate = () => {
      const el = containerRef.current;

      if (!el) return;

      const width = el.offsetWidth;

      /*
        measure first real button
      */
      const firstButton =
        el.querySelector('.difficulty-button');

      if (!firstButton) return;

      const buttonWidth =
        firstButton.offsetWidth;

      let fit = Math.floor(
        (width - reservedWidth) /
        (buttonWidth + gap)
      );

      fit = Math.max(1, fit);
      fit = Math.min(itemCount, fit);

      console.log({
        width,
        buttonWidth,
        fit,
      });

      setVisibleCount(fit);
    };

    calculate();

    const observer =
      new ResizeObserver(calculate);

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [
    enabled,
    itemCount,
    reservedWidth,
    gap,
  ]);

  return {
    containerRef,
    visibleCount,
  };
}