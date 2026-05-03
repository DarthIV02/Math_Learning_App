import './PlayfulButton.css';

export default function PlayfulButton({ 
  label, 
  icon, 
  color = 'blue', 
  size = 'md',
  onClick, 
  type = 'button' 
}) {
  return (
    <button
      type={type}
      className={`playful-btn playful-btn--${color} playful-btn--${size}`}
      onClick={onClick}
    >
      {icon && (
        <span className="playful-btn__icon" aria-hidden="true">{icon}</span>
      )}
      <span className="playful-btn__label">{label}</span>
    </button>
  );
}