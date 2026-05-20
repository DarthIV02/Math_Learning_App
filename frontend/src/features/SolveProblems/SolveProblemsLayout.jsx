import BackgroundLayer from '../../components/Background/BackgroundLayer';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';
import AnswerInput from '../../components/InputAnswer/InputAnswer';

import Whiteboard from '../Whiteboard';
import ProblemNumSelector from '../ProblemNumSelector/ProblemNumSelector';
import AnswerFeedback from '../AnswerFeedback/AnswerFeedback';

export default function SolveProblemsLayout({
  problem,
  problemIndex,
  selectedProblem,
  totalProblems,
  answers,
  answerItems,
  stickers,
  tips,
  isLoadingTip,
  feedback,
  solvedProblems,
  whiteboardSnapshots,
  onBack,
  onSelectProblem,
  onRequestTips,
  onWhiteboardChange,
  onSetAnswers,
  onCheckAnswers,
  onClearFeedback,
}) {
  return (
    <main className="solve-page relative min-h-screen overflow-y-auto">
      <BackgroundLayer />

      <div className="solve-page__content relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4">
        <ProblemNumSelector
          selectedProblem={selectedProblem}
          onSelectProblem={onSelectProblem}
          totalProblems={totalProblems}
          onBack={onBack}
        />

        <div className="solve-layout grid w-full gap-4">
          <section className="solve-area-problem">
            <SurfaceCard className="rounded-[1.5rem] bg-emerald-50 p-4 md:p-5">
              <p className="text-lg font-bold leading-relaxed text-slate-700 md:text-xl">
                {problem.question_text}
              </p>
            </SurfaceCard>
          </section>

          <section className="solve-area-whiteboard">
            <Whiteboard
              key={problemIndex}
              stickers={stickers}
              tips={tips}
              isLoadingTip={isLoadingTip}
              onRequestTips={onRequestTips}
              initialSnapshot={whiteboardSnapshots[problemIndex]}
              onSnapshotChange={onWhiteboardChange}
            />
          </section>

          <section className="solve-area-answer">
            <AnswerFeedback
              feedback={feedback}
              onClear={onClearFeedback}
            />

            <AnswerInput
              items={answerItems}
              answers={answers}
              setAnswers={onSetAnswers}
              onCheck={onCheckAnswers}
              readOnly={!!solvedProblems[problemIndex]}
            />
          </section>
        </div>
      </div>
    </main>
  );
}