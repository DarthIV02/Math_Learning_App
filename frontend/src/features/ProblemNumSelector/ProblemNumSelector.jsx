import './ProblemNumSelector.css';
import BackButton from '../../components/Buttons/BackButton';
import SwitchButton from '../../components/Buttons/SwitchButton';

export default function ProblemSelector({
  selectedProblem = 1,
  onSelectProblem,
  onBack,
  totalProblems = 10,
}) {
  const problems = Array.from({ length: totalProblems }, (_, i) => i + 1);

  return (
    <div className="problem-selector-wrapper">
      {onBack && <BackButton onBack={onBack} />}

      <div className="problem-selector">
        <SwitchButton
          selected={selectedProblem}
          onSelect={onSelectProblem}
          change_when={1000}
          options={problems.map((num) => ({
            key: num,
            label: `${num}`,
            color: 'blue',
          }))}
          gap={5}
          reservedWidth={70}
        />
      </div>
    </div>
  );
}