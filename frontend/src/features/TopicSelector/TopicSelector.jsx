import './TopicSelector.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';
import DifficultyButton from '../../components/Buttons/SwitchButton';
import TaskButton from '../../components/Buttons/TaskButton';
import { useDifficulty } from '../../context/DifficultyContext';

import distance from '../../assets/images/distances.png';
import money from '../../assets/images/money.png';
import weights from '../../assets/images/weights.png';

export default function TopicSelector() {
  const { selected, setSelected } = useDifficulty();
  const DIFFICULTIES = [
    { key: 'leicht', label: 'Leicht', icon: '⭐', color: 'green' },
    { key: 'mittel', label: 'Mittel', icon: '⭐⭐', color: 'yellow' },
    { key: 'schwer', label: 'Schwer', icon: '⭐⭐⭐', color: 'red' },
  ];

  const DIFFICULTIES_SHORT = [
    { key: 'leicht', icon: '⭐', color: 'green' },
    { key: 'mittel', icon: '⭐⭐', color: 'yellow' },
    { key: 'schwer', icon: '⭐⭐⭐', color: 'red' },
  ];

  return (
    <SurfaceCard className="topic-selector-card">
      <div className="topic-selector">
        <div className="topic-selector__difficulty">
          <DifficultyButton selected={selected} onSelect={setSelected} options={DIFFICULTIES} shorten_option="Short" options_short={DIFFICULTIES_SHORT}
          change_when={600}/>
        </div>

        <div className="topic-selector__section">
          <div className="topic-selector__section-header">
            <span className="topic-selector__section-icon">🔢</span>
            <div>
              <h2 className="topic-selector__section-title">Rechenarten</h2>
              <p className="topic-selector__section-sub">Wähle eine Rechenoperation</p>
            </div>
          </div>
          <div className="topic-selector__math-grid">
            <TaskButton variant="math-addition"       icon="➕" title="Addition"        subtitle="Zusammenzählen" formula="24 + 17 = ?" />
            <TaskButton variant="math-subtraction"    icon="➖" title="Subtraktion"     subtitle="Wegnehmen"      formula="42 – 15 = ?" />
            <TaskButton variant="math-multiplication" icon="✖️" title="Multiplikation"  subtitle="Malnehmen"      formula="6 × 7 = ?"  />
            <TaskButton variant="math-division"       icon="➗" title="Division"        subtitle="Aufteilen"      formula="36 : 4 = ?" />
          </div>
        </div>

        <div className="topic-selector__section">
          <div className="topic-selector__section-header">
            <span className="topic-selector__section-icon">🌍</span>
            <div>
              <h2 className="topic-selector__section-title">Themen</h2>
              <p className="topic-selector__section-sub">Rechnen mit Alltagssituationen</p>
            </div>
          </div>
          <div className="topic-selector__theme-grid">
            <TaskButton variant="theme" title="Geld"     subtitle="Rechne mit Münzen und Scheinen"  mascotImg={money}    mascotAlt="Münzen und Scheine"  />
            <TaskButton variant="theme" title="Gewichte" subtitle="Rechne mit Gewichten und Massen" mascotImg={weights}  mascotAlt="Waage mit Gewichten" />
            <TaskButton variant="theme" title="Längen"   subtitle="Rechne mit Längen und Abständen" mascotImg={distance} mascotAlt="Lineal und Maßband"  />
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}