import BackgroundLayer from '../../components/Background/BackgroundLayer';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';
import AnswerInput from '../../components/InputAnswer/InputAnswer';

import Whiteboard from '../Whiteboard';
import ProblemNumSelector from '../ProblemNumSelector/ProblemNumSelector';
import AnswerFeedback from '../AnswerFeedback/AnswerFeedback';

function ProblemGeneratingState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <SurfaceCard className="flex w-full max-w-md flex-col items-center gap-4 rounded-[1.5rem] bg-white/80 px-10 py-12 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-60" />
          <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-400 text-3xl">
            ✏️
          </span>
        </div>

        <div>
          <p className="text-xl font-bold text-slate-700">
            Diese Aufgabe wird noch vorbereitet.
          </p>

          <p className="mt-1 text-base text-slate-500">
            Du kannst inzwischen an einer anderen Aufgabe weiterarbeiten ✨
          </p>
        </div>
      </SurfaceCard>
    </div>
  );
}

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
  const isGenerating =
    problem?.is_placeholder === true || problem?.status === 'generating';

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

        <div className="flex flex-1">
          {isGenerating ? (
            <ProblemGeneratingState />
          ) : (
            <div className="solve-layout grid w-full gap-4">
              <section className="solve-area-problem">
                <SurfaceCard className="rounded-[1.5rem] bg-emerald-50 p-4 md:p-5">
                  <p className="text-lg font-bold leading-relaxed text-slate-700 md:text-xl">
                    {problem.question_text}
                  </p>
                </SurfaceCard>
              </section>

              <section className="solve-area-whiteboard" data-tutorial="whiteboard">
                <Whiteboard
                  snapshotKey={problemIndex}
                  stickers={stickers}
                  tips={tips}
                  isLoadingTip={isLoadingTip}
                  onRequestTips={onRequestTips}
                  initialSnapshot={whiteboardSnapshots[problemIndex]}
                  onSnapshotChange={onWhiteboardChange}
                />
              </section>

              <section className="solve-area-answer">
                <AnswerFeedback feedback={feedback} onClear={onClearFeedback} />

                <AnswerInput
                  items={answerItems}
                  answers={answers}
                  setAnswers={onSetAnswers}
                  onCheck={onCheckAnswers}
                  readOnly={!!solvedProblems[problemIndex]}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}