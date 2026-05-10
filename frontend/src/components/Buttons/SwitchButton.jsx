import './SwitchButton.css';

/*
  Hooks
  ─────────────────────────────────────────────
  useIsSmallScreen:
    Detects whether the viewport width is below
    a given breakpoint.

  useVisibleButtons:
    Calculates how many buttons can fit inside
    the available horizontal space.

  usePaginatedOptions:
    Splits the button list into "pages" when
    there is not enough room to show all buttons.
*/
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import { useVisibleButtons } from '../../hooks/useVisibleButton';
import { usePaginatedOptions } from '../../hooks/usePaginatedOptions';

/*
  Basic button renderer
  Responsible only for rendering one button.
*/
import { SwitchButtonBasic } from './SwitchButtonBasic';

/*
  SwitchButton
  ─────────────────────────────────────────────
  Responsive button selector component.

  Features:
    • Full labels on large screens
    • Optional short labels on small screens
    • Overflow pagination on narrow screens
    • Dynamic button fitting based on width
*/
export default function SwitchButton({
  selected,
  onSelect,

  // Full option list
  // Example:
  // [{ key:'easy', label:'Easy', color:'green' }]
  options,

  // Shortened version of options
  // Used on small screens if shorten_option !== 'Next'
  options_short = [],

  /*
    Behavior on small screens:

    "Next"
      → overflow buttons become paginated
        using ← and → buttons.

    any other value
      → use shortened labels instead.
  */
  shorten_option = 'Next',

  // Breakpoint for switching into "small screen" mode
  change_when = 900,

  /*
    Width reserved for navigation buttons
    (← and →) when pagination is enabled.
  */
  reservedWidth = 80,

  // Gap between buttons in px
  gap = 12,
}) {

  /*
    Detect whether viewport is considered small.
  */
  const isSmall = useIsSmallScreen(change_when);

  /*
    Determine whether shortened labels should be used.

    Conditions:
      • small screen
      • NOT using overflow pagination mode
      • short options array matches original length
  */
  const useShortLabels =
    isSmall &&
    shorten_option !== 'Next' &&
    options_short.length === options.length;

  /*
    Active options currently rendered.

    Either:
      • full labels
      • shortened labels
  */
  const activeOptions = useShortLabels
    ? options_short
    : options;

  /*
    Enable overflow pagination mode.

    In this mode:
      • only a subset of buttons is shown
      • navigation arrows are displayed
  */
  const useOverflow =
    isSmall &&
    shorten_option === 'Next';

  /*
    Calculate how many buttons fit in the container.

    containerRef:
      attached to the outer wrapper so the hook
      can measure available width.

    visibleCount:
      number of buttons that currently fit.
  */
  const { containerRef, visibleCount } =
    useVisibleButtons({
      enabled: useOverflow,
      itemCount: activeOptions.length,
      reservedWidth: reservedWidth,
      gap: gap,
    });

  /*
    Pagination logic.

    visible:
      buttons shown on the current "page"

    hasNext / hasPrev:
      whether navigation arrows should appear

    nextPage / prevPage:
      page navigation callbacks
  */
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
    /*
      Container measured by useVisibleButtons.
    */
    <div ref={containerRef} className="difficulty-buttons">

      {/* Previous page button */}
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

      {/* Visible buttons for current page */}
      {visible.map((option) => (
        <SwitchButtonBasic
          key={option.key}
          option={option}
          selected={selected}
          onSelect={onSelect}
        />
      ))}

      {/* Next page button */}
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