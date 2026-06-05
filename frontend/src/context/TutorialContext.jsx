import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TutorialContext = createContext(null);

export const TUTORIAL_STEPS = [
  { id: 'welcome',    page: 'home',          target: 'home-welcome',     title: 'Willkommen! 👋',          text: 'Lass uns kurz zeigen, wie die App funktioniert!',               placement: 'bottom' },
  { id: 'home',       page: 'home',          target: 'home-nav',         title: 'Deine Startseite 🏠',     text: 'Hier findest du Aufgaben, die zu deinem Lernstand passen. Du kannst auch eigene Aufgaben hochladen und gemeinsam mit uns lösen!', placement: 'top'},
  {
    id: 'topic-selection',
    page: 'select-topic',
    target: 'topic-selection-nav',
    title: 'Wähle deinen Lernbereich 📚',
    text:
      'Hier kannst du auswählen, welche Sachaufgaben du üben möchtest — zum Beispiel Plus, Minus, Mal oder verschiedene Themen.',
    placement: 'top'
  },
  { id: 'difficulty', page: 'select-topic',  target: 'difficulty-tabs',  title: 'Wähle deine Stufe! ⭐',   text: 'Leicht, Mittel oder Schwer — du kannst es jederzeit ändern.',   placement: 'bottom' },
  { id: 'topic',      page: 'select-topic',  target: 'topic-grid',       title: 'Wähle ein Thema 📚',      text: 'Klicke auf eine Rechenart oder ein Thema, das dir gefällt.',    placement: 'auto' },
  {
    id: 'random',
    page: 'select-topic',
    target: 'random-btn',
    title: 'Überrasch mich! 🎲',
    text: 'Klicke hier, um mit zufälligen Sachaufgaben zu starten.',
    placement: 'top',
    waitForUserAction: true
  },
  { id: 'whiteboard', page: 'solve-problems',target: 'whiteboard',       title: 'Deine Tafel 🎨',          text: 'Du kannst hier malen oder Sticker verschieben — so kannst du dir die Aufgabe leichter vorstellen!',     placement: 'bottom' },
  { id: 'answer',     page: 'solve-problems',target: 'answer-input',     title: 'Deine Antwort ✏️',        text: 'Schreibe hier dein Ergebnis hin.',                             placement: 'top' },
  {
    id: 'tips',
    page: 'solve-problems',
    target: 'tips-button',
    title: 'Brauchst du Hilfe? 💡',
    text:
      'Wenn du feststeckst, klicke hier. Wir schauen uns deine Zeichnung und deine bisherigen Ideen an und geben dir einen passenden Tipp!',
    placement: 'auto'
  },
];

export function TutorialProvider({
  children,
  onNavigate,
  startRef,
  goToStepRef,
  onComplete,
  currentStepRef,
}) {
  const [stepIndex, setStepIndex] = useState(null);

  const isActive = stepIndex !== null;
  const currentStep = isActive ? TUTORIAL_STEPS[stepIndex] : null;

  const start = useCallback(() => {
    setStepIndex(0);
    onNavigate(TUTORIAL_STEPS[0].page);
  }, [onNavigate]);

  useEffect(() => {
    if (startRef) {
      startRef.current = start;
    }
  }, [start, startRef]);

  const finish = useCallback(() => {
    setStepIndex(null);

    onNavigate('home');

    onComplete?.();
  }, [onNavigate, onComplete]);

  const next = useCallback(() => {
    if (stepIndex === null) return;

    const nextIndex = stepIndex + 1;

    if (nextIndex >= TUTORIAL_STEPS.length) {
      finish();
      return;
    }

    const currentPage = TUTORIAL_STEPS[stepIndex].page;
    const nextPage = TUTORIAL_STEPS[nextIndex].page;

    if (nextPage !== currentPage) {
      onNavigate(nextPage);
    }

    setStepIndex(nextIndex);
  }, [stepIndex, onNavigate, finish]);

  const skip = useCallback(() => {
    setStepIndex(null);
    onNavigate('home');
    onComplete?.();
  }, [onNavigate, onComplete]);

  const replay = useCallback(() => {
    start();
  }, [start]);

  const goToStep = useCallback((id, options = {}) => {
    const { navigate = true } = options;

    const index = TUTORIAL_STEPS.findIndex((step) => step.id === id);
    if (index === -1) return;

    setStepIndex(index);

    if (navigate) {
      onNavigate(TUTORIAL_STEPS[index].page);
    }
  }, [onNavigate]);

  useEffect(() => {
    if (goToStepRef) {
      goToStepRef.current = goToStep;
    }
  }, [goToStep, goToStepRef]);

  useEffect(() => {
    if (currentStepRef) {
      currentStepRef.current = currentStep;
    }
  }, [currentStep, currentStepRef]);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        stepIndex,
        total: TUTORIAL_STEPS.length,
        start,
        next,
        skip,
        replay,
        goToStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}