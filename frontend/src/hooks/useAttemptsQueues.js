import { useRef, useEffect, useCallback } from 'react';
import { flushAttempts, PROGRESS_URL } from '../api/progress';

const QUEUE_KEY = 'attempt_queue';
const FLUSH_MS = 30_000;

function readQueue()   { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]'); } catch { return []; } }
function writeQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {} }
function clearQueue()  { localStorage.removeItem(QUEUE_KEY); }

export function useAttemptQueue(token, endpoint = PROGRESS_URL) {
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const flush = useCallback(async () => {
    const queue = readQueue();
    if (!queue.length) return;
    clearQueue();
    try {
      await flushAttempts(queue, tokenRef.current, endpoint);
    } catch {
      writeQueue([...readQueue(), ...queue]);
    }
  }, [endpoint]);

  const beaconFlush = useCallback(() => {
    const queue = readQueue();
    if (!queue.length) return;
    clearQueue();
    fetch(endpoint, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRef.current}`,
      },
      body: JSON.stringify({ attempts: queue }),
    }).catch(() => {});
  }, [endpoint]);

  useEffect(() => {
    const interval = setInterval(flush, FLUSH_MS);
    window.addEventListener('beforeunload', beaconFlush);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', beaconFlush);
      flush();
    };
  }, [flush, beaconFlush]);

  const enqueue = useCallback((attempt) => {
    writeQueue([...readQueue(), { ...attempt, attempted_at: new Date().toISOString() }]);
  }, []);

  return { enqueue, flushQueue: flush };
}