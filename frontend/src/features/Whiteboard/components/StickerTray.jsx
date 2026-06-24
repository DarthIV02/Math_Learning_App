import ColoredEmoji from './ColoredEmoji';

export default function StickerTray({
  stickers,
  onTrayDragStart,
  onTrayDragEnd,
  onTrayPointerDown,
  onTrayPointerMove,
  onTrayPointerUp,
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
            onDragEnd={onTrayDragEnd}
            onPointerDown={(e) => onTrayPointerDown(e, s)}
            onPointerMove={onTrayPointerMove}
            onPointerUp={onTrayPointerUp}
            title={s.label}
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