import './SwitchButton.css';

export default function SwitchButton({ selected, onSelect, options }) {
  return (
    <div className="difficulty-buttons">
      {options.map(({ key, label, icon, color }) => (
        <button
          key={key}
          type="button"
          className={[
            'difficulty-button',
            `difficulty-button--${color}`,
            selected === key ? 'difficulty-button--selected' : '',
          ].join(' ')}
          onPointerDown={(e) => {
            e.preventDefault(); // prevents ghost click
            onSelect(key);
          }}
        >
          {icon && (
            <span className="difficulty-button__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="difficulty-button__label">{label}</span>
        </button>
      ))}
    </div>
  );
}