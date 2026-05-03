import './BackButton.css';

export default function BackButton({ onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="back-button"
      aria-label="Zurück"
    >
      ← Zurück
    </button>
  );
}