import './styles/SolveProblems.css';

import BackgroundLayer from '../components/Background/BackgroundLayer';
import SurfaceCard from '../components/SurfaceCard/SurfaceCard';
import AnswerInput from '../components/InputAnswer/InputAnswer';

import Whiteboard from '../features/Whiteboard';
import ProblemNumSelector from '../features/ProblemNumSelector/ProblemNumSelector';
import AnswerFeedback from '../features/AnswerFeedback/AnswerFeedback';

import { useState, useMemo, useCallback } from 'react';

export default function SolveProblemPage({ onNavigate, problems = [] }) {
  const [selectedProblem, setSelectedProblem] = useState(1);
  const [answersByProblem, setAnswersByProblem] = useState({});
  const [tips, setTips] = useState([]);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState({});

  // One whiteboard snapshot per problem index: { placed: [], drawing: <dataURL> }
  const [whiteboardSnapshots, setWhiteboardSnapshots] = useState({});

  const problem = problems[selectedProblem - 1];
  const problemIndex = selectedProblem - 1;
  const answers = answersByProblem[problemIndex] ?? {};

  const answerItems = useMemo(() => {
    if (!problem?.correct_answers) return [];

    return Object.entries(problem.correct_answers).map(([key, value]) => ({
      key,
      label: key,
      type: typeof value === 'number' ? 'number' : 'boolean',
    }));
  }, [problem]);

  const setAnswers = (updater) => {
    setAnswersByProblem((prev) => {
      const current = prev[problemIndex] ?? {};

      const nextAnswers =
        typeof updater === 'function'
          ? updater(current)
          : updater;

      return {
        ...prev,
        [problemIndex]: nextAnswers,
      };
    });
  };

  const stickers = useMemo(() => {
    if (!problem) return [];
    return (problem.subject_object ?? []).map((name, i) => ({
      id: `sticker-${i}`,
      emoji: problem.emojis?.[i] ?? '📦',
      label: name,
      color: problem.colors?.[i] ?? undefined,
      defaultValue: 1,
    }));
  }, [problem]);

  // Called by Whiteboard whenever its state changes
  const handleWhiteboardChange = useCallback(({ placed, drawing }) => {
    setWhiteboardSnapshots((prev) => ({
      ...prev,
      [problemIndex]: { placed, drawing },
    }));
  }, [problemIndex]);

  const handleSelectProblem = (num) => {
    setSelectedProblem(num);
    setTips([]);
  };

  const handleRequestTips = async ({ placed, canvas }) => {
    setIsLoadingTip(true);
    try {
      setTips(problem.tips ?? []);
    } finally {
      setIsLoadingTip(false);
    }
  };

  const handleCheckAnswers = () => {
    const correct = problem.correct_answers;

    const allCorrect = Object.entries(correct).every(([key, value]) => {
      return String(answers[key] ?? '').trim() === String(value);
    });

    if (allCorrect) {
      setSolvedProblems((prev) => ({
        ...prev,
        [problemIndex]: true,
      }));

      setFeedback({
        type: 'correct',
        message: 'Super! 🎉',
      });
    } else {
      setFeedback({
        type: 'wrong',
        message: 'Fast! Versuch es nochmal 😊',
      });
}
  };

  if (!problems.length) {
    return (
      <main className="solve-page relative min-h-screen overflow-y-auto">
        <BackgroundLayer />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-lg text-slate-600">Keine Aufgaben geladen.</p>
            <button
              className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white"
              onClick={() => onNavigate('select-topic')}
            >
              Thema wählen
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="solve-page relative min-h-screen overflow-y-auto">
      <BackgroundLayer />

      <div className="solve-page__content relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4">
        <ProblemNumSelector
          selectedProblem={selectedProblem}
          onSelectProblem={handleSelectProblem}
          totalProblems={problems.length}
          onBack={() => onNavigate('select-topic')}
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
              onRequestTips={handleRequestTips}
              initialSnapshot={whiteboardSnapshots[problemIndex]}
              onSnapshotChange={handleWhiteboardChange}
            />
          </section>

          <section className="solve-area-answer">
            <AnswerFeedback
              feedback={feedback}
              onClear={() => setFeedback(null)}
            />

            <AnswerInput
              items={answerItems}
              answers={answers}
              setAnswers={setAnswers}
              onCheck={handleCheckAnswers}
              readOnly={!!solvedProblems[problemIndex]}
            />
          </section>
        </div>
      </div>
    </main>
  );
}