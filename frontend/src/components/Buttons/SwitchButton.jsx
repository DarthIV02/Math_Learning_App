import './SwitchButton.css';

import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import { useVisibleButtons } from '../../hooks/useVisibleButton';
import { usePaginatedOptions } from '../../hooks/usePaginatedOptions';

import { SwitchButtonBasic } from './SwitchButtonBasic';

export default function SwitchButton({
  selected,
  onSelect,
  options,
  options_short = [],
  shorten_option = 'Next',
  change_when = 900,
  reservedWidth = 80,
  gap = 12,
}) {
  const isSmall = useIsSmallScreen(change_when);

  const useShortLabels =
    isSmall &&
    shorten_option !== 'Next' &&
    options_short.length === options.length;

  const activeOptions = useShortLabels
    ? options_short
    : options;

  const useOverflow =
    isSmall &&
    shorten_option === 'Next';

  const { containerRef, visibleCount } =
    useVisibleButtons({
      enabled: useOverflow,
      itemCount: activeOptions.length,
      reservedWidth: reservedWidth,
      gap: gap,
    });

  const {
    visible,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
  } = usePaginatedOptions(
    activeOptions,
    visibleCount,
    useOverflow
  );

  return (
    <div ref={containerRef} className="difficulty-buttons">
      {hasPrev && (
        <button
          type="button"
          className="difficulty-button difficulty-button--blue"
          onClick={prevPage}
          aria-label="Previous options"
        >
          ←
        </button>
      )}

      {visible.map((option) => (
        <SwitchButtonBasic
          key={option.key}
          option={option}
          selected={selected}
          onSelect={onSelect}
        />
      ))}

      {hasNext && (
        <button
          type="button"
          className="difficulty-button difficulty-button--blue"
          onClick={nextPage}
          aria-label="Next options"
        >
          →
        </button>
      )}
    </div>
  );
}