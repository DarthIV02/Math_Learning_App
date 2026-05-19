import './InputAnswer.css';
import SurfaceCard from '../SurfaceCard/SurfaceCard';

export default function InputAnswer({
  items = [],
  answers,
  setAnswers,
  onCheck,
  readOnly = false,
}) {
  const handleChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClear = () => {
    const clearedAnswers = {};

    items.forEach((item) => {
      clearedAnswers[item.key] = '';
    });

    setAnswers(clearedAnswers);
  };

  return (
    <SurfaceCard className="answer-input">
      <div className="answer-input__list">
        {items.map((item) => (
          <label key={item.key} className="answer-input__row">
            <span className="answer-input__label">{item.label}</span>

            {item.type === 'boolean' ? (
              <select
                value={answers[item.key] ?? ''}
                onChange={(e) => handleChange(item.key, e.target.value)}
                className={`
                  answer-input__field
                  ${readOnly ? 'answer-input__field--solved' : ''}
                `}
                disabled={readOnly}
              >
                <option value="">--</option>
                <option value="Ja">Ja</option>
                <option value="Nein">Nein</option>
              </select>
            ) : (
              <input
                type="number"
                value={answers[item.key] ?? ''}
                onChange={(e) => handleChange(item.key, e.target.value)}
                placeholder={item.placeholder ?? '0'}
                className={`
                  answer-input__field
                  ${readOnly ? 'answer-input__field--solved' : ''}
                `}
                readOnly={readOnly}
                disabled={readOnly}
              />
            )}
          </label>
        ))}
      </div>

      <div className="answer-input__actions">
        <button
          type="button"
          onClick={onCheck}
          className="answer-input__button answer-input__button--submit"
        >
          Antwort prüfen
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="answer-input__button answer-input__button--clear"
        >
          Löschen
        </button>
      </div>
    </SurfaceCard>
  );
}