// one button, no logic
import './SwitchButton.css';

export function SwitchButtonBasic({ option, selected, onSelect }) {
  const { key, label, icon, color } = option;
  return (
    <button
      type="button"
      className={[
        'difficulty-button',
        `difficulty-button--${color}`,
        selected === key ? 'difficulty-button--selected' : '',
      ].join(' ')}
      onPointerDown={(e) => { e.preventDefault(); onSelect(key); }}
    >
      {icon && <span className="difficulty-button__icon" aria-hidden="true">{icon}</span>}
      {label && <span className="difficulty-button__label">{label}</span>}
    </button>
  );
}