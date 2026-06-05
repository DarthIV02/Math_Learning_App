import { useState, useCallback } from 'react';
import './styles/SelectTopicPage.css';
import { DifficultyProvider } from '../context/DifficultyContext';

import BackgroundLayer from '../components/Background/BackgroundLayer';
import BottomNav from '../components/BottomNav/BottomNav';
import SurfaceCard from '../components/SurfaceCard/SurfaceCard';
import StatBubble from '../features/StatBubble/StatBubble';
import TopicSelector from '../features/TopicSelector/TopicSelector';
import hedgehog from '../assets/images/hedgehog_v2.png';

function ErrorToast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-toast" role="alert">
      <span>{message}</span>
      <button className="error-toast__close" onClick={onDismiss} aria-label="Schließen">✕</button>
    </div>
  );
}

export default function SelectTopicPage({ onNavigate, user, onTopicSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTopicSelect = useCallback(async (filter) => {
    setError(null);
    setLoading(true);

    try {
      await onTopicSelect(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onTopicSelect]);

  return (
    <DifficultyProvider>
      <div className="select-topic-page">
        <BackgroundLayer />
        <ErrorToast message={error} onDismiss={() => setError(null)} />

        <div className="select-topic-page__content">
          <header className="select-topic__toprow">
            <SurfaceCard className="diff-header" soft={true}>
              <img src={hedgehog} className="diff-header__img" alt="Hedgehog" />
              <div className="diff-header__label">
                <strong>Schwierigkeitsgrad wählen</strong>
                <span>Du kannst ihn jederzeit ändern!</span>
              </div>
            </SurfaceCard>
            <StatBubble coins={6} user={user} />
          </header>

          <main className="select-topic-page__main">
            <TopicSelector onSelect={handleTopicSelect} disabled={loading} />
          </main>
        </div>

        <BottomNav onNavigate={onNavigate} activePage="select-topic" />
        
      </div>
    </DifficultyProvider>
  );
}