import { useEffect, useRef } from 'react';
import { fetchGenerationStatus } from '../api/problem';

export function useGenerationPolling({ problems, setProblems, intervalMs = 4000 }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    const placeholders = problems.filter(p => p?.is_placeholder);

    if (placeholders.length === 0) {
      clearInterval(intervalRef.current);
      return;
    }

    // Usually a single job, but handle multiple if listProblems was called more than once
    const requestIds = [...new Set(placeholders.map(p => p.generation_request_id))];

    intervalRef.current = setInterval(async () => {
      try {
        for (const requestId of requestIds) {
          const status = await fetchGenerationStatus(requestId);

          if (status.problems.length) {
            setProblems(prev =>
              prev.map(p => {
                if (!p?.is_placeholder || p.generation_request_id !== requestId) return p;
                const match = status.problems.find(
                  r => r.placeholder_index === p.placeholder_index
                );
                return match ? match.problem : p;
              })
            );
          }

          console.log(status.problems);

          if (status.status === 'failed') {
            setProblems(prev =>
              prev.map(p =>
                p?.is_placeholder && p.generation_request_id === requestId
                  ? { ...p, status: 'failed' }
                  : p
              )
            );
          }
        }
      } catch (err) {
        console.error('Polling generation status failed:', err);
      }
    }, intervalMs);

    return () => clearInterval(intervalRef.current);
  }, [problems, setProblems, intervalMs]);
}