import './styles/SolveProblems.css';

import CompletionScreen from '../features/CompletionScreen/CompletionScreen';
import SolveProblemsLayout from '../features/SolveProblems/SolveProblemsLayout';
import EmptyProblemsScreen from '../features/SolveProblems/EmptyProblemScreen';

import { useSolveProblemsSession } from '../hooks/useSolveProblemsSession';

import {COINS_BY_DIFFICULTY} from '../lib/constants';

export default function SolveProblemPage({
  onNavigate,
  token,
  problems = [],
  difficulty,
  onPlayAgain,
  user,
  onCoinsEarned,
}) {

  const coinsPerProblem = COINS_BY_DIFFICULTY[difficulty] ?? 10;
  const session = useSolveProblemsSession({ problems, token, userId: user?.id, coinsPerProblem, onCoinsEarned });

  const handleBack = async () => {
    await session.flushQueue();
    session.resetSession();
    onNavigate('select-topic');
  };

  const handlePlayAgain = async () => {
    await session.flushQueue();
    session.resetSession();
    await onPlayAgain?.();
  };

  if (!problems.length) {
    return <EmptyProblemsScreen onChooseTopic={handleBack} />;
  }

  if (session.allProblemsSolved) {
    return (
      <CompletionScreen
        coinsWon={session.coinsWon}
        solvedCount={problems.length}
        onChooseTopic={handleBack}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <SolveProblemsLayout
      problem={session.problem}
      problemIndex={session.problemIndex}
      selectedProblem={session.selectedProblem}
      totalProblems={problems.length}
      answers={session.answers}
      answerItems={session.answerItems}
      stickers={session.stickers}
      tips={session.tips}
      isLoadingTip={session.isLoadingTip}
      feedback={session.feedback}
      solvedProblems={session.solvedProblems}
      whiteboardSnapshots={session.whiteboardSnapshots}
      onBack={handleBack}
      onSelectProblem={session.handleSelectProblem}
      onRequestTips={session.handleRequestTips}
      onWhiteboardChange={session.handleWhiteboardChange}
      onSetAnswers={session.setAnswers}
      onCheckAnswers={session.handleCheckAnswers}
      onClearFeedback={() => session.setFeedback(null)}
    />
  );
}