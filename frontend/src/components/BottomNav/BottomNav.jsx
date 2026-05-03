import './BottomNav.css';

export default function BottomNav({ onNavigate, activePage }) {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      <button
        type="button"
        className={`bottom-nav__item ${activePage === 'home' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <span className="bottom-nav__icon" aria-hidden="true">🏠</span>
        <span className="bottom-nav__label">Start</span>
      </button>

      <div className="bottom-nav__divider" aria-hidden="true" />

      <button 
        type="button" 
        className={`bottom-nav__item ${activePage === 'select-topic' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onNavigate('select-topic')}
      >
        <span className="bottom-nav__icon" aria-hidden="true">✏️</span>
        <span className="bottom-nav__label">Üben</span>
      </button>

      <div className="bottom-nav__divider" aria-hidden="true" />

      <button
        type="button"
        className={`bottom-nav__item ${activePage === 'profile' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <span className="bottom-nav__icon" aria-hidden="true">👦</span>
        <span className="bottom-nav__label">Profil</span>
      </button>
    </nav>
  );
}