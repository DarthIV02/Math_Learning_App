import { useState, useMemo, useCallback } from 'react';

import { useSessionPersistence } from './useSessionPersistance';
import { useAttemptQueue } from './useAttemptsQueues';
import { useProblemTimer } from './useProblemTimer';

import { awardProblemCoins } from '../api/users';

export function useSolveProblemsSession({ problems, token, userId, coinsPerProblem = 10, onCoinsEarned }) {
  const [selectedProblem, setSelectedProblem] = useState(1);
  const [tips, setTips] = useState([]);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [whiteboardSnapshots, setWhiteboardSnapshots] = useState({});

  const sessionId = problems.map((p) => p.id).join('-');

  const persistenceKey =
    `session:${userId}:${sessionId}`;

  const {
    load,
    saveDebounced,
    saveNow,
    cancelPendingSave,
  } = useSessionPersistence(persistenceKey);

  const [answersByProblem, setAnswersByProblem] = useState(
    () => load()?.answersByProblem ?? {}
  );

  const [solvedProblems, setSolvedProblems] = useState(
    () => load()?.solvedProblems ?? {}
  );

  const problemIndex = selectedProblem - 1;
  const problem = problems[problemIndex];
  const answers = answersByProblem[problemIndex] ?? {};

  const { enqueue, flushQueue } = useAttemptQueue(token);
  const getTimeSpent = useProblemTimer(problemIndex);

  const allProblemsSolved =
    problems.length > 0 && Object.keys(solvedProblems).length === problems.length;
  
  const coinsWon = problems.length * coinsPerProblem;

  const answerItems = useMemo(() => {
    if (!problem?.correct_answers) return [];

    return Object.entries(problem.correct_answers).map(([key, value]) => ({
      key,
      label: key,
      type: typeof value === 'number' ? 'number' : 'boolean',
    }));
  }, [problem]);

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

  const setAnswers = useCallback(
    (updater) => {
      setAnswersByProblem((prev) => {
        const current = prev[problemIndex] ?? {};
        const nextAnswers =
          typeof updater === 'function' ? updater(current) : updater;

        const next = {
          ...prev,
          [problemIndex]: nextAnswers,
        };

        saveDebounced({
          answersByProblem: next,
          solvedProblems,
        });

        return next;
      });
    },
    [problemIndex, saveDebounced, solvedProblems]
  );

  const handleWhiteboardChange = useCallback(
    ({ placed, drawing }) => {
      setWhiteboardSnapshots((prev) => ({
        ...prev,
        [problemIndex]: { placed, drawing },
      }));
    },
    [problemIndex]
  );

  const handleSelectProblem = useCallback((num) => {
    setSelectedProblem(num);
    setTips([]);
    setFeedback(null);
  }, []);

  const handleRequestTips = useCallback(async () => {
    setIsLoadingTip(true);

    try {
      setTips(problem?.tips ?? []);
    } finally {
      setIsLoadingTip(false);
    }
  }, [problem]);

  const handleCheckAnswers = useCallback(async () => {
    if (!problem) return;

    const correct = problem.correct_answers;
    const timeSpent = getTimeSpent();

    const allCorrect = Object.entries(correct).every(([key, value]) =>
      String(answers[key] ?? '').trim() === String(value)
    );

    enqueue({
      problem_id: problem.id,
      answer_given: JSON.stringify(answers),
      is_correct: allCorrect,
      time_spent_seconds: timeSpent,
      score: allCorrect ? 100 : 0,
    });

    if (allCorrect && !solvedProblems[problemIndex]) { // All correct for EVERY problem (not the exercise sheet)
      const nextSolved = {
        ...solvedProblems,
        [problemIndex]: { solvedAt: Date.now() },
      };

      setSolvedProblems(nextSolved);

      const updatedUser = await awardProblemCoins(
        problem.id,
        coinsPerProblem,
        token
      );
      onCoinsEarned?.(coinsPerProblem);

      saveNow({
        answersByProblem,
        solvedProblems: nextSolved,
      });

      setFeedback({ type: 'correct', message: 'Super! +10 Münzen 🪙' });
    } else {
      setFeedback({ type: 'wrong', message: 'Fast! Versuch es nochmal 😊' });
    }
  }, [
    problem,
    answers,
    enqueue,
    getTimeSpent,
    solvedProblems,
    problemIndex,
    saveNow,
    answersByProblem,
  ]);

  const resetSession = useCallback(() => {
    cancelPendingSave();

    setSolvedProblems({});
    setAnswersByProblem({});
    setWhiteboardSnapshots({});
    setSelectedProblem(1);
    setTips([]);
    setFeedback(null);

    saveNow({
      answersByProblem: {},
      solvedProblems: {},
    });
  }, [saveNow, cancelPendingSave]);

  return {
    selectedProblem,
    problemIndex,
    problem,
    answers,
    answerItems,
    stickers,
    tips,
    isLoadingTip,
    feedback,
    whiteboardSnapshots,
    solvedProblems,
    allProblemsSolved,
    coinsWon,
    setFeedback,
    setAnswers,
    handleSelectProblem,
    handleRequestTips,
    handleWhiteboardChange,
    handleCheckAnswers,
    resetSession,
    flushQueue
  };
}