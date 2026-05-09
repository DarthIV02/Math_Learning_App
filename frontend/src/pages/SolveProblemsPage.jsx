import './styles/SolveProblems.css';
import AnswerInput from '../components/InputAnswer/InputAnswer';
import Whiteboard from '../features/Whiteboard';
import ProblemNumSelector from '../features/ProblemNumSelector/ProblemNumSelector';
import BackgroundLayer from '../components/Background/BackgroundLayer';
import SurfaceCard from '../components/SurfaceCard/SurfaceCard';
import { useState } from 'react';

export default function SolveProblemPage({ onNavigate }) {
  const [answers, setAnswers] = useState({
    red: '',
    yellow: '',
    blue: '',
  });
  const [selectedProblem, setSelectedProblem] = useState(1);

  const problemText =
    'Lisa hat 600 Legosteine. Die Hälfte davon ist rot. Die andere Hälfte besteht zu gleichen Teilen aus gelben und blauen Steinen. Wie viele Legosteine sind es jeweils?';

  const handleCheckAnswer = () => {
    alert(`Deine Antwort: ${answer}`);
  };

  const STICKERS = [
    { id: 'lego-red',  emoji: '🧱', label: 'Rot', color: '#c0392b', defaultValue: 1 },
    { id: 'lego-blue', emoji: '🧱', label: 'Blau', color: '#6d8fd2', defaultValue: 1 },
    { id: 'lego-yellow',emoji: '🧱', label: 'Gelb', color: '#d5d52d', defaultValue: 1 },
    { id: 'person',emoji: '👧', label: 'Kind', defaultValue: 1 },

  ];

  const [tips, setTips] = useState([]);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  const handleRequestTips = async ({ placed, canvas }) => {
    setIsLoadingTip(true);

    try {
      // Later: replace this with your real API call.
      // Send: problemText, placed stickers, answers, and canvas image.
      console.log({
        problemText,
        placed,
        answers,
        canvas,
      });

      setTips([
        'Ich sehe deine Sticker. Überlege zuerst: Was ist die Hälfte von 600?',
        'Rot ist die Hälfte. Danach bleiben 300 für Gelb und Blau.',
        'Gelb und Blau sind gleich viele — teile 300 durch 2.',
      ]);
    } finally {
      setIsLoadingTip(false);
    }
  };

  return (
    <main className="solve-page relative min-h-screen overflow-y-auto">
      <BackgroundLayer />

      <div className="solve-page__content relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4">
        <ProblemNumSelector
          selectedProblem={selectedProblem}
          onSelectProblem={setSelectedProblem}
          totalProblems={10}
          onBack={() => onNavigate('home')}
        />

        <div className="solve-layout grid w-full gap-4">
          <section className="solve-area-problem">
            <SurfaceCard className="rounded-[1.5rem] bg-emerald-50 p-4 md:p-5">
              <p className="text-lg font-bold leading-relaxed text-slate-700 md:text-xl">
                {problemText}
              </p>
            </SurfaceCard>
          </section>

          <section className="solve-area-whiteboard">
            <Whiteboard
              stickers={STICKERS}
              tips={tips}
              isLoadingTip={isLoadingTip}
              onRequestTips={handleRequestTips}
            />
          </section>

          <section className="solve-area-answer">
            <AnswerInput
              items={[
                { key: 'red', label: 'Rot' },
                { key: 'yellow', label: 'Gelb' },
                { key: 'blue', label: 'Blau' },
              ]}
              answers={answers}
              setAnswers={setAnswers}
              onCheck={() => console.log(answers)}
            />
          </section>
        </div>
      </div>
    </main>
  );
}