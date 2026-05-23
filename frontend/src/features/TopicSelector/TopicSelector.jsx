import './TopicSelector.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';
import DifficultyButton from '../../components/Buttons/SwitchButton';
import TaskButton from '../../components/Buttons/TaskButton';
import { useDifficulty } from '../../context/DifficultyContext';

import distance from '../../assets/images/distances.png';
import money from '../../assets/images/money.png';
import weights from '../../assets/images/weights.png';

// Match IDs from your DB seed:
const OPERATION_TOPICS = [
  { variant: 'math-addition',       icon: '➕', title: 'Addition',       subtitle: 'Zusammenzählen', formula: '24 + 17 = ?', operation_id: 1 },
  { variant: 'math-subtraction',    icon: '➖', title: 'Subtraktion',    subtitle: 'Wegnehmen',      formula: '42 – 15 = ?', operation_id: 2 },
  { variant: 'math-multiplication', icon: '✖️', title: 'Multiplikation', subtitle: 'Malnehmen',      formula: '6 × 7 = ?',   operation_id: 3 },
  { variant: 'math-division',       icon: '➗', title: 'Division',       subtitle: 'Aufteilen',      formula: '36 : 4 = ?',  operation_id: 4 },
];

const THEME_TOPICS = [
  { title: 'Geld',     subtitle: 'Rechne mit Münzen und Scheinen',  mascotImg: money,    mascotAlt: 'Münzen und Scheine',  theme_id: 1 },
  { title: 'Gewichte', subtitle: 'Rechne mit Gewichten und Massen', mascotImg: weights,  mascotAlt: 'Waage mit Gewichten', theme_id: 2 },
  { title: 'Längen',   subtitle: 'Rechne mit Längen und Abständen', mascotImg: distance, mascotAlt: 'Lineal und Maßband',  theme_id: 3 },
];

const DIFFICULTIES = [
  { key: 'leicht', label: 'Leicht', icon: '⭐',     color: 'green'  },
  { key: 'mittel', label: 'Mittel', icon: '⭐⭐',   color: 'yellow' },
  { key: 'schwer', label: 'Schwer', icon: '⭐⭐⭐', color: 'red'    },
];

const DIFFICULTIES_SHORT = [
  { key: 'leicht', icon: '⭐',     color: 'green'  },
  { key: 'mittel', icon: '⭐⭐',   color: 'yellow' },
  { key: 'schwer', icon: '⭐⭐⭐', color: 'red'    },
];

// Map the difficulty key your context uses to the numeric DB value
const DIFFICULTY_MAP = { leicht: 1, mittel: 2, schwer: 3 };

export default function TopicSelector({ onSelect, disabled }) {
  const { selected, setSelected } = useDifficulty();

  const handleSelect = (filter) => {
    if (disabled) return;

    const payload = {
      ...filter,
      difficulty: DIFFICULTY_MAP[selected] ?? undefined,
    };

    onSelect?.(payload);
  };

  return (
    <SurfaceCard className="topic-selector-card">
      <div className="topic-selector">

        <div className="topic-selector__difficulty">
          <DifficultyButton
            selected={selected}
            onSelect={setSelected}
            options={DIFFICULTIES}
            shorten_option="Short"
            options_short={DIFFICULTIES_SHORT}
            change_when={600}
          />
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
            {OPERATION_TOPICS.map(({ operation_id, ...props }) => (
              <TaskButton
                key={operation_id}
                {...props}
                disabled={disabled}
                onClick={() => handleSelect({ operation_id })}
              />
            ))}
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
            {THEME_TOPICS.map(({ theme_id, ...props }) => (
              <TaskButton
                key={theme_id}
                variant="theme"
                {...props}
                disabled={disabled}
                onClick={() => handleSelect({ theme_id })}
              />
            ))}
          </div>
        </div>

        {/* Random button */}
        <div className="topic-selector__random-divider">
          <span className="topic-selector__random-divider-line" />
          <span className="topic-selector__random-divider-label">oder einfach loslegen</span>
          <span className="topic-selector__random-divider-line" />
        </div>

        <div className="topic-selector__random">
          <TaskButton
            key={"random"}
            variant="random"
            disabled={disabled}
            onClick={() => handleSelect({})}
          />
        </div>

      </div>
    </SurfaceCard>
  );
}