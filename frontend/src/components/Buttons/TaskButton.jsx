import './TaskButton.css';

export default function TaskButton({
  variant = 'theme',
  icon,
  title,
  subtitle,
  formula,
  mascot,
  mascotImg,
  mascotAlt,
  onClick,
  className = '',
}) {
  const isMath = variant.startsWith('math');

  const renderMascot = (isTheme = false) => {
    const content = mascotImg
      ? <img src={mascotImg} alt={mascotAlt ?? title} className="task-btn__mascot-img" />
      : mascot ?? null;

    if (!content) return null;
    return (
      <div className={isTheme ? 'task-btn__mascot--theme' : ''}>
        {content}
      </div>
    );
  };

  return (
    <button className={`task-btn task-btn--${variant} ${className}`} onClick={onClick}>
      {isMath ? (
        <>
          <div className="task-btn__icon-circle">{icon}</div>
          <div className="task-btn__text-block">
            <p className="task-btn__title">{title}</p>
            {subtitle && <p className="task-btn__subtitle">{subtitle}</p>}
            {formula && <span className="task-btn__formula">{formula}</span>}
          </div>
        </>
      ) : (
        <>
          <p className="task-btn__title">{title}</p>
          {subtitle && <p className="task-btn__subtitle">{subtitle}</p>}
          {formula && <span className="task-btn__formula">{formula}</span>}
          {renderMascot(true)}
        </>
      )}
    </button>
  );
}