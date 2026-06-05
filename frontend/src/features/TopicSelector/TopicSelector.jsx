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
  { variant: 'math-addition',       icon: '➕', title: 'Addition',       subtitle: 'Zusammenzählen', formula: '24 + 17 = ?', operation: 'addition' },
  { variant: 'math-subtraction',    icon: '➖', title: 'Subtraktion',    subtitle: 'Wegnehmen',      formula: '42 – 15 = ?', operation: 'subtraction' },
  { variant: 'math-multiplication', icon: '✖️', title: 'Multiplikation', subtitle: 'Malnehmen',      formula: '6 × 7 = ?',   operation: 'multiplication' },
  { variant: 'math-division',       icon: '➗', title: 'Division',       subtitle: 'Aufteilen',      formula: '36 : 4 = ?',  operation: 'division' },
];

const THEME_TOPICS = [
  { title: 'Geld',     subtitle: 'Rechne mit Münzen und Scheinen',  mascotImg: money,    mascotAlt: 'Münzen und Scheine',  theme: "geld" },
  { title: 'Gewichte', subtitle: 'Rechne mit Gewichten und Massen', mascotImg: weights,  mascotAlt: 'Waage mit Gewichten', theme: "gewichte" },
  { title: 'Längen',   subtitle: 'Rechne mit Längen und Abständen', mascotImg: distance, mascotAlt: 'Lineal und Maßband',  theme: "längen" },
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
const DIFFICULTY_MAP = { leicht: "easy", mittel: "medium", schwer: "hard"};

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

        <div className="topic-selector__difficulty" data-tutorial="difficulty-tabs">
          <DifficultyButton
            selected={selected}
            onSelect={setSelected}
            options={DIFFICULTIES}
            shorten_option="Short"
            options_short={DIFFICULTIES_SHORT}
            change_when={600}
          />
        </div>

        <div data-tutorial="topic-grid" className="topic-selector__sections">
          <div className="topic-selector__section">
            <div className="topic-selector__section-header">
              <span className="topic-selector__section-icon">🔢</span>
              <div>
                <h2 className="topic-selector__section-title">Rechenarten</h2>
                <p className="topic-selector__section-sub">Wähle eine Rechenoperation</p>
              </div>
            </div>
            <div className="topic-selector__math-grid">
              {OPERATION_TOPICS.map(({ operation, ...props }) => (
                <TaskButton
                  key={operation}
                  {...props}
                  disabled={disabled}
                  onClick={() => handleSelect({ operation })}
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
              {THEME_TOPICS.map(({ theme, ...props }) => (
                <TaskButton
                  key={theme}
                  variant="theme"
                  {...props}
                  disabled={disabled}
                  onClick={() => handleSelect({ theme })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Random button */}
        <div className="topic-selector__random-divider">
          <span className="topic-selector__random-divider-line" />
          <span className="topic-selector__random-divider-label">oder einfach loslegen</span>
          <span className="topic-selector__random-divider-line" />
        </div>

        <div className="topic-selector__random" data-tutorial="random-btn">
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