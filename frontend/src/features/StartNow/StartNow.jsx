import './StartNow.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard.jsx';
import PlayfulButton from '../../components/Buttons/PlayfulButton';

export default function StartNow({ onNavigate }) {
  const completedTasks = 2;
  const totalTasks = 3;
  const progressPercent = (completedTasks / totalTasks) * 100;

  return (
    <SurfaceCard className="start-now">
      <h2 className="start-now__title">Genau richtig für dich!</h2>

      <div className="start-now__topic-row">
        <span className="start-now__goal-label" aria-hidden="true">📘</span>
        <div className="start-now__topic-text">
          <span className="start-now__topic-main">Division</span>
          <span className="start-now__topic-level">(⭐☆☆)</span>
        </div>
      </div>

      <div className="start-now__goal">
        <span className="start-now__goal-label">🎯 Tagesziel</span>
        <div
          className="start-now__goal-bar"
          role="progressbar"
          aria-valuenow={completedTasks}
          aria-valuemin="0"
          aria-valuemax={totalTasks}
        >
          <div
            className="start-now__goal-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="start-now__goal-text">Nur noch 1 Aufgabe bis zum Ziel!</p>
      </div>

      <PlayfulButton 
        label="Weiter machen!" 
        icon="🚀" 
        color="green" 
        size="md" 
        onClick={() => onNavigate('solve-problems')} 
      />
      
    </SurfaceCard>
  );
}