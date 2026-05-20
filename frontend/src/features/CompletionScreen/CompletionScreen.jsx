import './CompletionScreen.css';

import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';
import BackgroundLayer from '../../components/Background/BackgroundLayer';
import PlayfulButton from '../../components/Buttons/PlayfulButton';

export default function CompletionScreen({
  topicName = 'Mathe',
  coinsWon = 20,
  solvedCount = 0,
  onChooseTopic,
  onPlayAgain,
}) {
  return (
    <main className="completion-screen">
      <BackgroundLayer />

      <div className="completion-screen__content">
        <SurfaceCard className="completion-card">
          <div className="completion-card__trophy completion-card__trophy--animated">
            🏆
          </div>

          <h1 className="completion-card__title">Super gemacht!</h1>

          <p className="completion-card__subtitle">
            Du hast alle Aufgaben geschafft 🎉
          </p>

          <div className="completion-card__stats">
            <div className="completion-stat completion-stat--coins">
              <div className="completion-stat__icon">🪙</div>
              <p className="completion-stat__label">Münzen gewonnen</p>
              <p className="completion-stat__value">+{coinsWon}</p>
            </div>

            <div className="completion-stat completion-stat--solved">
              <div className="completion-stat__icon">⭐</div>
              <p className="completion-stat__label">Aufgaben gelöst</p>
              <p className="completion-stat__value">{solvedCount}</p>
            </div>
          </div>

          <div className="completion-card__message">
            Du bist ein Mathe-Profi! 🚀
          </div>

          <div className="completion-card__actions">
            <PlayfulButton
              onClick={onChooseTopic}
              className="completion-button completion-button--primary"
              color="green"
              label="Neues Thema"
            ></PlayfulButton>

            <PlayfulButton
              onClick={onPlayAgain}
              className="completion-button completion-button--secondary"
              color="blue"
              label="Nochmal spielen"
              icon="🔄"
            >
            </PlayfulButton>
          </div>
        </SurfaceCard>
      </div>
    </main>
  );
}