import ColoredEmoji from './ColoredEmoji';

/**
 * StickerTray
 *
 * Vertical strip docked to the left of the whiteboard.
 *
 * Props:
 *   stickers — array of { id, emoji, label, defaultValue?, color? }
 *              color is any CSS color string e.g. '#e63946'
 *   onTrayDragStart / onTrayTouchStart / onTrayTouchMove / onTrayTouchEnd
 */
export default function StickerTray({
  stickers,
  onTrayDragStart,
  onTrayTouchStart,
  onTrayTouchMove,
  onTrayTouchEnd,
}) {
  if (!stickers.length) return null;

  return (
    <aside className="sticker-tray">
      <div className="sticker-tray__items">
        {stickers.map((s) => (
          <div
            key={s.id}
            className="tray-sticker"
            draggable
            onDragStart={(e) => onTrayDragStart(e, s)}
            onTouchStart={(e) => onTrayTouchStart(e, s)}
            onTouchMove={onTrayTouchMove}
            onTouchEnd={onTrayTouchEnd}
            title={s.label}
            /* Color dot on the border so the color is obvious even at small size */
            style={s.color ? { borderColor: s.color, boxShadow: `0 2px 0 ${s.color}` } : undefined}
          >
            <ColoredEmoji emoji={s.emoji} color={s.color} size={44} />
            <span className="tray-sticker__label">{s.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}