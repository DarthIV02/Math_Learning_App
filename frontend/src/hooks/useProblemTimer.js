import { useEffect, useRef } from 'react';

// Returns a function that stops the timer and returns elapsed seconds
export function useProblemTimer(problemIndex) {
  const startRef = useRef(Date.now());

  // Reset whenever the student switches problem
  useEffect(() => {
    startRef.current = Date.now();
  }, [problemIndex]);

  const stop = () => Math.round((Date.now() - startRef.current) / 1000);
  return stop;
}