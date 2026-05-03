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
    <div className="problem-selector">
      <div className="problem-selector__row">
        <BackButton onBack={onBack} />

        <SwitchButton
          selected={selectedProblem}
          onSelect={onSelectProblem}
          options={problems.map((num) => ({
            key: num,
            label: `${num}`,
            color: 'blue'
          }))}
        />

        <div className="problem-selector__spacer" />
      </div>
    </div>
  );
}