import './BackButton.css';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';

export default function BackButton({ onBack, change_when = 800, }) {

  const isSmall = useIsSmallScreen(change_when);

  return (
    <button
      type="button"
      onPointerUp={onBack}
      className="back-button"
      aria-label="Zurück"
    >
      🏠
      {!isSmall && ' Home'}
    </button>
  );
}