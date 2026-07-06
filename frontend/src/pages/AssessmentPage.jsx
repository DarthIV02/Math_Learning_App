import { useState, useEffect } from 'react';
import BackgroundLayer from '../components/Background/BackgroundLayer';
import SurfaceCard from '../components/SurfaceCard/SurfaceCard';

import SolveProblemsLayout from '../features/SolveProblems/SolveProblemsLayout';

import { useSolveProblemsSession } from '../hooks/useSolveProblemsSession';

import mascotImage from '../assets/icons/student_hello.png';

import { fetchAssessmentProblems } from '../api/problem';

import './styles/AssessmentPage.css';

const API_URL =
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3001/api`;
const ASSESSMENT_SUBMIT_URL = `${API_URL}/assessment/submit`;

function Mascot() {
  return <img src={mascotImage} alt="Mascot" className="assessment-mascot" />;
}

function WelcomeScreen({ onStart, questionCount }) {
  return (
    <div className="assessment-screen assessment-screen--welcome">
      <Mascot />
      <h1 className="assessment-welcome-title">Schön, dass du da bist! 👋</h1>
      <p className="assessment-welcome-sub">
        Sieht aus, als wärst du neu hier. Lass uns kurz schauen, was du schon
        kannst — damit wir die richtigen Aufgaben für dich finden.
      </p>
      <div className="assessment-info-box">
        <span className="assessment-info-icon">🧮</span>
        <div>
          <div className="assessment-info-title">{questionCount} kurze Rechenaufgaben</div>
          <div className="assessment-info-sub">Dauert weniger als 20 Minuten</div>
        </div>
      </div>
      <button className="assessment-btn assessment-btn--primary" onClick={onStart}>
        Los geht's!
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="assessment-screen assessment-screen--loading">
      <div className="assessment-loading-spinner" />
      <p className="assessment-loading-text">Einen Moment...</p>
    </div>
  );
}

export default function AssessmentPage({ token, user, onAssessmentComplete }) {
  const [phase, setPhase] = useState('loading');
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    fetchAssessmentProblems(user?.grade)
      .then((data) => {
        setProblems(data);
        setPhase('welcome');
      })
      .catch((error) => {
        console.error(error);
        setPhase('error');
      });
  }, []); 

  const session = useSolveProblemsSession({
    problems,
    token,
    userId: user?.id,
    coinsPerProblem: 0,
    awardCoins: false,
    attemptsEndpoint: ASSESSMENT_SUBMIT_URL,
  });

  const handleStart = () => setPhase('quiz');

  useEffect(() => {
    if (phase === 'quiz' && session.allProblemsSolved) {
      setPhase('submitting');
      session.flushQueue().then(() => onAssessmentComplete?.());
    }
  }, [phase, session.allProblemsSolved]);

  return (
    <div className="assessment-page">
      {/* Only render this background if we are NOT in the quiz phase */}
      {phase !== 'quiz' && <BackgroundLayer />}
      
      {phase === 'quiz' ? (
        /* 1. QUIZ PHASE: Render layout directly without the padded container wrapper.
        */
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
          onBack={null}
          onSelectProblem={session.handleSelectProblem}
          onRequestTips={session.handleRequestTips}
          onWhiteboardChange={session.handleWhiteboardChange}
          onSetAnswers={session.setAnswers}
          onCheckAnswers={session.handleCheckAnswers}
          onClearFeedback={() => session.setFeedback(null)}
        />
      ) : (
        <div className="assessment-page__content">
          <SurfaceCard>
            {phase === 'loading' && <LoadingScreen />}
            {phase === 'error' && <p>Etwas ist schiefgelaufen. Bitte versuche es erneut.</p>}
            {phase === 'welcome' && <WelcomeScreen onStart={handleStart} questionCount={problems.length} />}
            {phase === 'submitting' && <LoadingScreen />}
          </SurfaceCard>
        </div>
      )}
    </div>
  );
}